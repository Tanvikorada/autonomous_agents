"use client";

import { useState, useEffect } from "react";
import { startPipeline, getJobStatus, getJobResult, PipelineResult, JobStatusResponse } from "@/lib/api";
import AgentPipeline from "@/components/AgentPipeline";
import ResultPanel from "@/components/ResultPanel";
import TerminalLog from "@/components/TerminalLog";

export default function Home() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<JobStatusResponse | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [problem, setProblem] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (problem.trim().length < 5) return;
    try {
      setError(null);
      setResult(null);
      setStatusData(null);
      const res = await startPipeline(problem);
      setJobId(res.job_id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start swarm.");
    }
  };

  useEffect(() => {
    if (!jobId) return;

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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to fetch status.");
        setJobId(null);
      }
    };

    const intervalId = setInterval(poll, 1000);
    return () => clearInterval(intervalId);
  }, [jobId]);

  const isLoading = !!jobId;

  return (
    <div className="min-h-screen flex flex-col font-jetbrains-mono relative">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 w-full bg-[var(--color-steel-navy)] border-b border-[var(--border-dim)]">
        <div className="w-full flex h-[64px] items-center px-[24px] gap-[24px]">
          <div className="flex items-center gap-[8px] font-normal tracking-wide text-[var(--color-ghost-white)] text-[16px] min-w-[200px]">
            <span className="text-[var(--color-warning-amber)]">ℹ</span>
            <span>SWARM_OS</span>
          </div>
          
          <form onSubmit={handleSubmit} className="flex-1 flex justify-center max-w-[800px] mx-auto relative">
            <input
              type="text"
              value={problem}
              onChange={e => setProblem(e.target.value)}
              disabled={isLoading}
              placeholder="Enter problem statement... (e.g. Build an autonomous trading bot in Python)"
              className="w-full cc-input rounded-[8px] py-[8px] px-[16px] pr-24 text-[16px] transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || problem.trim().length < 5}
              className="absolute right-1 top-1 bottom-1 px-[20px] rounded-full text-[14px] font-normal cc-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Running" : "Run"}
            </button>
          </form>

          <div className="min-w-[200px] flex justify-end">
            {isLoading && (
              <div className="flex items-center gap-2 text-[14px] text-[var(--color-specimen-green)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-specimen-green)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-specimen-green)]"></span>
                </span>
                PIPELINE ACTIVE
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full px-[24px] py-[24px] pb-[64px] gap-[24px] max-w-[1600px] mx-auto">
        
        {/* Horizontal Agent Pipeline Hero */}
        <section className="w-full cc-panel p-[32px] flex flex-col items-center justify-center min-h-[160px]">
          {(!isLoading && !result && !error) ? (
            <div className="text-center space-y-[8px] opacity-50">
              <span className="text-[var(--color-warning-amber)] text-[24px]">⚙</span>
              <p className="text-[16px] text-[var(--color-mist)]">Awaiting problem statement...</p>
            </div>
          ) : (
            <AgentPipeline 
              status={statusData?.status ?? "pending"} 
              currentAgent={statusData?.current_agent ?? null} 
              completedSteps={statusData?.completed_steps ?? []} 
            />
          )}
        </section>

        {error && (
          <div className="cc-panel p-[16px] border-[var(--color-fault-red)] bg-[var(--color-fault-red)]/10 text-[var(--color-fault-red)] text-[14px]">
            [SYS_ERR] {error}
          </div>
        )}

        {/* Split View: Results & Terminal */}
        {(isLoading || result) && (
          <section className="flex flex-col lg:flex-row gap-[24px] flex-1 min-h-[500px]">
            {/* Results Tabbed Panel */}
            <div className="flex-[2] flex flex-col min-w-0">
              <ResultPanel result={result} isLoading={isLoading} currentAgent={statusData?.current_agent} />
            </div>

            {/* Terminal Log Panel */}
            <div className="flex-1 min-w-[300px] flex flex-col">
              <TerminalLog statusData={statusData} />
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
