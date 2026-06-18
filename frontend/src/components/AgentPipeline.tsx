"use client";

import { JobStatus } from "@/lib/api";
import { motion } from "framer-motion";

interface Props {
  status: JobStatus | "pending";
  currentAgent: string | null;
  completedSteps: string[];
  isIdle?: boolean;
}

const AGENTS = [
  { name: "Planner", label: "Architecture Planner", activeStatus: "planning", id: "01" },
  { name: "Coder", label: "Software Engineer", activeStatus: "coding", id: "02" },
  { name: "Tester", label: "QA Automation", activeStatus: "testing", id: "03" },
  { name: "Reviewer", label: "Security Auditor", activeStatus: "reviewing", id: "04" },
] as const;

export default function AgentPipeline({ status, currentAgent, completedSteps, isIdle }: Props) {
  const getState = (agent: typeof AGENTS[number]): "idle" | "active" | "done" => {
    if (completedSteps.includes(agent.name)) return "done";
    if (status === "done" && agent.name === "Reviewer") return "done";
    if (currentAgent === agent.name || status === agent.activeStatus) return "active";
    return "idle";
  };

  return (
    <div className="flex flex-col gap-6 relative ml-2">
      {AGENTS.map((agent, index) => {
        const state = isIdle ? "idle" : getState(agent);
        const isActive = state === "active";
        const isDone = state === "done";

        return (
          <motion.div 
            key={agent.name} 
            className="flex gap-4 relative"
            animate={{ opacity: isActive || isDone ? 1 : 0.4 }}
            transition={{ duration: 0.5 }}
          >
            {/* Connecting Line */}
            {index !== AGENTS.length - 1 && (
              <div 
                className="absolute left-[11px] top-[30px] w-[2px] h-[calc(100%+8px)]"
                style={{
                  background: isDone 
                    ? "linear-gradient(to bottom, hsl(262, 83%, 58%), hsl(280, 80%, 50%))" 
                    : "rgba(255, 255, 255, 0.1)"
                }}
              />
            )}
            
            {/* Glowing Orb Indicator */}
            <div className="z-10 flex items-center justify-center mt-1">
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500
                  ${isActive ? "bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)]" 
                  : isDone ? "bg-gradient-to-br from-purple-500 to-indigo-600 shadow-[0_0_10px_rgba(168,85,247,0.3)]" 
                  : "bg-white/5 border border-white/10"}`}
              >
                {isDone ? (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : isActive ? (
                  <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold tracking-wide ${isActive || isDone ? "text-white" : "text-white/50"}`}>
                  {agent.label}
                </span>
                <span className={`glass-badge ${isActive ? "glass-badge-active" : "opacity-50"}`}>
                  {state.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-white/40 font-mono">
                {isActive ? "> Executing neural routines..." : isDone ? "> Sequence complete." : "> Awaiting authorization."}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
