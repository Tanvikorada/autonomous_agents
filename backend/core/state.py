"""
core/state.py — Shared state definition for the LangGraph pipeline.
Each field is populated by a specific agent as the pipeline progresses.
"""
from typing import TypedDict, Optional, List, Dict, Any

class AgentState(TypedDict):
    """
    The single shared state object that flows through every agent node.
    
    Fields:
        job_id      : Unique identifier for this pipeline run.
        problem     : Original user-submitted problem statement.
        plan        : Ordered list of steps produced by the Planner Agent.
        code        : Source code produced by the Coder Agent.
        tests       : Pytest test code produced by the Tester Agent.
        review      : Markdown review + fixes from the Reviewer Agent.
        status      : Current pipeline status string.
        error       : Non-empty if any agent raised an exception.
        current_agent: Name of the currently executing agent node.
    """
    job_id: str
    problem: str
    plan: Optional[List[str]]
    code: Optional[str]
    tests: Optional[str]
    review: Optional[str]
    status: str                  # "pending" | "planning" | "awaiting_approval" | "coding" | "testing" | "reviewing" | "done" | "error"
    error: Optional[str]
    current_agent: Optional[str]
    
    # Advanced features
    retries: int
    test_passed: Optional[bool]
    test_output: Optional[str]
    review_risk_score: Optional[int]
    review_confidence: Optional[str]
    total_tokens: int
    total_cost: float
    retrieved_context: Optional[List[dict]]
    agent_metrics: Optional[Dict[str, Any]]
