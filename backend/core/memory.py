"""
core/memory.py — Persistent Project Memory.
Stores and retrieves architectural decisions, lessons learned, and style guides 
for repositories to maintain cross-session context.
"""
import sqlite3
import os
import logging

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.getcwd(), "memory.db")

def _get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        '''CREATE TABLE IF NOT EXISTS project_memory (
            repo_url TEXT PRIMARY KEY,
            memory_text TEXT NOT NULL
        )'''
    )
    return conn

def get_project_memory(repo_url: str) -> str:
    """Retrieve the memory context for a specific repository."""
    if not repo_url:
        return ""
        
    try:
        with _get_connection() as conn:
            cursor = conn.execute("SELECT memory_text FROM project_memory WHERE repo_url = ?", (repo_url,))
            row = cursor.fetchone()
            if row:
                return row[0]
            return ""
    except Exception as e:
        logger.error(f"Failed to retrieve memory for {repo_url}: {e}")
        return ""

def append_project_memory(repo_url: str, new_memory: str):
    """Append new architectural lessons to the repository's memory."""
    if not repo_url or not new_memory:
        return

    try:
        current_memory = get_project_memory(repo_url)
        # Avoid duplicating exact lines
        if current_memory:
            existing_lines = set(current_memory.split("\n"))
            new_lines = [line for line in new_memory.split("\n") if line not in existing_lines]
            updated_memory = current_memory + "\n" + "\n".join(new_lines)
        else:
            updated_memory = new_memory
            
        with _get_connection() as conn:
            conn.execute(
                "INSERT INTO project_memory (repo_url, memory_text) VALUES (?, ?) "
                "ON CONFLICT(repo_url) DO UPDATE SET memory_text = excluded.memory_text",
                (repo_url, updated_memory.strip())
            )
            conn.commit()
            
        logger.info(f"Successfully updated memory for {repo_url}")
    except Exception as e:
        logger.error(f"Failed to append memory for {repo_url}: {e}")
