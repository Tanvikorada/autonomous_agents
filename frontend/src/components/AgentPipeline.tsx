"use client";

import { JobStatus } from "@/lib/api";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";

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
          <Tilt
            key={agent.name}
            tiltMaxAngleX={10}
            tiltMaxAngleY={10}
            glareEnable={true}
            glareMaxOpacity={0.1}
            glareColor="#ffffff"
            glarePosition="all"
            transitionSpeed={2500}
            tiltReverse={true}
            className="relative w-full"
            style={{ width: "100%" }}
          >
            <motion.div 
              className="flex gap-4 relative w-full"
              animate={{ opacity: isActive || isDone ? 1 : 0.4 }}
              transition={{ duration: 0.5 }}
            >
              {/* Animated Laser Pulse Line */}
              {index !== AGENTS.length - 1 && (
                <div className="absolute left-[11px] top-[30px] w-[2px] h-[calc(100%+8px)] bg-white/10 overflow-hidden">
                  {isActive && (
                    <motion.div 
                      className="w-full h-8 bg-gradient-to-b from-transparent via-purple-500 to-transparent"
                      animate={{ y: ["-100%", "300%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  {isDone && (
                    <div className="w-full h-full bg-gradient-to-b from-[hsl(262,83%,58%)] to-[#33d0ff]" />
                  )}
                </div>
              )}
              
              {/* Glowing Orb Indicator */}
              <div className="z-10 flex items-center justify-center mt-1">
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500
                    ${isActive ? "bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8)]" 
                    : isDone ? "bg-gradient-to-br from-purple-500 to-[#33d0ff] shadow-[0_0_10px_rgba(51,208,255,0.4)]" 
                    : "bg-black/50 border border-white/20"}`}
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

              {/* Content Card */}
              <div className="flex flex-col gap-1.5 bg-white/[0.02] border border-white/5 p-3 rounded-lg w-full backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold tracking-wide ${isActive || isDone ? "text-white" : "text-white/50"}`}>
                    {agent.label}
                  </span>
                  <span className={`glass-badge ${isActive ? "glass-badge-active" : "opacity-50"}`}>
                    {state.toUpperCase()}
                  </span>
                </div>
                <p className="text-[10px] text-white/40 font-mono tracking-wider uppercase">
                  {isActive ? "> Executing neural routines..." : isDone ? "> Sequence complete." : "> Awaiting authorization."}
                </p>
              </div>
            </motion.div>
          </Tilt>
        );
      })}
    </div>
  );
}
