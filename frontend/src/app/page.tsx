"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    <div className="min-h-screen text-[#ededed] font-sans selection:bg-white/20">
      
      {/* Clean Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-[#111] bg-black/80 backdrop-blur-md">
        <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2 font-medium tracking-tight text-white">
            <div className="h-4 w-4 bg-white rounded-sm"></div>
            SWARM
          </div>
          <nav className="flex items-center gap-6">
            <a href="#" className="text-sm font-medium text-[#888] hover:text-white transition-colors">Docs</a>
            <button className="text-sm font-medium text-black bg-white px-3 py-1 rounded-sm hover:bg-[#ccc] transition-colors">
              Deploy
            </button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-6 py-24 lg:py-32">
        
        {/* Brutalist Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col space-y-6 mb-24 max-w-3xl"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-white"></span>
            <span className="text-[11px] font-medium tracking-widest uppercase text-[#888]">Infrastructure</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-semibold tracking-tight text-white leading-[1.1]">
            Build software <br/> at the speed of thought.
          </h1>
          <p className="text-lg text-[#888] leading-relaxed max-w-xl font-normal">
            Orchestrate a swarm of autonomous AI agents. Describe your architecture, and the swarm will synthesize, test, and deploy the source code.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Main Input & Results Area */}
          <div className="lg:col-span-8 space-y-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <ProblemInput onSubmit={handleSubmit} isLoading={isLoading} />
            </motion.div>
            
            <AnimatePresence mode="popLayout">
              {error && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="panel p-4 border-red-500/20 bg-red-500/5"
                >
                  <p className="text-sm text-red-400 font-medium">Error: {error}</p>
                </motion.div>
              )}

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <ResultPanel result={result} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Telemetry Sidebar */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-4 sticky top-24"
          >
            <div className="panel p-6 space-y-8">
              <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-4">
                <h3 className="text-sm font-semibold text-white tracking-wide">Execution State</h3>
                {isLoading && (
                  <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                )}
              </div>
              <AgentPipeline 
                status={statusData?.status ?? "pending"} 
                currentAgent={statusData?.current_agent ?? null} 
                completedSteps={statusData?.completed_steps ?? []} 
                isIdle={!isLoading} 
              />
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
