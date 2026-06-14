"use client";
// components/AgentPipeline.tsx — Vivid+Co × SVZ Fusion

import { JobStatus } from "@/lib/api";

interface Props {
  status: JobStatus;
  currentAgent: string | null;
  completedSteps: string[];
}

const AGENTS = [
  { name: "Planner",  label: "PLANNER",  desc: "Breaks problem into steps", activeStatus: "planning" },
  { name: "Coder",    label: "CODER",    desc: "Writes implementation",      activeStatus: "coding" },
  { name: "Tester",   label: "TESTER",   desc: "Generates test cases",       activeStatus: "testing" },
  { name: "Reviewer", label: "REVIEWER", desc: "Reviews & suggests fixes",   activeStatus: "reviewing" },
];

const STATUS_LABELS: Record<JobStatus, string> = {
  pending: "Pending", planning: "Planning", coding: "Coding",
  testing: "Testing", reviewing: "Reviewing", done: "Complete", error: "Error",
};

export default function AgentPipeline({ status, currentAgent, completedSteps }: Props) {
  const getState = (agent: typeof AGENTS[0]): "idle" | "active" | "done" => {
    if (completedSteps.includes(agent.name)) return "done";
    if (status === "done" && agent.name === "Reviewer") return "done";
    if (currentAgent === agent.name || status === agent.activeStatus) return "active";
    return "idle";
  };

  return (
    <div className="fade-in" style={{ position: "relative" }}>
      
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingBottom: "32px", borderBottom: "1px solid rgba(111,135,156,0.3)", marginBottom: "32px",
      }}>
        <div style={{ overflow: "hidden" }}>
          <p style={{
            fontFamily: "var(--font-primary)", fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 400, lineHeight: 1.0, letterSpacing: "-0.02em",
            color: "var(--bone-white)",
          }}>
            Pipeline <span style={{ fontStyle: "italic", fontFamily: "var(--font-serif)", color: "rgba(255,253,249,0.5)" }}>execution</span>
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", textAlign: "right" }}>
          {status !== "done" && status !== "pending" && status !== "error" && (
            <span className="spinner" />
          )}
          {status === "done" && (
            <span className="red-dot" />
          )}
          <p className="caption" style={{ color: "var(--bone-white)" }}>{STATUS_LABELS[status]}</p>
        </div>
      </div>

      {/* Agent rows — vertical editorial list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {AGENTS.map((agent, i) => {
          const state = getState(agent);
          const isActive = state === "active";
          const isDone = state === "done";

          return (
            <div
              key={agent.name}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "24px 0",
                borderBottom: i < AGENTS.length - 1 ? "1px solid rgba(111,135,156,0.15)" : "none",
                transition: "background 0.3s",
              }}
            >
              {/* Index + Name */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "40px" }}>
                <p className="caption" style={{
                  color: isActive ? "var(--bone-white)" : "rgba(255,253,249,0.3)",
                  transition: "color 0.3s",
                  marginTop: "6px",
                }}>
                  0{i + 1}
                </p>
                <div>
                  <p style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: isActive ? "clamp(32px, 4.5vw, 48px)" : "clamp(24px, 3.5vw, 36px)",
                    fontWeight: 400,
                    letterSpacing: "-0.02em",
                    color: isActive
                      ? "var(--bone-white)"
                      : isDone ? "rgba(255,253,249,0.4)"
                      : "rgba(255,253,249,0.2)",
                    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                    lineHeight: 1.0,
                  }}>
                    {agent.label}
                  </p>
                  <div style={{
                    height: isActive ? "auto" : "0",
                    overflow: "hidden",
                    opacity: isActive ? 1 : 0,
                    transition: "all 0.4s ease",
                  }}>
                    <p className="body-lg" style={{ marginTop: "12px", color: "rgba(255,253,249,0.6)" }}>
                      {agent.desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* State indicator — scanning bar */}
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <div style={{
                  width: isActive ? "80px" : "40px",
                  height: "1px",
                  background: isActive
                    ? "var(--arterial-red)"
                    : isDone ? "var(--bone-white)"
                    : "rgba(111,135,156,0.3)",
                  transition: "all 0.4s ease",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  {isActive && (
                    <div style={{
                      position: "absolute", top: 0, left: 0, bottom: 0, right: 0,
                      background: "rgba(255,255,255,0.8)",
                      animation: "scanLine 1.5s ease-in-out infinite alternate",
                    }} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
