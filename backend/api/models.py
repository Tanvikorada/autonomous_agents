"""
api/models.py — Pydantic request and response models.
"""
from typing import Optional, List
from pydantic import BaseModel, Field


# ── Request Models ─────────────────────────────────────────────────────────────

class RunRequest(BaseModel):
    """Body for POST /api/run"""
    problem: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="The software problem or task description.",
        examples=["Build a Python REST API for a simple todo list with CRUD operations."],
    )


# ── Response Models ────────────────────────────────────────────────────────────

class JobCreatedResponse(BaseModel):
    """Returned immediately when a job is queued."""
    job_id: str
    status: str = "pending"
    message: str = "Pipeline started. Poll /api/status/{job_id} for updates."


class JobStatusResponse(BaseModel):
    """Returned by GET /api/status/{job_id}"""
    job_id: str
    status: str                          # pending | planning | awaiting_approval | coding | testing | reviewing | done | error
    current_agent: Optional[str] = None  # which agent is currently running
    completed_steps: List[str] = []      # list of completed agent names
    error: Optional[str] = None
    retries: int = 0
    total_tokens: int = 0
    total_cost: float = 0.0

class PipelineResult(BaseModel):
    """Full pipeline output returned by GET /api/result/{job_id}"""
    job_id: str
    status: str
    problem: str
    plan: Optional[List[str]] = None
    code: Optional[str] = None
    tests: Optional[str] = None
    review: Optional[str] = None
    review_risk_score: Optional[int] = None
    review_confidence: Optional[str] = None
    error: Optional[str] = None
    retries: int = 0
    total_tokens: int = 0
    total_cost: float = 0.0


class HealthResponse(BaseModel):
    """GET /api/health"""
    status: str = "ok"
    version: str = "1.0.0"
    provider: str
