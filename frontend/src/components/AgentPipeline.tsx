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
    <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
      {AGENTS.map((agent, index) => {
        const state = isIdle ? "idle" : getState(agent);
        const isActive = state === "active";
        const isDone = state === "done";
        
        return (
          <div 
            key={agent.name} 
            style={{ 
              display: "flex", 
              gap: 16, 
              position: "relative",
              paddingBottom: index !== AGENTS.length - 1 ? "24px" : "0" 
            }}
          >
            {/* Connecting track line */}
            {index !== AGENTS.length - 1 && (
              <div 
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "22px",
                  bottom: "0",
                  width: "2px",
                  backgroundColor: isDone ? "var(--color-teal-accent)" : "var(--color-fog)",
                  zIndex: 0,
                  transition: "background-color 0.4s ease"
                }}
              />
            )}
            
            {/* Indicator Circle */}
            <div style={{ 
              zIndex: 1, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              width: "22px", 
              height: "22px", 
              borderRadius: "50%", 
              backgroundColor: "var(--surface-parchment-canvas)" 
            }}>
              {isDone ? (
                <span className="material-symbols-outlined" style={{ color: "var(--color-teal-accent)", fontSize: 20, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              ) : isActive ? (
                <span className="material-symbols-outlined pulse-active" style={{ color: "var(--color-teal-accent)", fontSize: 20, display: "inline-block", borderRadius: "50%" }}>pending</span>
              ) : (
                <span className="material-symbols-outlined" style={{ color: "var(--color-fog)", fontSize: 20 }}>radio_button_unchecked</span>
              )}
            </div>

            {/* Label and status */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontFamily: "var(--font-pplxsans)",
                  fontSize: "var(--text-body)",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "var(--color-teal-accent)" : "var(--color-aged-sepia)",
                  letterSpacing: "-0.028em"
                }}>
                  {agent.label}
                </span>
                <span className="mono-badge" style={{ fontSize: "9px", padding: "1px 4px" }}>
                  {agent.id}
                </span>
              </div>
              <span style={{
                fontFamily: "var(--font-pplxsans)",
                fontSize: "var(--text-body-sm)",
                color: isActive ? "var(--color-teal-accent)" : "var(--color-moss-shadow)",
              }}>
                {isActive ? "Orchestrating agent synthesis..." : isDone ? "Step completed successfully" : "Awaiting queue activation"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
