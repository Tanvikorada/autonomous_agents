"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { startPipeline, getJobStatus, getJobResult, PipelineResult, JobStatusResponse } from "@/lib/api";
import ProblemInput from "@/components/ProblemInput";
import AgentPipeline from "@/components/AgentPipeline";
import ResultPanel from "@/components/ResultPanel";
import IntroSequence from "@/components/IntroSequence";
import OpticalIllustration from "@/components/OpticalIllustration";

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
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
    <>
      {showIntro && <IntroSequence onComplete={() => setShowIntro(false)} />}
      
      {!showIntro && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="min-h-screen text-[hsl(var(--foreground))] selection:bg-purple-500/30 relative"
        >
          <OpticalIllustration />
          
          {/* Content Layer */}
          <div className="relative z-10">
            {/* Premium Navbar */}
            <motion.header 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/40 backdrop-blur-xl"
            >
              <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                <div className="flex items-center gap-3 font-semibold tracking-tight text-white/90">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                    </svg>
                  </div>
                  Swarm UI
                </div>
                <nav className="flex items-center gap-6">
                  <a href="#" className="text-sm font-medium text-white/60 transition-colors hover:text-white">Documentation</a>
                  <button className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-white/10">
                    Sign In
                  </button>
                </nav>
              </div>
            </motion.header>

            <main className="container mx-auto max-w-6xl px-6 py-12 lg:py-20">
              
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="flex flex-col items-center text-center space-y-6 mb-20"
              >
                <div className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300 backdrop-blur-md">
                  <span className="flex h-2 w-2 rounded-full bg-purple-500 mr-2 animate-pulse"></span>
                  Agent Swarm Active
                </div>
                <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-white">
                  Design. Build. <br/>
                  <span className="shiny-text">Deploy.</span>
                </h1>
                <p className="max-w-2xl text-lg text-white/50 leading-relaxed font-light">
                  Orchestrate a swarm of autonomous AI agents to plan, write, and validate your software architecture in real-time.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Main Input & Results Area */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="lg:col-span-8 space-y-8"
                >
                  <ProblemInput onSubmit={handleSubmit} isLoading={isLoading} />
                  
                  <AnimatePresence mode="popLayout">
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="super-glass p-4"
                      >
                        <p className="text-sm font-medium text-red-400">Error: {error}</p>
                      </motion.div>
                    )}

                    {result && (
                      <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, type: "spring", bounce: 0.2 }}
                      >
                        <ResultPanel result={result} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Telemetry Sidebar */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="lg:col-span-4 sticky top-24"
                >
                  <div className="super-glass p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white/90">Agent Telemetry</h3>
                        <p className="text-xs text-white/50">Real-time execution status</p>
                      </div>
                      {isLoading && (
                        <div className="h-4 w-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
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
        </motion.div>
      )}
    </>
  );
}
