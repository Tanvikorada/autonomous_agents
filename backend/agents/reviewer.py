"""
agents/reviewer.py — Reviewer Agent.
Reviews code quality and test completeness, then suggests concrete improvements.
"""
import logging
from langchain_core.messages import SystemMessage, HumanMessage
from backend.core.llm import get_llm
from backend.core.state import AgentState
from backend.storage.memory_store import job_store

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



    except Exception as e:
        logger.error(f"[{job_id}] Reviewer Agent error: {e}")
        job_store.update(job_id, {"status": "error", "error": str(e)})
        return {**state, "status": "error", "error": str(e)}
