"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import ProblemInput from "@/components/ProblemInput";
import AgentPipeline from "@/components/AgentPipeline";
import ResultPanel from "@/components/ResultPanel";
import {
  startPipeline, getJobStatus, getJobResult,
  JobStatus, JobStatusResponse, PipelineResult,
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

  // Custom Cursor state
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorTrailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cursorX = 0, cursorY = 0;
    let trailX = 0, trailY = 0;

    const onMouseMove = (e: MouseEvent) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
      }
    };

    const animateTrail = () => {
      trailX += (cursorX - trailX) * 0.15;
      trailY += (cursorY - trailY) * 0.15;
      if (cursorTrailRef.current) {
        cursorTrailRef.current.style.transform = `translate3d(${trailX}px, ${trailY}px, 0)`;
      }
      requestAnimationFrame(animateTrail);
    };

    window.addEventListener("mousemove", onMouseMove);
    requestAnimationFrame(animateTrail);

    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPolling = useCallback((id: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const status = await getJobStatus(id);
        setStatusData(status);
        if (TERMINAL_STATUSES.includes(status.status)) {
          stopPolling();
          if (status.status === "done") { const res = await getJobResult(id); setResult(res); }
          else if (status.status === "error") setError(status.error || "An unknown error occurred.");
          setIsLoading(false);
        }
      } catch {
        setError("Lost connection to the backend.");
        stopPolling(); setIsLoading(false);
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleSubmit = async (problem: string) => {
    setError(null); setResult(null); setStatusData(null); setJobId(null); setIsLoading(true);
    try {
      const { job_id } = await startPipeline(problem);
      setJobId(job_id);
      setStatusData({ job_id, status: "pending", current_agent: null, completed_steps: [], error: null });
      startPolling(job_id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start pipeline.");
      setIsLoading(false);
    }
  };

  const isIdle = !isLoading && !statusData && !result && !error;

  return (
    <main style={{ minHeight: "100vh", position: "relative" }}>
      {/* ── Aurora Background ── */}
      <div className="aurora-bg" />

      {/* ── Custom Cursor ── */}
      <div
        ref={cursorRef}
        style={{
          position: "fixed", top: -6, left: -6, width: 12, height: 12,
          backgroundColor: "#fff", borderRadius: "50%", pointerEvents: "none", zIndex: 9999,
          mixBlendMode: "difference"
        }}
      />
      <div
        ref={cursorTrailRef}
        style={{
          position: "fixed", top: -20, left: -20, width: 40, height: 40,
          border: "1px solid rgba(255,255,255,0.4)", borderRadius: "50%", pointerEvents: "none", zIndex: 9998,
          transition: "width 0.2s, height 0.2s"
        }}
      />

      {/* ── Navbar ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 80,
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5%",
        zIndex: 100, backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.05)"
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>AUTONOMOUS<span style={{ color: "var(--accent-4)" }}>_</span></div>
        <div style={{ display: "flex", gap: 32, fontSize: 14, letterSpacing: 1, color: "var(--text-secondary)" }}>
          <span style={{ color: "#fff" }}>Workspace</span>
          <span>Agents</span>
          <span>Logs</span>
        </div>
      </nav>

      {/* ── Content Container ── */}
      <div style={{ paddingTop: 140, paddingBottom: 100, paddingLeft: "5%", paddingRight: "5%", maxWidth: 1400, margin: "0 auto" }}>
        
        {/* ── HERO TEXT ── */}
        {isIdle && (
          <div style={{ marginBottom: 80, textAlign: "center" }}>
            <h1 style={{ fontSize: "clamp(48px, 8vw, 100px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.04em", margin: 0 }}>
              <span className="text-reveal-mask">
                <span className="text-reveal" style={{ animationDelay: "0.1s" }}>Build Software.</span>
              </span>
              <br />
              <span className="text-reveal-mask">
                <span className="text-reveal" style={{ animationDelay: "0.2s", background: "linear-gradient(45deg, var(--accent-1), var(--accent-4))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Without Coding.
                </span>
              </span>
            </h1>
            <p style={{ marginTop: 24, fontSize: 20, color: "var(--text-secondary)", maxWidth: 600, margin: "24px auto 0", lineHeight: 1.6 }}>
              Drop your idea below. Our swarm of autonomous AI agents will plan, write, test, and review the code in seconds.
            </p>
          </div>
        )}

        {/* ── Input Section ── */}
        <div style={{ opacity: result ? 0.4 : 1, transition: "opacity 0.5s ease", transform: result ? "scale(0.95)" : "scale(1)" }}>
          <ProblemInput onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {/* ── Pipeline UI ── */}
        {statusData && (
          <div style={{ marginTop: 60 }}>
            <AgentPipeline
              status={statusData.status}
              currentAgent={statusData.current_agent}
              completedSteps={statusData.completed_steps}
            />
          </div>
        )}

        {/* ── Error UI ── */}
        {error && (
          <div className="glass-panel" style={{ marginTop: 60, padding: 40, borderLeft: "4px solid var(--accent-1)" }}>
            <h3 style={{ color: "var(--accent-1)", margin: "0 0 16px 0", fontSize: 24 }}>System Fault</h3>
            <p style={{ margin: 0, fontSize: 16, color: "var(--text-secondary)" }}>{error}</p>
          </div>
        )}

        {/* ── Results UI ── */}
        {result && (
          <div style={{ marginTop: 60 }}>
            <ResultPanel result={result} />
          </div>
        )}
      </div>
    </main>
  );
}
