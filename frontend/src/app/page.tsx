"use client";

import { useState, useEffect, useRef } from "react";
import { startPipeline, getJobStatus, getJobResult, PipelineResult, JobStatusResponse } from "@/lib/api";
import ProblemInput from "@/components/ProblemInput";
import AgentPipeline from "@/components/AgentPipeline";
import ResultPanel from "@/components/ResultPanel";

export default function Home() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<JobStatusResponse | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const workspaceRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (problem: string) => {
    try {
      setError(null);
      setResult(null);
      setStatusData(null);
      const res = await startPipeline(problem);
      setJobId(res.job_id);
    } catch (err: any) {
      setError(err.message || "Failed to start swarm.");
    }
  };

  useEffect(() => {
    if (!jobId) return;

    let intervalId: NodeJS.Timeout;
    const poll = async () => {
      try {
        const data = await getJobStatus(jobId);
        setStatusData(data);
        if (data.status === "done") {
          const resultData = await getJobResult(jobId);
          setResult(resultData);
          setJobId(null);
        } else if (data.status === "error") {
          setError(data.error || "Job failed.");
          setJobId(null);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch status.");
        setJobId(null);
      }
    };

    intervalId = setInterval(poll, 1000);
    return () => clearInterval(intervalId);
  }, [jobId]);

  const isLoading = !!jobId;

  return (
    <div style={{ backgroundColor: "var(--color-midnight-canvas)", minHeight: "100vh" }}>
      
      {/* Navigation */}
      <nav style={{ 
        position: "absolute", top: 0, left: 0, right: 0, 
        height: "80px", display: "flex", justifyContent: "space-between", alignItems: "center", 
        padding: "0 var(--spacing-44)", zIndex: 10 
      }}>
        <div style={{ fontFamily: "var(--font-canvasans)", fontWeight: 700, fontSize: "16px", letterSpacing: "1px" }}>
          SWARM_OS.
        </div>
        <div style={{ display: "flex", gap: "var(--spacing-20)" }}>
          <button className="ghost-cta">Developer API</button>
          <button className="primary-cta">Log in</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ 
        height: "100vh", width: "100%", display: "flex", flexDirection: "column", 
        justifyContent: "center", alignItems: "center", position: "relative",
        overflow: "hidden"
      }}>
        <div className="hero-3d-wordmark display-xl animate-fade-in-up" style={{ textAlign: "center", zIndex: 1 }}>
          SWARM_OS
        </div>
        <div className="hero-3d-wordmark display-xl animate-fade-in-up stagger-1" style={{ 
          textAlign: "center", position: "absolute", opacity: 0.1, top: "20%", left: "5%", zIndex: 0, transform: "scale(1.5)" 
        }}>
          SWARM_OS
        </div>
        <h1 className="heading-sm animate-fade-in-up stagger-2" style={{ marginTop: "var(--spacing-41)", zIndex: 2 }}>
          THE AUTONOMOUS SOFTWARE ENGINEERING PLATFORM
        </h1>
        <p className="body-text animate-fade-in-up stagger-3" style={{ marginTop: "var(--spacing-20)", textAlign: "center", maxWidth: "600px", zIndex: 2 }}>
          An organic, self-orchestrating swarm of specialized AI agents. Design plans, synthesize source code, validate tests, and audit security on an infinite black canvas.
        </p>
        <div className="animate-fade-in-up stagger-4" style={{ marginTop: "var(--spacing-44)", zIndex: 2 }}>
          <button className="primary-cta" onClick={() => workspaceRef.current?.scrollIntoView({ behavior: "smooth" })}>
            Initialize Swarm
          </button>
        </div>
      </section>

      {/* Workspace App Layout */}
      <section ref={workspaceRef} style={{ maxWidth: "var(--page-max-width)", margin: "0 auto", padding: "var(--spacing-80) var(--spacing-44)" }}>
        
        {error && (
          <div className="charcoal-card" style={{ borderLeft: "4px solid var(--color-ember-coral)", marginBottom: "var(--spacing-41)" }}>
            <span style={{ color: "var(--color-ember-coral)", fontWeight: 500 }}>Error: {error}</span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: "var(--spacing-20)", alignItems: "start" }}>
          
          {/* Left Column: Telemetry */}
          <div className="charcoal-card" style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-20)", position: "sticky", top: "var(--spacing-41)" }}>
            <h3 className="editorial-accent" style={{ color: "var(--color-leonardo-violet)", fontSize: "24px" }}>Telemetry</h3>
            <p className="body-text">Real-time pipeline analysis.</p>
            <AgentPipeline 
              status={statusData?.status ?? "pending"} 
              currentAgent={statusData?.current_agent ?? null} 
              completedSteps={statusData?.completed_steps ?? []} 
              isIdle={!isLoading} 
            />
          </div>

          {/* Right Column: Input & Results */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-41)" }}>
            <div className="charcoal-card">
              <ProblemInput onSubmit={handleSubmit} isLoading={isLoading} />
            </div>

            {result && (
              <div className="charcoal-card animate-fade-in-up">
                <ResultPanel result={result} />
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "var(--spacing-80) var(--spacing-44)", borderTop: "1px solid var(--color-obsidian-surface)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "var(--font-canvasans)", fontWeight: 700, fontSize: "16px", color: "var(--color-ash-text)" }}>SWARM_OS</div>
        <div style={{ display: "flex", gap: "var(--spacing-20)" }}>
          <span className="body-text" style={{ cursor: "pointer" }}>Documentation</span>
          <span className="body-text" style={{ cursor: "pointer" }}>Privacy Policy</span>
          <span className="body-text" style={{ cursor: "pointer" }}>Terms of Service</span>
        </div>
      </footer>
    </div>
  );
}
