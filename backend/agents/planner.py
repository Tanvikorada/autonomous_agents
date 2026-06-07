"""
agents/planner.py — Planner Agent.
Breaks a problem statement into a numbered, structured implementation plan.
"""
import json
import logging
import re
from typing import List
from langchain_core.messages import SystemMessage, HumanMessage
from backend.core.llm import get_llm
from backend.core.state import AgentState
from backend.storage.memory_store import job_store

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a senior software architect and technical project planner.

Your job is to analyze a software problem and produce a clear, numbered implementation plan.

Rules:
- Break the solution into 5-10 concrete, actionable steps.
- Each step should be specific enough to guide a developer.
- Focus only on what needs to be BUILT, not theories.
- Output ONLY a valid JSON array of strings. No markdown, no explanation outside the JSON.

Example output format:
[
  "Step 1: Set up the project structure with the required files and folders",
  "Step 2: Define the data models and database schema",
  "Step 3: Implement the core business logic",
  "Step 4: Build the REST API endpoints",
  "Step 5: Write error handling and input validation",
  "Step 6: Add unit tests for all major components"
]
"""


def run_planner(state: AgentState) -> AgentState:
    """
    Planner Agent node for LangGraph.
    
    Takes the problem from state, calls the LLM, and returns
    an updated state with `plan` populated.
    """
    job_id = state["job_id"]
    problem = state["problem"]

    logger.info(f"[{job_id}] Planner Agent starting...")
    job_store.update(job_id, {"status": "planning", "current_agent": "Planner"})

    try:
        llm = get_llm(temperature=0.3)
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=f"Problem to solve:\n\n{problem}"),
        ]

        response = llm.invoke(messages)
        raw = response.content.strip()

        # Extract JSON array from response (handles wrapped markdown)
        json_match = re.search(r"\[.*\]", raw, re.DOTALL)
        if json_match:
            plan: List[str] = json.loads(json_match.group())
        else:
            # Fallback: split by newlines if JSON parsing fails
            plan = [line.strip() for line in raw.split("\n") if line.strip()]

        logger.info(f"[{job_id}] Planner produced {len(plan)} steps.")
        job_store.update(job_id, {"plan": plan})

        return {**state, "plan": plan, "current_agent": "Planner"}

    except Exception as e:
        logger.error(f"[{job_id}] Planner Agent error: {e}")
        job_store.update(job_id, {"status": "error", "error": str(e)})
        return {**state, "status": "error", "error": str(e)}
