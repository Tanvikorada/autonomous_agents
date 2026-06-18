"use client";

import { JobStatus } from "@/lib/api";

interface Props {
  status: JobStatus | "pending";
  currentAgent: string | null;
  completedSteps: string[];
  isIdle?: boolean;
}

const AGENTS = [
  {
    name: "Planner",
    label: "Cognitive Planner",
    desc: "Drafting project blueprint and task breakdown.",
    activeStatus: "planning",
    idleIcon: "psychology",
  },
  {
    name: "Coder",
    label: "Neural Synthesizer",
    desc: "Synthesizing implementation code across the stack.",
    activeStatus: "coding",
    idleIcon: "memory",
  },
  {
    name: "Tester",
    label: "Validation Matrix",
    desc: "Generating pytest suite and edge-case coverage.",
    activeStatus: "testing",
    idleIcon: "hourglass_empty",
  },
  {
    name: "Reviewer",
    label: "Security Auditor",
    desc: "Performing deep static analysis and refactoring.",
    activeStatus: "reviewing",
    idleIcon: "lock_open",
  },
] as const;

export default function AgentPipeline({ status, currentAgent, completedSteps, isIdle }: Props) {
  const getState = (agent: typeof AGENTS[number]): "idle" | "active" | "done" => {
    if (completedSteps.includes(agent.name)) return "done";
    if (status === "done" && agent.name === "Reviewer") return "done";
    if (currentAgent === agent.name || status === agent.activeStatus) return "active";
    return "idle";
  };

  return (
    <div>
      <h3 style={{
        fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 400,
        color: "#bbc9cf", textTransform: "uppercase", letterSpacing: "0.1em",
        margin: "0 0 28px 0",
      }}>
        Swarm Telemetry
      </h3>

      <div style={{ position: "relative", paddingLeft: 32 }}>
        {/* Vertical dashed connector line */}
        <div className="pipeline-line" style={{
          position: "absolute", left: 11, top: 12, bottom: 12, width: 2,
        }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          {AGENTS.map(agent => {
            const state   = isIdle ? "idle" : getState(agent);
            const isActive = state === "active";
            const isDone   = state === "done";
            const dimmed   = state === "idle" && !isIdle;

            return (
              <div
                key={agent.name}
                style={{
                  position: "relative",
                  display: "flex", flexDirection: "column", gap: 6,
                  opacity: dimmed ? 0.4 : isIdle ? 0.45 : 1,
                  transition: "opacity 0.4s ease",
                  transform: isActive ? "scale(1.02)" : "scale(1)",
                }}
              >
                {/* Node indicator */}
                <div
                  className={isActive ? "active-agent-pulse" : ""}
                  style={{
                    position: "absolute",
                    left: isActive ? -32 : -28,
                    top: 2,
                    width:  isActive ? 32 : 24,
                    height: isActive ? 32 : 24,
                    borderRadius: "50%",
                    border: `2px solid ${isDone ? "#b6ebff" : isActive ? "#47d6ff" : "rgba(255,255,255,0.12)"}`,
                    background: isDone ? "transparent" : isActive ? "rgba(71,214,255,0.15)" : "#131313",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 10,
                    transition: "all 0.4s ease",
                  }}
                >
                  <span
                    className={`material-symbols-outlined ${isActive ? "spin-icon" : ""}`}
                    style={{
                      fontSize: isActive ? 20 : 16,
                      color: isDone ? "#b6ebff" : isActive ? "#47d6ff" : "#859399",
                      fontVariationSettings: isDone ? "'FILL' 1" : "'FILL' 0",
                    }}
                  >
                    {isDone ? "check_circle" : isActive ? "sync" : agent.idleIcon}
                  </span>
                </div>

                {/* Label row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{
                    margin: 0,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 15, fontWeight: 600,
                    color: isActive ? "#ffffff" : isDone ? "#b6ebff" : "#e5e2e1",
                  }}>
                    {agent.label}
                  </h4>
                  <span style={{
                    fontFamily: "'Geist', monospace", fontSize: 10,
                    color: isActive ? "#47d6ff" : isDone ? "rgba(182,235,255,0.55)" : "#859399",
                    animation: isActive ? "pulse 1.5s infinite" : "none",
                  }}>
                    {isActive ? "ACTIVE" : isDone ? "DONE" : "IDLE"}
                  </span>
                </div>

                {/* Description */}
                <p style={{
                  margin: 0, fontFamily: "'Outfit', sans-serif",
                  fontSize: 12, color: "#bbc9cf", lineHeight: 1.5,
                }}>
                  {agent.desc}
                </p>

                {/* Progress bar (active only) */}
                {isActive && (
                  <div style={{
                    width: "100%", height: 3, borderRadius: 4,
                    background: "rgba(255,255,255,0.06)",
                    overflow: "hidden", marginTop: 6,
                  }}>
                    <div style={{
                      height: "100%",
                      width: "65%",
                      background: "#47d6ff",
                      boxShadow: "0 0 10px rgba(71,214,255,0.8)",
                      borderRadius: 4,
                    }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
