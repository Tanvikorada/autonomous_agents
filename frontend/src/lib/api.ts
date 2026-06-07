// lib/api.ts — Typed API client for the FastAPI backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type JobStatus =
  | "pending"
  | "planning"
  | "coding"
  | "testing"
  | "reviewing"
  | "done"
  | "error";

export interface JobCreatedResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  current_agent: string | null;
  completed_steps: string[];
  error: string | null;
}

export interface PipelineResult {
  job_id: string;
  status: string;
  problem: string;
  plan: string[] | null;
  code: string | null;
  tests: string | null;
  review: string | null;
  error: string | null;
}

// ── Start a pipeline job ──────────────────────────────────────────────────────
export async function startPipeline(problem: string): Promise<JobCreatedResponse> {
  const res = await fetch(`${API_BASE}/api/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problem }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Poll job status ───────────────────────────────────────────────────────────
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(`${API_BASE}/api/status/${jobId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Get full result ───────────────────────────────────────────────────────────
export async function getJobResult(jobId: string): Promise<PipelineResult> {
  const res = await fetch(`${API_BASE}/api/result/${jobId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}
