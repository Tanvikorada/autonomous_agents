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
from backend.core.orchestrator import pipeline
from backend.storage.memory_store import job_store
from backend.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Pipeline"])


# ── Status helpers ─────────────────────────────────────────────────────────────

STATUS_ORDER = ["planning", "coding", "testing", "reviewing", "done"]
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

async def _run_pipeline(job_id: str, problem: str) -> None:
    """
    Execute the full agent pipeline asynchronously.
    Runs in a background thread so it doesn't block the event loop.
    """
    initial_state: AgentState = {
        "job_id": job_id,
        "problem": problem,
        "plan": None,
        "code": None,
        "tests": None,
        "review": None,
        "status": "pending",
        "error": None,
        "current_agent": None,
    }

    try:
        logger.info(f"[{job_id}] Pipeline starting for problem: {problem[:80]}...")
        # Run the blocking LangGraph pipeline in a thread pool
        final_state = await asyncio.to_thread(pipeline.invoke, initial_state)
        logger.info(f"[{job_id}] Pipeline completed with status: {final_state.get('status')}")
        # Sync final state to store (orchestrator updates incrementally, but ensure final)
        job_store.update(job_id, dict(final_state))
    except Exception as e:
        logger.error(f"[{job_id}] Pipeline crashed: {e}", exc_info=True)
        job_store.update(job_id, {"status": "error", "error": str(e)})


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
        "plan": None,
        "code": None,
        "tests": None,
        "review": None,
        "status": "pending",
        "error": None,
        "current_agent": None,
    })

    # Kick off the pipeline in the background
    background_tasks.add_task(_run_pipeline, job_id, body.problem)

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
    )


@router.get("/result/{job_id}", response_model=PipelineResult)
async def get_result(job_id: str) -> PipelineResult:
    """
    Retrieve the full pipeline result once the job is complete.
    """
    state = job_store.get(job_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")

    if state["status"] not in ("done", "error"):
        raise HTTPException(
            status_code=202,
            detail=f"Job is still running. Current status: {state['status']}",
        )

    return PipelineResult(
        job_id=job_id,
        status=state["status"],
        problem=state["problem"],
        plan=state.get("plan"),
        code=state.get("code"),
        tests=state.get("tests"),
        review=state.get("review"),
        error=state.get("error"),
    )


@router.get("/jobs")
async def list_jobs() -> dict:
    """List all job IDs currently in the store."""
    return {"job_ids": job_store.list_jobs()}


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Basic health check endpoint."""
    return HealthResponse(provider=settings.llm_provider)
