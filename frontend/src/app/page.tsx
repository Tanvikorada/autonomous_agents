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
    <div className="min-h-screen flex flex-col font-suisseintl relative bg-[var(--color-canvas-mist)] text-[var(--color-ink-black)]">
      
      {/* Navigation Pill */}
      <div className="w-full max-w-[1280px] mx-auto px-[24px] pt-[24px] z-50 sticky top-0">
        <header className="w-full bg-[var(--color-pure-white)] rounded-[48px] h-[64px] flex items-center px-[24px] justify-between shadow-sm">
          <div className="flex items-center gap-[8px] font-medium tracking-tight text-[16px]">
            <span className="text-[var(--color-electric-yellow)]">✦</span>
            <span>dayos</span>
          </div>
          
          <form onSubmit={handleSubmit} className="flex-1 flex justify-center max-w-[600px] mx-auto relative px-[24px]">
            <input
              type="text"
              value={problem}
              onChange={e => setProblem(e.target.value)}
              disabled={isLoading}
              placeholder="Enter problem statement... (e.g. Build an autonomous trading bot)"
              className="w-full cc-input rounded-[20px] py-[10px] px-[20px] pr-[100px] text-[14px] transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || problem.trim().length < 5}
              className="absolute right-[30px] top-[4px] bottom-[4px] cc-btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-[14px]"
            >
              {isLoading ? "Running" : "Run"}
            </button>
          </form>

          <div className="min-w-[120px] flex justify-end">
            {isLoading && (
              <div className="flex items-center gap-[8px] text-[12px] font-suisseintlmono text-[var(--color-ink-black)]">
                <span className="relative flex h-[8px] w-[8px]">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-mint-pulse)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-[8px] w-[8px] bg-[var(--color-mint-pulse)]"></span>
                </span>
                ACTIVE
              </div>
            )}
          </div>
        </header>
      </div>

      <main className="flex-1 flex flex-col w-full px-[24px] py-[80px] gap-[80px] max-w-[1280px] mx-auto">
        
        {/* Hero Section */}
        <section className="flex flex-col md:flex-row gap-[40px] items-start w-full">
          <div className="flex-1 max-w-[600px] flex flex-col gap-[24px]">
            <h1 className="font-suisseintlcond font-bold text-[80px] leading-[0.9] tracking-[-2.4px] text-[var(--color-ink-black)]">
              AUTONOMOUS <span className="text-[var(--color-electric-yellow)]">AGENT</span> PIPELINE
            </h1>
            <p className="font-suisseintl font-normal text-[18px] leading-[1.25] tracking-[-0.22px] text-[var(--color-ink-black)] max-w-[480px]">
              Dayos OS operates a secure, high-density pipeline of Planners, Coders, Testers, and Reviewers to architect and ship production-ready software.
            </p>
          </div>
          
          <div className="flex-1 w-full cc-panel p-[40px] flex flex-col items-center justify-center min-h-[300px]">
            {(!isLoading && !result && !error) ? (
              <div className="text-center space-y-[16px] opacity-60">
                <p className="font-suisseintlmono text-[12px] uppercase tracking-wide">Awaiting input</p>
                <div className="w-[64px] h-[64px] rounded-[16px] bg-[var(--color-surface-mist)] mx-auto flex items-center justify-center">
                  <span className="text-[24px]">✦</span>
                </div>
              </div>
            ) : (
              <AgentPipeline 
                status={statusData?.status ?? "pending"} 
                currentAgent={statusData?.current_agent ?? null} 
                completedSteps={statusData?.completed_steps ?? []} 
              />
            )}
          </div>
        </section>

        {error && (
          <div className="cc-panel !bg-[var(--color-pure-white)] p-[24px] border-l-4 border-[var(--color-ink-black)] text-[var(--color-ink-black)] text-[14px]">
            <span className="font-suisseintlmono font-bold mr-2">SYS_ERR:</span> {error}
          </div>
        )}

        {/* Split View: Results & Terminal */}
        {(isLoading || result) && (
          <section className="flex flex-col lg:flex-row gap-[24px] flex-1 min-h-[600px]">
            {/* Results Tabbed Panel */}
            <div className="flex-[2] flex flex-col min-w-0">
              <ResultPanel result={result} isLoading={isLoading} currentAgent={statusData?.current_agent} />
            </div>

            {/* Terminal Log Panel */}
            <div className="flex-1 min-w-[350px] flex flex-col">
              <TerminalLog statusData={statusData} />
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
