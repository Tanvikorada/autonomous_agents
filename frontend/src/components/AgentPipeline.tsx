"use client";

import { JobStatus } from "@/lib/api";

interface Props {
  status: JobStatus | "pending";
  currentAgent: string | null;
  completedSteps: string[];
  isIdle?: boolean;
}

const AGENTS = [
  { name: "Planner", label: "Cognitive Planner", activeStatus: "planning", id: "01" },
  { name: "Coder", label: "Neural Synthesizer", activeStatus: "coding", id: "02" },
  { name: "Tester", label: "Validation Matrix", activeStatus: "testing", id: "03" },
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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
      {AGENTS.map(agent => {
        const state = isIdle ? "idle" : getState(agent);
        const isActive = state === "active";
        const isDone = state === "done";
        
        return (
          <div key={agent.name} className="transparent-task-card" style={{ 
            display: "flex", 
            alignItems: "flex-start", 
            gap: 12,
            opacity: isActive ? 1 : isDone ? 0.7 : 0.4,
            transition: "opacity 0.2s ease"
          }}>
            <div style={{ 
              fontFamily: "var(--font-pplxsansmono)", 
              fontSize: "10px", 
              fontWeight: 600, 
              color: isActive ? "var(--color-teal-accent)" : "var(--color-moss-shadow)",
              marginTop: 4 
            }}>
              {agent.id}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{
                fontFamily: "var(--font-pplxsans)",
                fontSize: "var(--text-body)",
                fontWeight: 500,
                color: "var(--color-aged-sepia)",
                letterSpacing: "-0.028em"
              }}>
                {agent.label}
              </span>
              <span style={{
                fontFamily: "var(--font-pplxsans)",
                fontSize: "var(--text-body-sm)",
                color: "var(--color-moss-shadow)",
              }}>
                {isActive ? "Processing..." : isDone ? "Complete" : "Queued"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
