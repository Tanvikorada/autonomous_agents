"use client";
// components/AgentPipeline.tsx — SVZ editorial, dramatic step display

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
    <div className="svz-card svz-fade-in" style={{ padding: "48px" }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingBottom: "32px", borderBottom: "1px solid var(--color-iron)", marginBottom: "40px",
      }}>
        <p style={{
          fontFamily: "var(--font-primary)", fontSize: "clamp(28px, 4vw, 42px)",
          fontWeight: 700, lineHeight: 0.95, letterSpacing: "-1.5px",
          color: "var(--color-bone-white)", textTransform: "uppercase",
        }}>
          Running<br />
          <span style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: "italic", fontWeight: 400,
            fontSize: "clamp(20px, 2.8vw, 30px)",
            letterSpacing: "-0.5px", textTransform: "none",
            color: "var(--color-ash)",
          }}>
            the pipeline
          </span>
        </p>
        <div style={{ textAlign: "right" }}>
          {status !== "done" && status !== "pending" && status !== "error" && (
            <span className="svz-spinner" style={{ display: "block", marginBottom: "8px", marginLeft: "auto" }} />
          )}
          {status === "done" && (
            <span style={{
              display: "block", width: "12px", height: "12px", borderRadius: "50%",
              background: "var(--color-arterial-red)", marginLeft: "auto", marginBottom: "8px",
            }} />
          )}
          <p className="svz-status">{STATUS_LABELS[status]}</p>
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
                padding: "20px 0",
                borderBottom: i < AGENTS.length - 1 ? "1px solid var(--color-iron)" : "none",
                transition: "all 0.3s",
              }}
            >
              {/* Index + Name */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "24px" }}>
                <p style={{
                  fontFamily: "var(--font-primary)", fontSize: "10px", fontWeight: 400,
                  letterSpacing: "0.15em", color: "var(--color-iron)",
                  textTransform: "uppercase", minWidth: "24px",
                }}>
                  0{i + 1}
                </p>
                <div>
                  <p style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: isActive ? "24px" : "18px",
                    fontWeight: isActive ? 700 : isDone ? 400 : 400,
                    letterSpacing: isActive ? "-0.5px" : "-0.3px",
                    color: isActive
                      ? "var(--color-bone-white)"
                      : isDone ? "var(--color-iron)"
                      : "var(--color-iron)",
                    textTransform: "uppercase",
                    transition: "all 0.3s",
                    lineHeight: 1.1,
                  }}>
                    {agent.label}
                  </p>
                  <p style={{
                    fontFamily: "var(--font-primary)", fontSize: "12px", fontWeight: 300,
                    color: isActive ? "var(--color-ash)" : "var(--color-iron)",
                    lineHeight: 1.5, marginTop: "2px", transition: "color 0.3s",
                  }}>
                    {agent.desc}
                  </p>
                </div>
              </div>

              {/* State indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {isActive && (
                  <p style={{
                    fontFamily: "var(--font-primary)", fontSize: "10px", fontWeight: 400,
                    letterSpacing: "0.15em", color: "var(--color-ash)", textTransform: "uppercase",
                  }}>
                    Active
                  </p>
                )}
                {/* Red underline bar for active */}
                <div style={{
                  width: "40px", height: "1px",
                  background: isActive
                    ? "var(--color-arterial-red)"
                    : isDone ? "var(--color-bone-white)"
                    : "var(--color-iron)",
                  transition: "background 0.4s",
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
