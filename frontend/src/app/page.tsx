"use client";
// app/page.tsx — Main dashboard page

import { useState, useEffect, useRef, useCallback } from "react";
import ProblemInput from "@/components/ProblemInput";
import AgentPipeline from "@/components/AgentPipeline";
import ResultPanel from "@/components/ResultPanel";
import {
  startPipeline,
  getJobStatus,
  getJobResult,
  JobStatus,
  JobStatusResponse,
  PipelineResult,
} from "@/lib/api";

const POLL_INTERVAL_MS = 2000;
const TERMINAL_STATUSES: JobStatus[] = ["done", "error"];

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<JobStatusResponse | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (id: string) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const status = await getJobStatus(id);
          setStatusData(status);

          if (TERMINAL_STATUSES.includes(status.status)) {
            stopPolling();
            if (status.status === "done") {
              const res = await getJobResult(id);
              setResult(res);
            } else if (status.status === "error") {
              setError(status.error || "An unknown error occurred.");
            }
            setIsLoading(false);
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling]
  );

  // Clean up on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleSubmit = async (problem: string) => {
    // Reset state
    setError(null);
    setResult(null);
    setStatusData(null);
    setJobId(null);
    setIsLoading(true);

    try {
      const { job_id } = await startPipeline(problem);
      setJobId(job_id);
      setStatusData({
        job_id,
        status: "pending",
        current_agent: null,
        completed_steps: [],
        error: null,
      });
      startPolling(job_id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start pipeline.");
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    stopPolling();
    setIsLoading(false);
    setJobId(null);
    setStatusData(null);
    setResult(null);
    setError(null);
  };

  return (
    <main style={{ minHeight: "100vh", padding: "0 0 80px" }}>
      {/* ── Hero header ───────────────────────────────────────────────── */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(20px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
              }}
            >
              🤖
            </div>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>
                Autonomous Agents
              </h1>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Multi-Agent Software Engineering System
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {jobId && statusData && (
              <span
                className={`status-badge status-${statusData.status}`}
                style={{ fontSize: 11 }}
              >
                {statusData.status.toUpperCase()}
              </span>
            )}
            {(result || error) && (
              <button
                onClick={handleReset}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "6px 14px",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "'Inter', sans-serif",
                  transition: "all 0.15s",
                }}
              >
                ↩ New Problem
              </button>
            )}
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "var(--text-muted)",
                fontSize: 12,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              API Docs ↗
            </a>
          </div>
        </div>
      </header>

      {/* ── Page content ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>

        {/* ── Title block ────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: 48 }} className="fade-in">
          <h2
            style={{
              fontSize: "clamp(28px, 5vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            <span className="gradient-text">AI Agents That</span>
            <br />
            <span style={{ color: "var(--text-primary)" }}>Write, Test & Review Code</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 17, maxWidth: 540, margin: "0 auto" }}>
            Submit any software problem. Four specialized AI agents collaborate to
            plan, build, test, and review a complete solution.
          </p>

          {/* Agent flow pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 24,
              flexWrap: "wrap",
            }}
          >
            {["🧠 Planner", "💻 Coder", "🧪 Tester", "🔍 Reviewer"].map((label, i, arr) => (
              <span key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--border)",
                    borderRadius: 999,
                    padding: "4px 14px",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                  }}
                >
                  {label}
                </span>
                {i < arr.length - 1 && (
                  <span style={{ color: "var(--text-muted)", fontSize: 16 }}>→</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* ── Main grid ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Problem input (hide after result is ready) */}
          {!result && (
            <ProblemInput onSubmit={handleSubmit} isLoading={isLoading} />
          )}

          {/* Pipeline tracker (show while running or after done) */}
          {statusData && (
            <AgentPipeline
              status={statusData.status}
              currentAgent={statusData.current_agent}
              completedSteps={statusData.completed_steps}
            />
          )}

          {/* Error state */}
          {error && (
            <div
              className="glass-card fade-in"
              style={{
                padding: 24,
                borderColor: "rgba(239,68,68,0.4)",
                background: "rgba(239,68,68,0.06)",
              }}
            >
              <p style={{ fontWeight: 600, color: "#f87171", marginBottom: 8 }}>
                ❌ Pipeline Error
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{error}</p>
              <div style={{ marginTop: 16 }}>
                <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Common fixes:</p>
                <ul style={{ marginTop: 6, paddingLeft: 20, color: "var(--text-muted)", fontSize: 12, lineHeight: 1.8 }}>
                  <li>Check your <code>.env</code> file has a valid <code>GROQ_API_KEY</code></li>
                  <li>Make sure the backend is running on port 8000</li>
                  <li>Check backend terminal for detailed error logs</li>
                </ul>
              </div>
            </div>
          )}

          {/* Results */}
          {result && <ResultPanel result={result} />}

          {/* Stats bar (show after result) */}
          {result && (
            <div
              className="glass-card fade-in"
              style={{
                padding: "16px 24px",
                display: "flex",
                gap: 32,
                flexWrap: "wrap",
              }}
            >
              {[
                { label: "Plan Steps", value: result.plan?.length ?? 0 },
                { label: "Code Lines", value: result.code?.split("\n").length ?? 0 },
                { label: "Test Lines", value: result.tests?.split("\n").length ?? 0 },
                { label: "Review Length", value: `${Math.round((result.review?.length ?? 0) / 100) / 10}k chars` },
              ].map((stat) => (
                <div key={stat.label}>
                  <p style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
                    {stat.value}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
