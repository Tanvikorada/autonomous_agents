"""
storage/memory_store.py — Thread-safe in-memory job store for MVP.
No database required. All jobs live in process memory.
"""
import threading
from typing import Dict, Optional
from backend.core.state import AgentState


class MemoryJobStore:
    """
    Simple thread-safe dictionary-backed store for job states.
    
    In production you'd replace this with Redis or PostgreSQL,
    but for MVP this is zero-config and fast.
    """

    def __init__(self) -> None:
        self._store: Dict[str, AgentState] = {}
        self._lock = threading.Lock()

    def create(self, job_id: str, initial_state: AgentState) -> None:
        """Create a new job entry."""
        with self._lock:
            self._store[job_id] = initial_state

    def get(self, job_id: str) -> Optional[AgentState]:
        """Return job state or None if not found."""
        with self._lock:
            return self._store.get(job_id)

    def update(self, job_id: str, partial: dict) -> None:
        """Merge partial dict into existing job state."""
        with self._lock:
            if job_id in self._store:
                self._store[job_id] = {**self._store[job_id], **partial}

    def list_jobs(self) -> list[str]:
        """Return all job IDs."""
        with self._lock:
            return list(self._store.keys())

    def delete(self, job_id: str) -> None:
        """Remove a job from the store."""
        with self._lock:
            self._store.pop(job_id, None)


# Module-level singleton — import and use everywhere
job_store = MemoryJobStore()
