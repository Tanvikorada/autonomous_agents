"""
storage/memory_store.py — Thread-safe in-memory job store for MVP.
No database required. All jobs live in process memory.
"""
import json
import sqlite3
import os
import threading
from typing import Dict, Optional
from backend.core.state import AgentState

# Use a local sqlite DB file to persist across workers (e.g., Gunicorn with multiple workers)
DB_PATH = os.path.join(os.path.dirname(__file__), 'jobs.db')

class SQLiteJobStore:
    """
    SQLite-backed store for job states.
    Safe for multiple processes (workers) and threads.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        with self._get_conn() as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS jobs (
                    job_id TEXT PRIMARY KEY,
                    state_json TEXT
                )
            ''')
            conn.commit()

    def _get_conn(self):
        return sqlite3.connect(DB_PATH, timeout=10.0)

    def create(self, job_id: str, initial_state: AgentState) -> None:
        """Create a new job entry."""
        with self._lock, self._get_conn() as conn:
            conn.execute('INSERT OR REPLACE INTO jobs (job_id, state_json) VALUES (?, ?)', 
                         (job_id, json.dumps(initial_state)))
            conn.commit()

    def get(self, job_id: str) -> Optional[AgentState]:
        """Return job state or None if not found."""
        with self._get_conn() as conn:
            cur = conn.execute('SELECT state_json FROM jobs WHERE job_id = ?', (job_id,))
            row = cur.fetchone()
            if row:
                return json.loads(row[0])
            return None

    def update(self, job_id: str, partial: dict) -> None:
        """Merge partial dict into existing job state."""
        with self._lock, self._get_conn() as conn:
            cur = conn.execute('SELECT state_json FROM jobs WHERE job_id = ?', (job_id,))
            row = cur.fetchone()
            if row:
                state = json.loads(row[0])
                state.update(partial)
                conn.execute('UPDATE jobs SET state_json = ? WHERE job_id = ?', 
                             (json.dumps(state), job_id))
            conn.commit()

    def list_jobs(self) -> list[str]:
        """Return all job IDs."""
        with self._get_conn() as conn:
            cur = conn.execute('SELECT job_id FROM jobs')
            return [row[0] for row in cur.fetchall()]

    def delete(self, job_id: str) -> None:
        """Remove a job from the store."""
        with self._lock, self._get_conn() as conn:
            conn.execute('DELETE FROM jobs WHERE job_id = ?', (job_id,))
            conn.commit()

# Module-level singleton — import and use everywhere
job_store = SQLiteJobStore()
