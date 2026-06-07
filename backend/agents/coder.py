"""
agents/coder.py — Coder Agent.
Generates clean, working Python code based on the Planner's output.
"""
import logging
from langchain_core.messages import SystemMessage, HumanMessage
from backend.core.llm import get_llm
from backend.core.state import AgentState
from backend.storage.memory_store import job_store

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a senior Python developer with 10 years of experience.

Your job is to write clean, working, production-quality Python code based on a given implementation plan.

Rules:
- Write complete, runnable Python code.
- Use clear variable names and add brief inline comments.
- Include proper error handling (try/except where needed).
- Use type hints throughout.
- Do NOT include any explanation or markdown outside the code block.
- Output ONLY the Python code. Start directly with imports or module docstring.
- If multiple files are needed, clearly separate them with a comment like: # ===== FILE: filename.py =====
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

    logger.info(f"[{job_id}] Coder Agent starting...")
    job_store.update(job_id, {"status": "coding", "current_agent": "Coder"})

    plan_text = "\n".join(plan) if plan else "No plan provided — infer from the problem."

    try:
        llm = get_llm(temperature=0.2)
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(
                content=(
                    f"Original Problem:\n{problem}\n\n"
                    f"Implementation Plan:\n{plan_text}\n\n"
                    "Now write the complete Python implementation."
                )
            ),
        ]

        response = llm.invoke(messages)
        code = response.content.strip()

        # Strip markdown code fences if the LLM wraps in them
        if code.startswith("```"):
            lines = code.split("\n")
            # Remove first line (```python) and last line (```)
            code = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])

        logger.info(f"[{job_id}] Coder produced {len(code)} characters of code.")
        job_store.update(job_id, {"code": code})

        return {**state, "code": code, "current_agent": "Coder"}

    except Exception as e:
        logger.error(f"[{job_id}] Coder Agent error: {e}")
        job_store.update(job_id, {"status": "error", "error": str(e)})
        return {**state, "status": "error", "error": str(e)}
