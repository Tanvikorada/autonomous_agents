"use client";

import { JobStatus } from "@/lib/api";

interface Props {
  status: JobStatus | "pending";
  currentAgent: string | null;
  completedSteps: string[];
  isIdle?: boolean;
}

const AGENTS = [
  { name: "Planner", label: "Cognitive Planner", activeStatus: "planning", id: "01", color: "var(--color-voltage-yellow)" },
  { name: "Coder", label: "Neural Synthesizer", activeStatus: "coding", id: "02", color: "var(--color-arc-blue)" },
  { name: "Tester", label: "Validation Matrix", activeStatus: "testing", id: "03", color: "var(--color-shock-pink)" },
  { name: "Reviewer", label: "Security Auditor", activeStatus: "reviewing", id: "04", color: "var(--color-toxic-lime)" },
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
              gap: "var(--spacing-16)", 
              position: "relative",
              paddingBottom: index !== AGENTS.length - 1 ? "var(--spacing-34)" : "0" 
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
                  backgroundColor: isDone ? agent.color : "var(--color-obsidian-surface)",
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
              backgroundColor: "var(--color-midnight-canvas)" 
            }}>
              {isDone ? (
                <span className="material-symbols-outlined" style={{ color: agent.color, fontSize: 20, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              ) : isActive ? (
                <span className="material-symbols-outlined" style={{ color: agent.color, fontSize: 20, display: "inline-block", borderRadius: "50%", animation: "spin 2s linear infinite" }}>sync</span>
              ) : (
                <span className="material-symbols-outlined" style={{ color: "var(--color-charcoal-mute)", fontSize: 20 }}>radio_button_unchecked</span>
              )}
            </div>

            {/* Label and status */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-5)", marginTop: "-2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-10)" }}>
                <span style={{
                  fontFamily: "var(--font-canvasans)",
                  fontSize: "16px",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive || isDone ? "var(--color-bone-white)" : "var(--color-charcoal-mute)",
                  transition: "color 0.3s ease"
                }}>
                  {agent.label}
                </span>
                <span className="tag-chip" style={{ backgroundColor: agent.color, color: "var(--color-obsidian-surface)" }}>
                  {agent.id}
                </span>
              </div>
              <span style={{
                fontFamily: "var(--font-canvasans)",
                fontSize: "12px",
                color: isActive ? agent.color : "var(--color-charcoal-mute)",
                transition: "color 0.3s ease"
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
