"use client";

import { useState, useEffect, useRef } from "react";
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
    <div style={{ backgroundColor: "var(--color-midnight-canvas)", minHeight: "100vh" }}>
      
      {/* Navigation */}
      <nav style={{ 
        position: "absolute", top: 0, left: 0, right: 0, 
        height: "80px", display: "flex", justifyContent: "space-between", alignItems: "center", 
        padding: "0 var(--spacing-44)", zIndex: 10 
      }}>
        <div style={{ fontFamily: "var(--font-canvasans)", fontWeight: 700, fontSize: "16px", letterSpacing: "1px", color: "var(--color-bone-white)" }}>
          SWARM_OS.
        </div>
        <div style={{ display: "flex", gap: "var(--spacing-20)" }}>
          <button className="ghost-cta">Developer API</button>
          <button className="primary-cta" style={{ padding: "7px 14px", fontSize: "14px" }}>Log in</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ 
        minHeight: "80vh", width: "100%", display: "flex", flexDirection: "column", 
        justifyContent: "center", alignItems: "center", paddingTop: "120px", position: "relative"
      }}>
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <div className="display-xl" style={{ color: "var(--color-leonardo-violet)", zIndex: 1, position: "relative" }}>
            SWARM
          </div>
          <div className="display-xl" style={{ color: "var(--color-leonardo-violet)", marginTop: "-0.2em", zIndex: 2, position: "relative" }}>
            OS
          </div>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
          className="heading-sm" 
          style={{ marginTop: "var(--spacing-41)", zIndex: 2, textAlign: "center" }}
        >
          THE AUTONOMOUS MULTI-AGENT SYSTEM
        </motion.h1>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginTop: "var(--spacing-68)", width: "100%", maxWidth: "800px", padding: "0 var(--spacing-20)" }}
        >
          <ProblemInput onSubmit={handleSubmit} isLoading={isLoading} />
        </motion.div>
      </section>

      {/* Pipeline / Telemetry Area */}
      <AnimatePresence>
        {(isLoading || statusData) && (
          <motion.section 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ maxWidth: "var(--page-max-width)", margin: "0 auto", padding: "var(--spacing-80) var(--spacing-44)", display: "flex", justifyContent: "center", overflow: "hidden" }}
          >
            <AgentPipeline 
              status={statusData?.status ?? "pending"} 
              currentAgent={statusData?.current_agent ?? null} 
              completedSteps={statusData?.completed_steps ?? []} 
              isIdle={!isLoading} 
            />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Results Gallery Area */}
      <AnimatePresence>
        {error && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ maxWidth: "var(--page-max-width)", margin: "0 auto", padding: "0 var(--spacing-44) var(--spacing-80)" }}
          >
            <div className="charcoal-card" style={{ borderLeft: "4px solid var(--color-ember-coral)" }}>
              <span style={{ color: "var(--color-ember-coral)", fontWeight: 500 }}>Error: {error}</span>
            </div>
          </motion.section>
        )}

        {result && (
          <motion.section 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ maxWidth: "var(--page-max-width)", margin: "0 auto", padding: "0 var(--spacing-44) var(--spacing-80)" }}
          >
            <ResultPanel result={result} />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer style={{ padding: "var(--spacing-80) var(--spacing-44)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "var(--font-canvasans)", fontWeight: 700, fontSize: "14px", color: "var(--color-ash-text)" }}>SWARM_OS</div>
        <div style={{ display: "flex", gap: "var(--spacing-20)" }}>
          <span className="body-text" style={{ cursor: "pointer", fontSize: "14px" }}>Documentation</span>
          <span className="body-text" style={{ cursor: "pointer", fontSize: "14px" }}>Privacy Policy</span>
          <span className="body-text" style={{ cursor: "pointer", fontSize: "14px" }}>Terms of Service</span>
        </div>
      </footer>
    </div>
  );
}
