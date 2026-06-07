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


def build_pipeline() -> StateGraph:
    """
    Build and compile the LangGraph pipeline.
    
    Graph topology:
        START → planner → coder → tester → reviewer → END
    
    Each node is a Python function that takes AgentState and returns AgentState.
    Conditional edges allow early exit on errors.
    
    Returns:
        A compiled LangGraph runnable.
    """
    graph = StateGraph(AgentState)

    # ── Register agent nodes ──────────────────────────────────────
    graph.add_node("planner", run_planner)
    graph.add_node("coder", run_coder)
    graph.add_node("tester", run_tester)
    graph.add_node("reviewer", run_reviewer)

    # ── Entry point ───────────────────────────────────────────────
    graph.set_entry_point("planner")

    # ── Edges with error short-circuit ───────────────────────────
    graph.add_conditional_edges(
        "planner",
        _should_continue,
        {"continue": "coder", "end": END},
    )
    graph.add_conditional_edges(
        "coder",
        _should_continue,
        {"continue": "tester", "end": END},
    )
    graph.add_conditional_edges(
        "tester",
        _should_continue,
        {"continue": "reviewer", "end": END},
    )
    graph.add_edge("reviewer", END)

    return graph.compile()


# Module-level compiled pipeline — import and invoke
pipeline = build_pipeline()
