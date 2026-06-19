"""
agents/reviewer.py — Reviewer Agent.
Reviews code quality and test completeness, then suggests concrete improvements.
"""
import logging
from langchain_core.messages import SystemMessage, HumanMessage
from backend.core.llm import get_llm
from backend.core.state import AgentState
from backend.storage.memory_store import job_store
from backend.core.memory import append_project_memory
import os
import re
import tempfile
import shutil

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a principal engineer conducting a thorough code review.

Your job is to review the provided code and tests, then produce a structured JSON response.

You MUST output ONLY valid JSON with no markdown wrapping and no backticks. The JSON must match this structure exactly:
{
  "strengths": ["List what is done well"],
  "issues_found": ["List specific bugs, anti-patterns, or missing features"],
  "suggested_fixes": ["For each issue, provide how to fix it"],
  "quality_score": "X/10 (explain)",
  "risk_score": 5,
  "confidence": "high/medium/low. Example: this fix touches a function called from 5 other places, higher regression risk."
}
"""

def run_reviewer(state: AgentState) -> AgentState:
    """
    Reviewer Agent node for LangGraph.
    
    Takes code + tests from state, produces a structured JSON review.
    Returns updated state with `review` populated and `status` = "done".
    """
    job_id = state["job_id"]
    problem = state["problem"]
    code = state.get("code") or "No code was generated."
    tests = state.get("tests") or "No tests were generated."

    logger.info(f"[{job_id}] Reviewer Agent starting...")
    job_store.update(job_id, {"status": "reviewing", "current_agent": "Reviewer"})

    try:
        llm = get_llm(agent_name="reviewer", temperature=0.4)
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(
                content=(
                    f"Original Problem:\n{problem}\n\n"
                    f"--- CODE ---\n```python\n{code}\n```\n\n"
                    f"--- TESTS ---\n```python\n{tests}\n```\n\n"
                    "Perform a thorough code review and output the JSON response."
                )
            ),
        ]

        response = llm.invoke(messages)
        review_text = response.content.strip()

        token_usage = response.response_metadata.get("token_usage", {})
        tokens_used = token_usage.get("total_tokens", len(review_text) // 3)
        cost = tokens_used * 0.000005
        
        total_tokens = state.get("total_tokens", 0) + tokens_used
        total_cost = state.get("total_cost", 0.0) + cost
        
        agent_metrics = state.get("agent_metrics") or {}
        agent_metrics["reviewer"] = {"tokens": tokens_used, "cost": cost}

        if review_text.startswith("```json"):
            review_text = review_text.replace("```json", "").replace("```", "").strip()
        elif review_text.startswith("```"):
            review_text = review_text.replace("```", "").strip()

        import json
        try:
            review_json = json.loads(review_text)
            review = json.dumps(review_json, indent=2)
            risk_score = review_json.get("risk_score")
            confidence = review_json.get("confidence")
        except Exception:
            review = review_text
            risk_score = None
            confidence = None

        logger.info(f"[{job_id}] Reviewer produced {len(review)} characters of review. Tokens used: {tokens_used}")
        
        # Memory Extraction
        repo_url = state.get("repo_url")
        if repo_url:
            try:
                mem_msg = [
                    SystemMessage(content="You are an architect. Extract 1-2 core architectural lessons or style preferences from this code to remember for future tasks. Output only the lessons as bullet points."),
                    HumanMessage(content=f"Code:\n{code}\n\nReview:\n{review}")
                ]
                mem_resp = llm.invoke(mem_msg)
                append_project_memory(repo_url, mem_resp.content.strip())
            except Exception as e:
                logger.error(f"Memory extraction failed: {e}")

        # Open PR if successful and repo exists
        if repo_url and state.get("test_passed"):
            _open_pr_for_job(job_id, repo_url, code)
            
        update_data = {
            "review": review, 
            "review_risk_score": risk_score,
            "review_confidence": confidence,
            "status": "done", 
            "current_agent": None,
            "total_tokens": total_tokens,
            "total_cost": total_cost,
            "agent_metrics": agent_metrics
        }
        job_store.update(job_id, update_data)

        return {**state, **update_data}

def _open_pr_for_job(job_id: str, repo_url: str, code: str):
    """
    Parses code blocks and pushes a new branch + PR to GitHub.
    Requires GITHUB_TOKEN.
    """
    token = os.environ.get("GITHUB_TOKEN")
    if not token or "github.com" not in repo_url:
        logger.warning("No GITHUB_TOKEN or invalid repo_url. Skipping PR creation.")
        return
        
    try:
        from github import Github
        from git import Repo
        import urllib.parse
        
        gh = Github(token)
        # Extract owner/repo
        path = urllib.parse.urlparse(repo_url).path.strip('/')
        if path.endswith('.git'):
            path = path[:-4]
            
        gh_repo = gh.get_repo(path)
        branch_name = f"dayos-feature-{job_id[:8]}"
        
        tmp_dir = tempfile.mkdtemp()
        try:
            auth_url = repo_url.replace("https://", f"https://{token}@")
            repo = Repo.clone_from(auth_url, tmp_dir)
            
            # Create branch
            new_branch = repo.create_head(branch_name)
            new_branch.checkout()
            
            # Parse code files using # ===== FILE: filename.ext =====
            files_written = 0
            current_file = None
            current_content = []
            
            for line in code.split('\n'):
                match = re.match(r'# ===== FILE:\s*(.+?)\s*=====', line)
                if match:
                    if current_file:
                        file_path = os.path.join(tmpdir, current_file)
                        os.makedirs(os.path.dirname(file_path), exist_ok=True)
                        with open(file_path, "w") as f:
                            f.write('\n'.join(current_content).strip())
                        files_written += 1
                        
                    current_file = match.group(1).strip()
                    current_content = []
                else:
                    current_content.append(line)
                    
            if current_file:
                file_path = os.path.join(tmpdir, current_file)
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
                with open(file_path, "w") as f:
                    f.write('\n'.join(current_content).strip())
                files_written += 1
                
            if files_written > 0:
                repo.git.add(A=True)
                repo.index.commit(f"Dayos auto-implementation for {job_id}")
                repo.git.push("--set-upstream", "origin", branch_name)
                
                # Open PR
                gh_repo.create_pull(
                    title=f"Dayos Implementation - Job {job_id[:8]}",
                    body=f"Automated PR created by Dayos for job `{job_id}`.",
                    head=branch_name,
                    base=gh_repo.default_branch
                )
                logger.info(f"Successfully opened PR on {repo_url} (branch: {branch_name})")
        finally:
            shutil.rmtree(tmp_dir, ignore_errors=True)
            
    except Exception as e:
        logger.error(f"Failed to open PR: {e}")



    except Exception as e:
        logger.error(f"[{job_id}] Reviewer Agent error: {e}")
        job_store.update(job_id, {"status": "error", "error": str(e)})
        return {**state, "status": "error", "error": str(e)}
