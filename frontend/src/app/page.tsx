"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    <div className="min-h-screen flex flex-col font-sans relative">
      <div className="ambient-grid"></div>

      {/* Top Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-[#1C1C24] bg-[#0A0A0F]/90 backdrop-blur-md">
        <div className="w-full flex h-16 items-center px-6 gap-6">
          <div className="flex items-center gap-3 font-medium tracking-tight text-white min-w-[200px]">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7C3AED]"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            <span>SWARM<span className="text-[#7C3AED]">_</span>OS</span>
          </div>
          
          <form onSubmit={handleSubmit} className="flex-1 flex justify-center max-w-3xl mx-auto relative">
            <input
              type="text"
              value={problem}
              onChange={e => setProblem(e.target.value)}
              disabled={isLoading}
              placeholder="Enter problem statement... (e.g. Build an autonomous trading bot in Python)"
              className="w-full cc-input rounded-full py-2.5 px-6 pr-24 text-sm transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || problem.trim().length < 5}
              className="absolute right-1 top-1 bottom-1 px-5 rounded-full text-sm font-medium cc-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Running..." : "Run"}
            </button>
          </form>

          <div className="min-w-[200px] flex justify-end">
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-[#06B6D4]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06B6D4] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#06B6D4]"></span>
                </span>
                PIPELINE ACTIVE
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full px-6 py-6 pb-20 gap-6 max-w-[1600px] mx-auto">
        
        {/* Horizontal Agent Pipeline Hero */}
        <section className="w-full cc-panel p-6 flex flex-col items-center justify-center min-h-[160px]">
          {(!isLoading && !result && !error) ? (
            <div className="text-center space-y-2 opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
              <p className="text-sm">Awaiting problem statement...</p>
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
          <div className="cc-panel p-4 border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444] text-sm">
            [SYS_ERR] {error}
          </div>
        )}

        {/* Split View: Results & Terminal */}
        {(isLoading || result) && (
          <section className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[500px]">
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
