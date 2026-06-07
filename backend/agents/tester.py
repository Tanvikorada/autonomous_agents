"""
agents/tester.py — Tester Agent.
Generates pytest test cases for code produced by the Coder Agent.
"""
import logging
from langchain_core.messages import SystemMessage, HumanMessage
from backend.core.llm import get_llm
from backend.core.state import AgentState
from backend.storage.memory_store import job_store

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a QA engineer specializing in Python test automation.

Your job is to write comprehensive pytest test cases for the given code.

Rules:
- Write tests using pytest framework (no unittest).
- Cover: happy path, edge cases, and error/exception cases.
- Use clear test function names that describe what is being tested (test_should_...).
- Mock external dependencies (APIs, databases, file system) using pytest-mock or unittest.mock.
- Do NOT include any explanation or markdown outside the code.
- Output ONLY the test code. Start with imports.
- Aim for at least 5-8 meaningful test cases.
"""


def run_tester(state: AgentState) -> AgentState:
    """
    Tester Agent node for LangGraph.
    
    Takes the code from state and generates pytest test cases.
    Returns updated state with `tests` populated.
    """
    job_id = state["job_id"]
    problem = state["problem"]
    code = state.get("code") or ""

    logger.info(f"[{job_id}] Tester Agent starting...")
    job_store.update(job_id, {"status": "testing", "current_agent": "Tester"})

    if not code:
        logger.warning(f"[{job_id}] No code to test. Generating tests from problem only.")

    try:
        llm = get_llm(temperature=0.2)
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(
                content=(
                    f"Problem Context:\n{problem}\n\n"
                    f"Code to Test:\n```python\n{code}\n```\n\n"
                    "Write comprehensive pytest test cases for this code."
                )
            ),
        ]

        response = llm.invoke(messages)
        tests = response.content.strip()

        # Strip markdown code fences if present
        if tests.startswith("```"):
            lines = tests.split("\n")
            tests = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])

        logger.info(f"[{job_id}] Tester produced {len(tests)} characters of test code.")
        job_store.update(job_id, {"tests": tests})

        return {**state, "tests": tests, "current_agent": "Tester"}

    except Exception as e:
        logger.error(f"[{job_id}] Tester Agent error: {e}")
        job_store.update(job_id, {"status": "error", "error": str(e)})
        return {**state, "status": "error", "error": str(e)}
