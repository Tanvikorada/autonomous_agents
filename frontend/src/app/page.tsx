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
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-black-void)" }}>
      {/* 1px Hairline Top Nav */}
      <nav className="hairline-nav">
        <div className="logo-wordmark">
          21<div className="bar" />TSI
        </div>
        <div style={{ display: "flex", gap: "38px" }}>
          <button className="nav-link">THE SPHERE LAB</button>
          <button className="nav-link">JOIN THE TEAM</button>
          <button className="nav-link">INVEST</button>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="ghost-pill active">CONTACT</button>
          <button className="ghost-pill">FR</button>
          <button className="ghost-pill">SOUND</button>
        </div>
      </nav>

      {/* Full-Bleed Editorial Hero */}
      <section className="editorial-hero">
        <div style={{ 
          position: "absolute", 
          top: "30%", 
          left: "var(--spacing-38)",
          width: "50%",
          zIndex: 10
        }}>
          <h1 className="display-headline">
            Build Software.<br />
            Without Coding.
          </h1>
        </div>
      </section>

      {/* Main Content Strip */}
      <section style={{ 
        padding: "var(--spacing-108) var(--spacing-38)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-60)"
      }}>
        
        {error && (
          <div style={{ color: "var(--color-crimson-heat)", fontFamily: "var(--font-saans)", fontSize: "var(--text-body)" }}>
            ERROR: {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "var(--spacing-108)" }}>
          {/* Left Column: Input and Results */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--spacing-60)" }}>
            <ProblemInput onSubmit={handleSubmit} isLoading={isLoading} />
            {result && <ResultPanel result={result} />}
          </div>

          {/* Right Column: Telemetry */}
          <div style={{ width: "300px" }}>
            <AgentPipeline 
              status={statusData?.status ?? "pending"} 
              currentAgent={statusData?.current_agent ?? null} 
              completedSteps={statusData?.completed_steps ?? []} 
              isIdle={!isLoading} 
            />
          </div>
        </div>
      </section>
    </div>
  );
}
