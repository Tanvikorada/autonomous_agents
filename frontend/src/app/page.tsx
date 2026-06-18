"use client";

import { useState, useEffect } from "react";
import { startPipeline, getJobStatus, getJobResult, PipelineResult, JobStatusResponse } from "@/lib/api";
import ProblemInput from "@/components/ProblemInput";
import AgentPipeline from "@/components/AgentPipeline";
import ResultPanel from "@/components/ResultPanel";

export default function Home() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<JobStatusResponse | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      {/* Botanical Hero Section */}
      <section className="botanical-hero" style={{ minHeight: "80vh", display: "flex", flexDirection: "column", padding: "var(--spacing-28) var(--spacing-40)" }}>
        
        {/* Navigation */}
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="mono-badge">/os</span>
            <span style={{ fontFamily: "var(--font-pplxsans)", fontWeight: 500, fontSize: "16px" }}>AUTONOMOUS</span>
          </div>
          <div style={{ display: "flex", gap: "var(--spacing-8)" }}>
            <button className="ghost-nav">Library</button>
            <button className="ghost-nav">Discover</button>
            <button className="pill-cta" style={{ marginLeft: "var(--spacing-12)" }}>Sign In</button>
          </div>
        </nav>

        {/* Hero Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <h1 className="sans-hero">Computer</h1>
          <p className="body-stack" style={{ maxWidth: 600, marginTop: "var(--spacing-20)", color: "var(--color-moss-shadow)" }}>
            A natural language interface to orchestrate a swarm of specialized autonomous agents. Describe the system you need, and the computer will build it.
          </p>
        </div>
      </section>

      {/* Main Workspace Strip */}
      <section style={{ 
        maxWidth: "1200px", 
        margin: "0 auto", 
        padding: "0 var(--spacing-40) var(--spacing-80) var(--spacing-40)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-28)",
        position: "relative",
        marginTop: "-10vh" // Overlaps the hero gradient slightly
      }}>
        
        {error && (
          <div className="white-card" style={{ color: "#b62b1a", fontWeight: 500 }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "var(--spacing-24)" }}>
          {/* Left Column: Input and Results */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-24)" }}>
            <div className="white-card">
              <h2 className="serif-headline" style={{ fontSize: "32px", marginBottom: "var(--spacing-24)" }}>Initialize</h2>
              <ProblemInput onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
            
            {result && (
              <div className="white-card">
                 <ResultPanel result={result} />
              </div>
            )}
          </div>

          {/* Right Column: Telemetry */}
          <div className="white-card" style={{ alignSelf: "start" }}>
            <h2 className="serif-headline" style={{ fontSize: "24px", marginBottom: "var(--spacing-20)" }}>Workflow</h2>
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
