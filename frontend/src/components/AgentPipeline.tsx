"use client";

import { JobStatus } from "@/lib/api";

interface Props {
  status: JobStatus;
  currentAgent: string | null;
  completedSteps: string[];
}

const AGENTS = [
  { name: "Planner",  label: "Cognitive Planner",  desc: "Deconstructs the prompt into sequential executable tasks.", activeStatus: "planning" },
  { name: "Coder",    label: "Neural Synthesizer", desc: "Generates optimal implementation code across the stack.", activeStatus: "coding" },
  { name: "Tester",   label: "Validation Matrix",  desc: "Simulates edge cases and validates logical correctness.", activeStatus: "testing" },
  { name: "Reviewer", label: "Security Auditor",   desc: "Performs deep static analysis and refactoring passes.", activeStatus: "reviewing" },
];

export default function AgentPipeline({ status, currentAgent, completedSteps }: Props) {
  const getState = (agent: typeof AGENTS[0]): "idle" | "active" | "done" => {
    if (completedSteps.includes(agent.name)) return "done";
    if (status === "done" && agent.name === "Reviewer") return "done";
    if (currentAgent === agent.name || status === agent.activeStatus) return "active";
    return "idle";
  };

  return (
    <div className="glass-panel" style={{ padding: 40, position: "relative", overflow: "hidden" }}>
      {/* Background radial glow */}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "100%", height: "100%", background: "radial-gradient(ellipse, rgba(0, 210, 255, 0.05) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
        <h2 style={{ fontSize: 24, margin: 0, fontWeight: 600, letterSpacing: 1 }}>Swarm Telemetry</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {status !== "done" && status !== "error" && <span className="loader-ring" style={{ width: 16, height: 16 }} />}
          <span style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: 2, color: "var(--accent-4)" }}>
            {status}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "relative" }}>
        {/* Connecting vertical line */}
        <div style={{
          position: "absolute", top: 20, bottom: 20, left: 24, width: 2,
          background: "rgba(255,255,255,0.05)", zIndex: 0
        }} />

        {AGENTS.map((agent, i) => {
          const state = getState(agent);
          const isActive = state === "active";
          const isDone = state === "done";

          return (
            <div key={agent.name} style={{ display: "flex", alignItems: "center", gap: 32, position: "relative", zIndex: 1 }}>
              
              {/* Node Indicator */}
              <div style={{
                width: 50, height: 50, borderRadius: "50%",
                background: isActive ? "var(--accent-4)" : isDone ? "var(--glass-bg)" : "rgba(0,0,0,0.5)",
                border: `2px solid ${isActive ? "var(--accent-4)" : isDone ? "rgba(255,255,255,0.4)" : "var(--glass-border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.4s ease",
                boxShadow: isActive ? "0 0 20px var(--accent-4), 0 0 40px var(--accent-4)" : "none",
                transform: isActive ? "scale(1.1)" : "scale(1)",
              }}>
                <span style={{
                  fontSize: 14, fontWeight: 700, color: isActive ? "#000" : isDone ? "#fff" : "rgba(255,255,255,0.3)"
                }}>
                  0{i + 1}
                </span>
              </div>

              {/* Data Card */}
              <div style={{
                flex: 1, background: isActive ? "rgba(0, 210, 255, 0.05)" : "transparent",
                border: `1px solid ${isActive ? "rgba(0, 210, 255, 0.2)" : "transparent"}`,
                borderRadius: 16, padding: "20px 24px", transition: "all 0.4s ease",
                transform: isActive ? "translateX(10px)" : "translateX(0)"
              }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: isActive ? "#fff" : isDone ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)" }}>
                  {agent.label}
                </div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 8 }}>
                  {agent.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
