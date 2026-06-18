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
  { name: "Planner", label: "Planner", activeStatus: "planning", id: "01", color: "var(--color-voltage-yellow)" },
  { name: "Coder", label: "Coder", activeStatus: "coding", id: "02", color: "var(--color-arc-blue)" },
  { name: "Tester", label: "Tester", activeStatus: "testing", id: "03", color: "var(--color-shock-pink)" },
  { name: "Reviewer", label: "Reviewer", activeStatus: "reviewing", id: "04", color: "var(--color-toxic-lime)" },
] as const;

export default function AgentPipeline({ status, currentAgent, completedSteps, isIdle }: Props) {
  const getState = (agent: typeof AGENTS[number]): "idle" | "active" | "done" => {
    if (completedSteps.includes(agent.name)) return "done";
    if (status === "done" && agent.name === "Reviewer") return "done";
    if (currentAgent === agent.name || status === agent.activeStatus) return "active";
    return "idle";
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacing-14)", justifyContent: "center" }}>
      {AGENTS.map((agent) => {
        const state = isIdle ? "idle" : getState(agent);
        const isActive = state === "active";
        const isDone = state === "done";
        
        let backgroundColor = "var(--color-charcoal-card)";
        let textColor = "var(--color-ash-text)";

        if (isActive) {
          backgroundColor = "var(--color-obsidian-surface)";
          textColor = agent.color;
        } else if (isDone) {
          backgroundColor = agent.color;
          textColor = "var(--color-midnight-canvas)";
        }

        return (
          <motion.div 
            key={agent.name} 
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="tag-chip"
            style={{ 
              backgroundColor, 
              color: textColor,
              padding: "10px 20px",
              fontSize: "14px",
              boxShadow: isActive ? `0 0 0 1px ${agent.color}` : "none",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            {isActive && (
              <motion.span 
                className="material-symbols-outlined" 
                style={{ fontSize: 16 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                sync
              </motion.span>
            )}
            {isDone && (
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                check
              </span>
            )}
            {agent.label}
          </motion.div>
        );
      })}
    </div>
  );
}
