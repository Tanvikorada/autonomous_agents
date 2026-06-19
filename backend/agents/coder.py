"""
agents/coder.py — Coder Agent.
Generates clean, working Python code based on the Planner's output.
"""
import os
import logging
from langchain_core.messages import SystemMessage, HumanMessage
from backend.core.llm import get_llm
from backend.core.state import AgentState
from backend.storage.memory_store import job_store
from backend.core.memory import get_project_memory

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a senior polyglot software developer with 10 years of experience.

Your job is to write clean, working, production-quality code based on a given implementation plan.

Rules:
- Write complete, runnable code in the appropriate language.
- Use clear variable names and add brief inline comments.
- Include proper error handling (try/except/catch where needed).
- Do NOT include any explanation or markdown outside the code block.
- Output ONLY the code.
- If multiple files are needed, clearly separate them with a comment like: # ===== FILE: filename.ext =====
"""


def run_coder(state: AgentState) -> AgentState:
    """
    Coder Agent node for LangGraph.
    
    Takes the plan from state, calls the LLM to generate code,
    and returns updated state with `code` populated.
    """
    job_id = state["job_id"]
    problem = state["problem"]
    plan = state.get("plan") or []
    retries = state.get("retries", 0)
    test_output = state.get("test_output")

    logger.info(f"[{job_id}] Coder Agent starting... (Attempt {retries + 1})")
    job_store.update(job_id, {"status": "coding", "current_agent": "Coder"})

    plan_text = "\n".join(plan) if plan else "No plan provided — infer from the problem."
    
    # Context retrieval using real RAG
    from backend.core.rag import retrieve_context
    context_text = ""
    retrieved_chunks = []
    # Using the Dayos repo for self-hosting context, or fallback to user input
    # In a fully fleshed system, this would be passed dynamically from the job submission
    target_repo = os.environ.get("TARGET_REPO", "c:/Users/Tanvi/Desktop/autonomous agents")
    
    try:
        chunks = retrieve_context(target_repo, problem, top_k=5)
        if chunks:
            retrieved_chunks = chunks
            for chunk in chunks:
                context_text += f"\n--- {chunk['source']} ---\n{chunk['content']}\n"
    except Exception as e:
        logger.error(f"Failed to retrieve context: {e}")

    try:
        llm = get_llm(agent_name="coder", temperature=0.2)
        
        repo_url = state.get("repo_url", "")
        memory_context = get_project_memory(repo_url)

        prompt_content = (
            f"Original Problem:\n{problem}\n\n"
            f"Implementation Plan:\n{plan_text}\n\n"
        )
        
        if memory_context:
            prompt_content += f"Architectural Lessons & Preferences for this Repo:\n{memory_context}\n\n"
        
        if context_text:
            prompt_content += f"Retrieved Context from Repo:\n{context_text}\n\n"
            
        if retries > 0 and test_output:
            prompt_content += f"Previous attempt failed tests. Fix the code to pass these tests:\n```\n{test_output}\n```\n\n"
            
        prompt_content += "Now write the complete implementation. Output standard Unified Diffs (```diff) for existing files, or full file contents (```language) for new files. Separate multiple files with # ===== FILE: filename ====="

        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=prompt_content),
        ]

        response = llm.invoke(messages)
        code = response.content.strip()

        token_usage = response.response_metadata.get("token_usage", {})
        tokens_used = token_usage.get("total_tokens", len(code) // 3)
        cost = tokens_used * 0.000005
        
        total_tokens = state.get("total_tokens", 0) + tokens_used
        total_cost = state.get("total_cost", 0.0) + cost
        
        agent_metrics = state.get("agent_metrics") or {}
        agent_metrics["coder"] = {"tokens": tokens_used, "cost": cost}

        # Strip markdown code fences if the LLM wraps in them
        if code.startswith("```python") or code.startswith("```diff"):
            lines = code.split("\n")
            code = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])

        logger.info(f"[{job_id}] Coder produced {len(code)} characters of code. Tokens used: {tokens_used}")
        update_data = {
            "code": code,
            "total_tokens": total_tokens,
            "total_cost": total_cost,
            "current_agent": "Coder",
            "retrieved_context": retrieved_chunks,
            "agent_metrics": agent_metrics
        }
        job_store.update(job_id, update_data)

        return {**state, **update_data}

    except Exception as e:
        logger.error(f"[{job_id}] Coder Agent error: {e}")
        job_store.update(job_id, {"status": "error", "error": str(e)})
        return {**state, "status": "error", "error": str(e)}
