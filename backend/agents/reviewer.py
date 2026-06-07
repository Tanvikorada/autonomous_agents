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

Your job is to review the provided code and tests, then produce a structured markdown review report.

Your review MUST include these sections:

## ✅ Strengths
List what is done well (2-4 points).

## ⚠️ Issues Found
List specific bugs, anti-patterns, or missing features. Be precise — include line references if possible.

## 🔧 Suggested Fixes
For each issue, provide the corrected code snippet or a clear description of how to fix it.

## 📊 Quality Score
Rate the overall code quality: X/10 and explain the score in one sentence.

Be honest, specific, and actionable. Do not be vague.
"""


def run_reviewer(state: AgentState) -> AgentState:
    """
    Reviewer Agent node for LangGraph.
    
    Takes code + tests from state, produces a structured markdown review.
    Returns updated state with `review` populated and `status` = "done".
    """
    job_id = state["job_id"]
    problem = state["problem"]
    code = state.get("code") or "No code was generated."
    tests = state.get("tests") or "No tests were generated."

    logger.info(f"[{job_id}] Reviewer Agent starting...")
    job_store.update(job_id, {"status": "reviewing", "current_agent": "Reviewer"})

    try:
        llm = get_llm(temperature=0.4)
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(
                content=(
                    f"Original Problem:\n{problem}\n\n"
                    f"--- CODE ---\n```python\n{code}\n```\n\n"
                    f"--- TESTS ---\n```python\n{tests}\n```\n\n"
                    "Perform a thorough code review following the required format."
                )
            ),
        ]

        response = llm.invoke(messages)
        review = response.content.strip()

        logger.info(f"[{job_id}] Reviewer produced {len(review)} characters of review.")
        job_store.update(job_id, {"review": review, "status": "done", "current_agent": None})

        return {**state, "review": review, "status": "done", "current_agent": None}

    except Exception as e:
        logger.error(f"[{job_id}] Reviewer Agent error: {e}")
        job_store.update(job_id, {"status": "error", "error": str(e)})
        return {**state, "status": "error", "error": str(e)}
