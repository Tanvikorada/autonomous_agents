"use client";

import { useState, useEffect } from "react";
import { startPipeline, getJobStatus, getJobResult, PipelineResult, JobStatusResponse } from "@/lib/api";
import AgentPipeline from "@/components/AgentPipeline";
import ResultPanel from "@/components/ResultPanel";
import TerminalLog from "@/components/TerminalLog";
import IntroScreen from "@/components/IntroScreen";
import { AnimatePresence } from "framer-motion";

export default function Home() {
  const [hasEntered, setHasEntered] = useState(false);
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
        if (data.status === "done" || data.status === "awaiting_approval") {
          const resultData = await getJobResult(jobId);
          setResult(resultData);
          if (data.status === "done") {
            setJobId(null);
          }
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

  const handleApprove = async (plan: string[]) => {
    if (!jobId) return;
    try {
      const response = await fetch(`http://localhost:8000/api/approve/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!response.ok) throw new Error("Approval failed");
      // Result panel should show coding tab next
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Approval failed");
    }
  };

  const isLoading = !!jobId;

  return (
    <>
      <AnimatePresence>
        {!hasEntered && <IntroScreen onComplete={() => setHasEntered(true)} />}
      </AnimatePresence>

      <div className={`min-h-screen flex flex-col font-suisseintl relative bg-[var(--color-canvas-mist)] text-[var(--color-ink-black)] transition-opacity duration-1000 ${hasEntered ? "opacity-100" : "opacity-0 h-screen overflow-hidden"}`}>
        
        {/* Navigation Pill */}
        <div className="w-full max-w-[1280px] mx-auto px-[24px] pt-[24px] z-50 sticky top-0">
        <header className="w-full bg-[var(--color-pure-white)] rounded-[48px] h-[64px] flex items-center px-[24px] justify-between shadow-sm">
          <div className="flex items-center gap-[8px] font-medium tracking-tight text-[16px]">
            <span className="text-[var(--color-electric-yellow)]">✦</span>
            <span>dayos</span>
          </div>

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
        <section className="flex flex-col gap-[40px] items-center text-center w-full max-w-[800px] mx-auto">
          <div className="flex flex-col gap-[16px]">
            <h1 className="font-suisseintlcond font-bold text-[64px] leading-[0.9] tracking-[-2px] text-[var(--color-ink-black)]">
              AUTONOMOUS <span className="text-[var(--color-electric-yellow)]">AGENT</span> PIPELINE
            </h1>
            <p className="font-suisseintl font-normal text-[18px] text-[var(--color-ink-black)] opacity-80">
              Initialize the Dayos OS swarm to architect and ship production-ready software.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="w-full relative group">
            <div className="absolute -inset-[2px] bg-gradient-to-r from-[var(--color-mint-pulse)] via-[var(--color-electric-yellow)] to-[var(--color-mint-pulse)] rounded-[24px] blur-[8px] opacity-20 group-focus-within:opacity-50 transition-opacity duration-500"></div>
            <div className="relative bg-[var(--color-pure-white)] border border-[var(--color-surface-mist)] rounded-[24px] shadow-sm flex flex-col overflow-hidden transition-all duration-300 focus-within:border-[var(--color-mint-pulse)]">
              <textarea
                value={problem}
                onChange={e => setProblem(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (problem.trim().length >= 5 && !isLoading) {
                      handleSubmit(e as unknown as React.FormEvent);
                    }
                  }
                }}
                disabled={isLoading}
                placeholder="Describe what you want to build... (e.g., 'A Python trading bot with a Flask API')"
                className="w-full min-h-[120px] resize-none bg-transparent outline-none p-[24px] text-[16px] font-suisseintl text-[var(--color-ink-black)] placeholder-[var(--color-steel-gray)] leading-relaxed"
              />
              <div className="flex justify-between items-center px-[24px] pb-[20px]">
                <div className="text-[12px] font-suisseintlmono text-[var(--color-steel-gray)] uppercase tracking-wide">
                  Press Enter ⏎ to execute
                </div>
                <button
                  type="submit"
                  disabled={isLoading || problem.trim().length < 5}
                  className="cc-btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-[14px] px-[32px] shadow-md"
                >
                  {isLoading ? "Running..." : "Initialize Swarm"}
                </button>
              </div>
            </div>
          </form>
          
          {/* Pipeline visualization when active */}
          <div className={`w-full transition-all duration-700 ${(!isLoading && !result && !error) ? "opacity-0 h-0 overflow-hidden" : "opacity-100 h-auto"}`}>
            <div className="w-full cc-panel p-[40px] flex flex-col items-center justify-center min-h-[160px]">
              <AgentPipeline 
                status={statusData?.status ?? "pending"} 
                currentAgent={statusData?.current_agent ?? null} 
                completedSteps={statusData?.completed_steps ?? []} 
              />
            </div>
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
              <ResultPanel 
                result={result} 
                isLoading={isLoading} 
                currentAgent={statusData?.current_agent} 
                status={statusData?.status}
                onApprove={handleApprove}
              />
            </div>

            {/* Terminal Log Panel */}
            <div className="flex-1 min-w-[350px] flex flex-col">
              <TerminalLog statusData={statusData} />
            </div>
          </section>
        )}

      </main>
    </div>
    </>
  );
}
