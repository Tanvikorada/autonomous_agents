"""
api/routes.py — FastAPI route handlers.

Endpoints:
    POST /api/run              → Start the pipeline, returns job_id
    GET  /api/status/{job_id}  → Poll current pipeline status
    GET  /api/result/{job_id}  → Get full structured result
    GET  /api/jobs             → List all job IDs
    GET  /api/health           → Health check
"""
import uuid
import asyncio
import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks

from backend.api.models import (
    RunRequest,
    JobCreatedResponse,
    JobStatusResponse,
    PipelineResult,
    HealthResponse,
)
from backend.core.state import AgentState
from backend.core.orchestrator import initial_pipeline, execution_pipeline
from backend.storage.memory_store import job_store
from backend.config import settings
from pydantic import BaseModel
from typing import List

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Pipeline"])


# ── Status helpers ─────────────────────────────────────────────────────────────

STATUS_ORDER = ["planning", "awaiting_approval", "coding", "testing", "reviewing", "done"]
AGENT_MAP = {
    "planning": "Planner",
    "coding": "Coder",
    "testing": "Tester",
    "reviewing": "Reviewer",
}


def _get_completed_steps(status: str) -> list[str]:
    """Return list of agents that have already finished based on current status."""
    try:
        idx = STATUS_ORDER.index(status)
        # All statuses before current index are done
        return [AGENT_MAP[s] for s in STATUS_ORDER[:idx] if s in AGENT_MAP]
    except ValueError:
        return []


# ── Background task ────────────────────────────────────────────────────────────

async def _run_pipeline(job_id: str, problem: str, repo_url: str = None) -> None:
    """
    Execute the initial agent pipeline asynchronously.
    Runs in a background thread so it doesn't block the event loop.
    """
    initial_state: AgentState = {
        "job_id": job_id,
        "problem": problem,
        "repo_url": repo_url,
        "plan": None,
        "code": None,
        "tests": None,
        "review": None,
        "status": "pending",
        "error": None,
        "current_agent": None,
        "retries": 0,
        "test_passed": None,
        "test_output": None,
        "review_risk_score": None,
        "review_confidence": None,
        "total_tokens": 0,
        "total_cost": 0.0,
    }

    try:
        logger.info(f"[{job_id}] Initial pipeline starting for problem: {problem[:80]}...")
        # Run the blocking LangGraph pipeline in a thread pool
        final_state = await asyncio.to_thread(initial_pipeline.invoke, initial_state)
        logger.info(f"[{job_id}] Initial pipeline completed with status: {final_state.get('status')}")
        # Sync final state to store
        job_store.update(job_id, dict(final_state))
    except Exception as e:
        logger.error(f"[{job_id}] Pipeline crashed: {e}", exc_info=True)
        job_store.update(job_id, {"status": "error", "error": str(e)})

async def _resume_pipeline(job_id: str) -> None:
    """
    Resume the pipeline from Coder onwards.
    """
    state = job_store.get(job_id)
    if not state:
        return

    try:
        logger.info(f"[{job_id}] Execution pipeline resuming...")
        final_state = await asyncio.to_thread(execution_pipeline.invoke, state)
        logger.info(f"[{job_id}] Execution pipeline completed with status: {final_state.get('status')}")
        if final_state.get('status') not in ['error', 'done']:
            final_state['status'] = 'done'
        job_store.update(job_id, dict(final_state))
    except Exception as e:
        logger.error(f"[{job_id}] Pipeline crashed during execution: {e}", exc_info=True)
        job_store.update(job_id, {"status": "error", "error": str(e)})

class ApproveRequest(BaseModel):
    plan: List[str]

@router.post("/approve/{job_id}", status_code=202)
async def approve_plan(job_id: str, body: ApproveRequest, background_tasks: BackgroundTasks):
    """
    Approve or update a plan, and resume the pipeline.
    """
    state = job_store.get(job_id)
    if not state:
        raise HTTPException(status_code=404, detail="Job not found")
    if state["status"] != "awaiting_approval":
        raise HTTPException(status_code=400, detail="Job is not awaiting approval")

    # Update the job store with the approved/edited plan
    job_store.update(job_id, {"plan": body.plan, "status": "coding"})

    # Resume the pipeline in the background
    background_tasks.add_task(_resume_pipeline, job_id)

    return {"status": "approved", "job_id": job_id}


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/run", response_model=JobCreatedResponse, status_code=202)
async def run_pipeline(body: RunRequest, background_tasks: BackgroundTasks) -> JobCreatedResponse:
    """
    Start the AI agent pipeline for a given problem statement.
    Returns immediately with a job_id for polling.
    """
    job_id = str(uuid.uuid4())

    # Pre-create the job entry in the store
    job_store.create(job_id, {
        "job_id": job_id,
        "problem": body.problem,
        "repo_url": body.repo_url,
        "plan": None,
        "code": None,
        "tests": None,
        "review": None,
        "status": "pending",
        "error": None,
        "current_agent": None,
        "retries": 0,
        "test_passed": None,
        "test_output": None,
        "review_risk_score": None,
        "review_confidence": None,
        "total_tokens": 0,
        "total_cost": 0.0,
    })

    # Kick off the pipeline in the background
    background_tasks.add_task(_run_pipeline, job_id, body.problem, body.repo_url)

    return JobCreatedResponse(job_id=job_id)


@router.get("/status/{job_id}", response_model=JobStatusResponse)
async def get_status(job_id: str) -> JobStatusResponse:
    """
    Poll the current status of a pipeline job.
    """
    state = job_store.get(job_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")

    return JobStatusResponse(
        job_id=job_id,
        status=state["status"],
        current_agent=state.get("current_agent"),
        completed_steps=_get_completed_steps(state["status"]),
        error=state.get("error"),
        retries=state.get("retries", 0),
        total_tokens=state.get("total_tokens", 0),
        total_cost=state.get("total_cost", 0.0),
    )


@router.get("/result/{job_id}", response_model=PipelineResult)
async def get_result(job_id: str) -> PipelineResult:
    """
    Retrieve the full pipeline result once the job is complete.
    """
    state = job_store.get(job_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")

    if state["status"] not in ("done", "error", "awaiting_approval"):
        raise HTTPException(
            status_code=202,
            detail=f"Job is still running. Current status: {state['status']}",
        )

    return PipelineResult(
        job_id=job_id,
        status=state["status"],
        problem=state["problem"],
        repo_url=state.get("repo_url"),
        plan=state.get("plan"),
        code=state.get("code"),
        tests=state.get("tests"),
        review=state.get("review"),
        review_risk_score=state.get("review_risk_score"),
        review_confidence=state.get("review_confidence"),
        error=state.get("error"),
        retries=state.get("retries", 0),
        total_tokens=state.get("total_tokens", 0),
        total_cost=state.get("total_cost", 0.0),
    )


@router.get("/jobs")
async def list_jobs() -> dict:
    """List all job IDs currently in the store."""
    return {"job_ids": job_store.list_jobs()}


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Basic health check endpoint."""
    return HealthResponse(provider=settings.llm_provider)
