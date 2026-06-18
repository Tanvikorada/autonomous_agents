"use client";

import { JobStatus } from "@/lib/api";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import Image from "next/image";

interface Props {
  status: JobStatus | "pending";
  currentAgent: string | null;
  completedSteps: string[];
  isIdle?: boolean;
}

const AGENTS = [
  { name: "Planner", label: "Alex (Architect)", activeStatus: "planning", id: "01", avatar: "/avatars/planner.png" },
  { name: "Coder", label: "Nova (Engineer)", activeStatus: "coding", id: "02", avatar: "/avatars/coder.png" },
  { name: "Tester", label: "Kai (QA Testing)", activeStatus: "testing", id: "03", avatar: "/avatars/tester.png" },
  { name: "Reviewer", label: "Zara (Security)", activeStatus: "reviewing", id: "04", avatar: "/avatars/reviewer.png" },
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
            tiltMaxAngleX={5}
            tiltMaxAngleY={5}
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
              animate={{ opacity: isActive || isDone ? 1 : 0.5 }}
              transition={{ duration: 0.5 }}
            >
              {/* Animated Connection Line */}
              {index !== AGENTS.length - 1 && (
                <div className="absolute left-[20px] top-[48px] w-[2px] h-[calc(100%-4px)] bg-white/5 overflow-hidden rounded-full">
                  {isActive && (
                    <motion.div 
                      className="w-full h-8 bg-gradient-to-b from-transparent via-purple-500 to-transparent"
                      animate={{ y: ["-100%", "300%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  {isDone && (
                    <div className="w-full h-full bg-gradient-to-b from-purple-500 to-purple-500/50" />
                  )}
                </div>
              )}
              
              {/* Avatar Indicator */}
              <div className="z-10 flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 overflow-hidden
                    ${isActive ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-[#050505] shadow-[0_0_20px_rgba(168,85,247,0.6)]" 
                    : isDone ? "ring-2 ring-[#33d0ff]/50 ring-offset-2 ring-offset-[#050505]" 
                    : "ring-1 ring-white/10 opacity-70 grayscale"}`}
                >
                  <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Content Card */}
              <div className="flex flex-col gap-2 bg-white/[0.02] border border-white/5 p-4 rounded-2xl w-full backdrop-blur-md shadow-xl">
                <div className="flex items-center gap-3">
                  <span className={`text-[15px] font-semibold tracking-tight ${isActive || isDone ? "text-white" : "text-white/60"}`}>
                    {agent.label}
                  </span>
                  {isActive && (
                    <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse ml-auto"></span>
                  )}
                  {isDone && (
                    <svg className="w-4 h-4 text-[#33d0ff] ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  {isActive ? "Currently synthesizing the solution matrix..." : isDone ? "Task successfully verified and completed." : "Awaiting upstream dependencies."}
                </p>
              </div>
            </motion.div>
          </Tilt>
        );
      })}
    </div>
  );
}
