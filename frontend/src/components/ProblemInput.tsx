"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  onSubmit: (problem: string) => void;
  isLoading: boolean;
}

export default function ProblemInput({ onSubmit, isLoading }: Props) {
  const [problem, setProblem] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (problem.trim().length >= 10) onSubmit(problem.trim());
  };

  const canSubmit = !isLoading && problem.trim().length >= 10;

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="glass-panel p-6 flex flex-col gap-4 relative overflow-hidden group"
      whileHover={{ boxShadow: "0 8px 40px rgba(0, 0, 0, 0.4)" }}
      transition={{ duration: 0.3 }}
    >
      {/* Subtle ambient glow behind the form */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100"></div>

      <div className="flex flex-col gap-1.5 z-10">
        <label className="text-sm font-semibold tracking-wide text-white/90">Initialize Swarm</label>
        <p className="text-xs text-white/50">
          Describe the architecture, features, and functionality you require.
        </p>
      </div>
      
      <div className="relative z-10">
        <textarea
          value={problem}
          onChange={e => setProblem(e.target.value)}
          disabled={isLoading}
          placeholder="e.g. Build an autonomous trading bot in Python that checks Binance API..."
          rows={5}
          className="glass-input w-full p-4 text-sm resize-none placeholder:text-white/30"
        />
      </div>
      
      <div className="flex justify-between items-center mt-2 z-10">
        <span className="text-xs font-mono text-white/40">
          {problem.length < 10 ? `[ ERR: MIN_CHARS ${10 - problem.length} ]` : "[ SYSTEM: READY ]"}
        </span>
        <button
          type="submit"
          disabled={!canSubmit}
          className="glow-btn flex items-center justify-center gap-2 min-w-[140px]"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Deploying...
            </>
          ) : (
            <>
              Deploy Swarm
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
}
