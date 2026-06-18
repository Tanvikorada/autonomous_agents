"use client";

import { JobStatus } from "@/lib/api";

interface Props {
  status: JobStatus | "pending";
  currentAgent: string | null;
  completedSteps: string[];
  isIdle?: boolean;
}

const AGENTS = [
  { name: "Planner", label: "COGNITIVE PLANNER", activeStatus: "planning" },
  { name: "Coder", label: "NEURAL SYNTHESIZER", activeStatus: "coding" },
  { name: "Tester", label: "VALIDATION MATRIX", activeStatus: "testing" },
  { name: "Reviewer", label: "SECURITY AUDITOR", activeStatus: "reviewing" },
] as const;

export default function AgentPipeline({ status, currentAgent, completedSteps, isIdle }: Props) {
  const getState = (agent: typeof AGENTS[number]): "idle" | "active" | "done" => {
    if (completedSteps.includes(agent.name)) return "done";
    if (status === "done" && agent.name === "Reviewer") return "done";
    if (currentAgent === agent.name || status === agent.activeStatus) return "active";
    return "idle";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
      {AGENTS.map(agent => {
        const state = isIdle ? "idle" : getState(agent);
        const isActive = state === "active";
        const isDone = state === "done";
        
        let color = "var(--color-smoke)";
        if (isActive) color = "var(--color-paper-white)";
        if (isDone) color = "var(--color-paper-white)";

        return (
          <div key={agent.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              display: "inline-block",
              width: 4, height: 4,
              borderRadius: "50%",
              backgroundColor: isActive ? "var(--color-paper-white)" : "transparent",
              border: isActive ? "none" : `1px solid ${color}`
            }} />
            <span style={{
              fontFamily: "var(--font-saans)",
              fontSize: "var(--text-caption)",
              letterSpacing: "var(--tracking-caption)",
              color: color,
              opacity: isActive ? 1 : isDone ? 0.7 : 0.4
            }}>
              {agent.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
