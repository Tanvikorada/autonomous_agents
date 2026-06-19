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
        llm = get_llm(agent_name="planner", temperature=0.3)
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=f"Problem to solve:\n\n{problem}"),
        ]

        response = llm.invoke(messages)
        raw = response.content.strip()

        token_usage = response.response_metadata.get("token_usage", {})
        tokens_used = token_usage.get("total_tokens", len(raw) // 3)
        cost = tokens_used * 0.000005
        
        total_tokens = state.get("total_tokens", 0) + tokens_used
        total_cost = state.get("total_cost", 0.0) + cost
        
        agent_metrics = state.get("agent_metrics") or {}
        agent_metrics["planner"] = {"tokens": tokens_used, "cost": cost}

        # Extract JSON array from response (handles wrapped markdown)
        json_match = re.search(r"\[.*\]", raw, re.DOTALL)
        if json_match:
            plan: List[str] = json.loads(json_match.group())
        else:
            # Fallback: split by newlines if JSON parsing fails
            plan = [line.strip() for line in raw.split("\n") if line.strip()]

        logger.info(f"[{job_id}] Planner produced {len(plan)} steps. Tokens used: {tokens_used}")
        update_data = {
            "plan": plan, 
            "status": "awaiting_approval", 
            "current_agent": None,
            "total_tokens": total_tokens,
            "total_cost": total_cost,
            "agent_metrics": agent_metrics
        }
        job_store.update(job_id, update_data)

        return {**state, **update_data}

    except Exception as e:
        logger.error(f"[{job_id}] Planner Agent error: {e}")
        job_store.update(job_id, {"status": "error", "error": str(e)})
        return {**state, "status": "error", "error": str(e)}
