"use client";
// components/AgentPipeline.tsx — Visual step-by-step pipeline tracker

import { JobStatus } from "@/lib/api";

interface Props {
  status: JobStatus;
  currentAgent: string | null;
  completedSteps: string[];
}

const AGENTS = [
  {
    name: "Planner",
    icon: "🧠",
    description: "Breaks problem into steps",
    color: "var(--agent-planner)",
    activeStatus: "planning",
  },
  {
    name: "Coder",
    icon: "💻",
    description: "Writes implementation code",
    color: "var(--agent-coder)",
    activeStatus: "coding",
  },
  {
    name: "Tester",
    icon: "🧪",
    description: "Generates test cases",
    color: "var(--agent-tester)",
    activeStatus: "testing",
  },
  {
    name: "Reviewer",
    icon: "🔍",
    description: "Reviews & suggests fixes",
    color: "var(--agent-reviewer)",
    activeStatus: "reviewing",
  },
];

function AgentCard({
  agent,
  state,
}: {
  agent: (typeof AGENTS)[0];
  state: "idle" | "active" | "done";
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Icon circle */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          background:
            state === "done"
              ? `${agent.color}22`
              : state === "active"
              ? `${agent.color}33`
              : "rgba(255,255,255,0.04)",
          border: `2px solid ${
            state === "done"
              ? `${agent.color}88`
              : state === "active"
              ? agent.color
              : "var(--border)"
          }`,
          boxShadow:
            state === "active"
              ? `0 0 20px ${agent.color}55, 0 0 40px ${agent.color}22`
              : "none",
          transition: "all 0.4s ease",
          position: "relative",
        }}
        className={state === "active" ? "pulse-glow" : ""}
      >
        {state === "done" ? "✅" : agent.icon}

        {/* Active spinner ring */}
        {state === "active" && (
          <div
            style={{
              position: "absolute",
              inset: -4,
              borderRadius: "50%",
              border: `2px solid transparent`,
              borderTopColor: agent.color,
              animation: "spin 1s linear infinite",
            }}
          />
        )}
      </div>

      {/* Label */}
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontWeight: 600,
            fontSize: 14,
            color:
              state === "active"
                ? agent.color
                : state === "done"
                ? "var(--text-primary)"
                : "var(--text-muted)",
            transition: "color 0.3s",
          }}
        >
          {agent.name}
        </p>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          {agent.description}
        </p>
      </div>
    </div>
  );
}

export default function AgentPipeline({ status, currentAgent, completedSteps }: Props) {
  const getAgentState = (agent: (typeof AGENTS)[0]): "idle" | "active" | "done" => {
    if (completedSteps.includes(agent.name)) return "done";
    if (status === "done" && agent.name === "Reviewer") return "done"; // reviewer completes on done
    if (currentAgent === agent.name || status === agent.activeStatus) return "active";
    return "idle";
  };

  return (
    <div className="glass-card p-6 fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h3 style={{ fontWeight: 600, fontSize: 16 }}>Agent Pipeline</h3>
        <StatusBadgeInline status={status} />
      </div>

      {/* Pipeline row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
        {AGENTS.map((agent, i) => (
          <div key={agent.name} style={{ display: "flex", alignItems: "flex-start", flex: 1 }}>
            <AgentCard agent={agent} state={getAgentState(agent)} />

            {/* Arrow connector */}
            {i < AGENTS.length - 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  paddingTop: 20,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 2,
                    background:
                      completedSteps.includes(AGENTS[i + 1].name) ||
                      status === AGENTS[i + 1].activeStatus
                        ? `linear-gradient(90deg, ${agent.color}, ${AGENTS[i + 1].color})`
                        : "var(--border)",
                    transition: "background 0.5s",
                  }}
                />
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: "6px solid",
                    borderLeftColor:
                      completedSteps.includes(AGENTS[i + 1].name) ||
                      status === AGENTS[i + 1].activeStatus
                        ? AGENTS[i + 1].color
                        : "var(--border)",
                    borderTop: "4px solid transparent",
                    borderBottom: "4px solid transparent",
                    transition: "border-color 0.5s",
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadgeInline({ status }: { status: JobStatus }) {
  const labels: Record<JobStatus, string> = {
    pending: "⏳ Pending",
    planning: "🧠 Planning",
    coding: "💻 Coding",
    testing: "🧪 Testing",
    reviewing: "🔍 Reviewing",
    done: "✅ Done",
    error: "❌ Error",
  };
  return (
    <span className={`status-badge status-${status}`}>
      {labels[status] ?? status}
    </span>
  );
}
