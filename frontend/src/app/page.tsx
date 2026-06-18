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
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] backdrop-blur">
        <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            </svg>
            Swarm AI
          </div>
          <nav className="flex items-center gap-4">
            <a href="#" className="text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">Documentation</a>
            <button className="shadcn-btn-outline h-8 px-3 text-xs">Sign In</button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-5xl px-4 py-10 space-y-8">
        
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Create Agent Workspace</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Deploy an autonomous swarm to plan, code, and test your software requirements.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200 dark:bg-red-950/50 dark:border-red-900">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Error: {error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Main Workspace Area */}
          <div className="md:col-span-2 space-y-6">
            <ProblemInput onSubmit={handleSubmit} isLoading={isLoading} />
            
            {result && (
              <ResultPanel result={result} />
            )}
          </div>

          {/* Sidebar / Telemetry */}
          <div className="shadcn-card p-4 space-y-4 sticky top-20">
            <div>
              <h3 className="font-semibold text-sm">Pipeline Telemetry</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Real-time agent status</p>
            </div>
            <AgentPipeline 
              status={statusData?.status ?? "pending"} 
              currentAgent={statusData?.current_agent ?? null} 
              completedSteps={statusData?.completed_steps ?? []} 
              isIdle={!isLoading} 
            />
          </div>

        </div>

      </main>

    </div>
  );
}
