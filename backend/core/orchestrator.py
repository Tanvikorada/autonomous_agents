"""
core/orchestrator.py — LangGraph Pipeline Orchestrator.
Wires all 4 agents into a StateGraph: Planner → Coder → Tester → Reviewer → END
"""
import logging
from langgraph.graph import StateGraph, END
from backend.core.state import AgentState
from backend.agents.planner import run_planner
from backend.agents.coder import run_coder
from backend.agents.tester import run_tester
from backend.agents.reviewer import run_reviewer

logger = logging.getLogger(__name__)


def _should_continue(state: AgentState) -> str:
    """
    Conditional edge: if an error occurred, short-circuit to END.
    Otherwise continue through the pipeline.
    """
    if state.get("status") == "error":
        logger.warning(f"[{state['job_id']}] Pipeline halting due to error.")
        return "end"
    return "continue"


def _after_tester(state: AgentState) -> str:
    if state.get("status") == "error":
        logger.warning(f"[{state['job_id']}] Pipeline halting due to error.")
        return "end"
    if state.get("test_passed") is False and state.get("retries", 0) < 3:
        logger.info(f"[{state['job_id']}] Tests failed. Retrying coder (Attempt {state.get('retries', 0) + 1}/3)")
        return "retry"
    return "continue"

def build_initial_pipeline() -> StateGraph:
    """
    Build the initial pipeline (Planner only) for Human-in-the-Loop.
    START → planner → END
    """
    graph = StateGraph(AgentState)
    graph.add_node("planner", run_planner)
    graph.set_entry_point("planner")
    graph.add_edge("planner", END)
    return graph.compile()

def build_execution_pipeline() -> StateGraph:
    """
    Build the execution pipeline. Runs after human approval.
    START → coder → tester → reviewer → END
    """
    graph = StateGraph(AgentState)

    graph.add_node("coder", run_coder)
    graph.add_node("tester", run_tester)
    graph.add_node("reviewer", run_reviewer)

    graph.set_entry_point("coder")

    graph.add_conditional_edges(
        "coder",
        _should_continue,
        {"continue": "tester", "end": END},
    )
    graph.add_conditional_edges(
        "tester",
        _after_tester,
        {"continue": "reviewer", "retry": "coder", "end": END},
    )
    graph.add_edge("reviewer", END)

    return graph.compile()

initial_pipeline = build_initial_pipeline()
execution_pipeline = build_execution_pipeline()
