"use client";
// app/page.tsx — SVZ Editorial layout for Autonomous Agents

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
          setError("Lost connection to the backend. The server may have crashed or stopped.");
          stopPolling();
          setIsLoading(false);
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling]
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleSubmit = async (problem: string) => {
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
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-void-canvas)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Navigation ─────────────────────────────────────────────── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "transparent",
          borderBottom: "1px solid var(--color-iron)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "16px 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-primary)",
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "-0.5px",
                color: "var(--color-bone-white)",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              Autonomous Agents
            </p>
            <p className="svz-label" style={{ marginTop: "3px" }}>
              Multi-Agent Software Engineering
            </p>
          </div>

          {/* Right: status + actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {jobId && statusData && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {statusData.status === "done" && <span className="svz-accent-dot" />}
                <span className="svz-status">{statusData.status.toUpperCase()}</span>
              </div>
            )}

            {(result || error) && (
              <button onClick={handleReset} className="svz-ghost-btn" style={{ padding: "8px 20px" }}>
                New Problem ↗
              </button>
            )}

            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="svz-ghost-link"
            >
              API Docs ↗
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "80px 40px 64px",
          width: "100%",
        }}
      >
        {/* Display headline */}
        <div style={{ marginBottom: "40px" }}>
          <h1
            style={{
              fontFamily: "var(--font-primary)",
              fontSize: "clamp(52px, 7vw, 80px)",
              fontWeight: 700,
              lineHeight: 0.92,
              letterSpacing: "-5px",
              color: "var(--color-bone-white)",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            AI Agents That
          </h1>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(40px, 5.5vw, 64px)",
              lineHeight: 1,
              letterSpacing: "-2px",
              color: "var(--color-bone-white)",
            }}
          >
            write, test &amp; review code
          </h1>
        </div>

        {/* Subtitle */}
        <p
          className="svz-body"
          style={{ maxWidth: "480px", marginBottom: "40px" }}
        >
          Submit any software problem. Four specialized agents collaborate to
          plan, build, test, and deliver a complete solution.
        </p>

        {/* Agent flow — editorial strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {["Planner", "Coder", "Tester", "Reviewer"].map((name, i, arr) => (
            <span key={name} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span className="svz-label-bone">{name}</span>
              {i < arr.length - 1 && (
                <span style={{ color: "var(--color-iron)", fontSize: "10px" }}>—</span>
              )}
            </span>
          ))}
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", padding: "0 40px" }}>
        <hr className="svz-hairline" />
      </div>

      {/* ── Main content ────────────────────────────────────────────── */}
      <main
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "64px 40px 80px",
          width: "100%",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "32px",
        }}
      >
        {/* Problem input — hide after result ready */}
        {!result && (
          <ProblemInput onSubmit={handleSubmit} isLoading={isLoading} />
        )}

        {/* Agent pipeline tracker */}
        {statusData && (
          <AgentPipeline
            status={statusData.status}
            currentAgent={statusData.current_agent}
            completedSteps={statusData.completed_steps}
          />
        )}

        {/* Error */}
        {error && (
          <div className="svz-card-red svz-fade-in" style={{ padding: "32px 40px" }}>
            <p
              style={{
                fontFamily: "var(--font-primary)",
                fontSize: "10px",
                fontWeight: 400,
                letterSpacing: "var(--tracking-out-sm)",
                textTransform: "uppercase",
                color: "var(--color-arterial-red)",
                marginBottom: "16px",
              }}
            >
              Pipeline Error
            </p>
            <p className="svz-body" style={{ color: "var(--color-bone-white)", marginBottom: "20px" }}>
              {error}
            </p>
            <div style={{ borderTop: "1px solid var(--color-iron)", paddingTop: "16px" }}>
              <p className="svz-label" style={{ marginBottom: "8px" }}>Common fixes</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {[
                  "Check your .env file has a valid GROQ_API_KEY",
                  "Make sure the backend is running on port 8000",
                  "Check backend terminal for detailed error logs",
                ].map((fix, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <span style={{ color: "var(--color-iron)", fontSize: "10px", marginTop: "2px" }}>—</span>
                    <p className="svz-body">{fix}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && <ResultPanel result={result} />}

        {/* Stats bar */}
        {result && (
          <div
            className="svz-card svz-fade-in"
            style={{
              padding: "32px 40px",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "0",
            }}
          >
            {[
              { label: "Plan Steps",    value: result.plan?.length ?? 0 },
              { label: "Code Lines",    value: result.code?.split("\n").length ?? 0 },
              { label: "Test Lines",    value: result.tests?.split("\n").length ?? 0 },
              { label: "Review Length", value: `${Math.round((result.review?.length ?? 0) / 100) / 10}k` },
            ].map((stat, i, arr) => (
              <div
                key={stat.label}
                style={{
                  paddingRight: i < arr.length - 1 ? "40px" : 0,
                  paddingLeft: i > 0 ? "40px" : 0,
                  borderLeft: i > 0 ? "1px solid var(--color-iron)" : "none",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: "clamp(28px, 3vw, 42px)",
                    fontWeight: 700,
                    lineHeight: 1.05,
                    letterSpacing: "-2px",
                    color: "var(--color-bone-white)",
                    marginBottom: "6px",
                  }}
                >
                  {stat.value}
                </p>
                <p className="svz-label">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer
        style={{
          background: "var(--color-charcoal-plate)",
          borderTop: "1px solid var(--color-iron)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "48px 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--font-primary)",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "-0.3px",
                color: "var(--color-bone-white)",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              Autonomous Agents
            </p>
            <p className="svz-label">Multi-Agent Software Engineering System</p>
          </div>
          <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="svz-ghost-link"
            >
              API Docs ↗
            </a>
            <a
              href="https://github.com/Tanvikorada/autonomous_agents"
              target="_blank"
              rel="noopener noreferrer"
              className="svz-ghost-link"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
