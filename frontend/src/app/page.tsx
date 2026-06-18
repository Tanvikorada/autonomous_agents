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
    <div>
      {/* 100vh Botanical Hero Section */}
      <section className="botanical-hero" style={{ padding: "var(--spacing-28) var(--spacing-40)" }}>
        
        {/* Navigation */}
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="mono-badge">/os</span>
            <span style={{ fontFamily: "var(--font-pplxsans)", fontWeight: 500, fontSize: "16px" }}>AUTONOMOUS</span>
          </div>
          <div style={{ display: "flex", gap: "var(--spacing-8)" }}>
            <button className="nav-pill">Library</button>
            <button className="nav-pill">Discover</button>
            <button className="pill-cta" style={{ marginLeft: "var(--spacing-12)" }}>Sign In</button>
          </div>
        </nav>

        {/* Hero Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", paddingBottom: "10vh" }}>
          <h1 className="sans-hero">Computer</h1>
          <p className="body-stack" style={{ maxWidth: 600, marginTop: "var(--spacing-20)", color: "var(--color-moss-shadow)", fontSize: "16px" }}>
            A natural language interface to orchestrate a swarm of specialized autonomous agents. Describe the system you need, and the computer will build it.
          </p>
          <button 
            className="pill-cta" 
            style={{ marginTop: "var(--spacing-40)" }}
            onClick={() => workspaceRef.current?.scrollIntoView({ behavior: "smooth" })}
          >
            Try Computer
          </button>
        </div>
      </section>

      {/* Main Workspace Strip (Parchment) */}
      <section 
        ref={workspaceRef}
        style={{ 
          maxWidth: "800px", 
          margin: "0 auto", 
          padding: "var(--spacing-80) var(--spacing-40)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-40)",
          position: "relative",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "var(--spacing-20)" }}>
          <h2 className="serif-headline" style={{ fontSize: "48px", marginBottom: "var(--spacing-12)" }}>Initialize System</h2>
          <p className="body-stack" style={{ color: "var(--color-moss-shadow)" }}>Describe your requirements. The agents will handle the rest.</p>
        </div>

        {error && (
          <div className="white-card" style={{ color: "#b62b1a", fontWeight: 500 }}>
            {error}
          </div>
        )}

        <div className="white-card">
          <ProblemInput onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
        
        {result && (
          <div className="white-card" style={{ marginTop: "var(--spacing-40)" }}>
            <ResultPanel result={result} />
          </div>
        )}
      </section>

      {/* Agent Pipeline Telemetry (Botanical Floating) */}
      <section className="botanical-section" style={{ display: "flex", justifyContent: "center", padding: "var(--spacing-180) var(--spacing-40)" }}>
        <div style={{ maxWidth: "600px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <h2 className="serif-headline" style={{ fontSize: "32px", marginBottom: "var(--spacing-8)" }}>Workflow Telemetry</h2>
          <p className="body-stack" style={{ color: "var(--color-moss-shadow)", marginBottom: "var(--spacing-40)" }}>
            Live status of the autonomous agent swarm processing your request.
          </p>
          
          <div style={{ width: "100%", maxWidth: "400px", textAlign: "left" }}>
            <AgentPipeline 
              status={statusData?.status ?? "pending"} 
              currentAgent={statusData?.current_agent ?? null} 
              completedSteps={statusData?.completed_steps ?? []} 
              isIdle={!isLoading} 
            />
          </div>
        </div>
      </section>
      
      {/* Absolute Black Footer */}
      <footer style={{ backgroundColor: "var(--color-absolute-black)", color: "var(--color-ash-mist)", padding: "var(--spacing-80) var(--spacing-40)", textAlign: "center", fontFamily: "var(--font-pplxsansmono)", fontSize: "var(--text-caption)" }}>
        <p>TERMINAL ANCHOR // SWARM OS V1.0.0</p>
      </footer>
    </div>
  );
}
