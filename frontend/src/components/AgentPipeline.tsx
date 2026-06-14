"use client";
// components/AgentPipeline.tsx — SVZ editorial step tracker

import { JobStatus } from "@/lib/api";

interface Props {
  status: JobStatus;
  currentAgent: string | null;
  completedSteps: string[];
}

const AGENTS = [
  {
    name: "Planner",
    label: "PLANNER",
    description: "Breaks problem into steps",
    activeStatus: "planning",
  },
  {
    name: "Coder",
    label: "CODER",
    description: "Writes implementation",
    activeStatus: "coding",
  },
  {
    name: "Tester",
    label: "TESTER",
    description: "Generates test cases",
    activeStatus: "testing",
  },
  {
    name: "Reviewer",
    label: "REVIEWER",
    description: "Reviews & suggests fixes",
    activeStatus: "reviewing",
  },
];

const STATUS_LABELS: Record<JobStatus, string> = {
  pending:   "Pending",
  planning:  "Planning",
  coding:    "Coding",
  testing:   "Testing",
  reviewing: "Reviewing",
  done:      "Complete",
  error:     "Error",
};

function AgentStep({
  agent,
  state,
  isLast,
}: {
  agent: (typeof AGENTS)[0];
  state: "idle" | "active" | "done";
  isLast: boolean;
}) {
  const isActive = state === "active";
  const isDone   = state === "done";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          paddingBottom: "16px",
        }}
      >
        {/* Agent name — weight and underline carry the state */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: "6px" }}>
          <p
            style={{
              fontFamily: "var(--font-primary)",
              fontSize: "12px",
              fontWeight: isActive ? 700 : isDone ? 400 : 400,
              letterSpacing: "var(--tracking-out-sm)",
              textTransform: "uppercase",
              color: isActive
                ? "var(--color-bone-white)"
                : isDone
                ? "var(--color-iron)"
                : "var(--color-iron)",
              transition: "all 0.3s",
              lineHeight: 1.4,
              whiteSpace: "nowrap",
            }}
          >
            {agent.label}
          </p>
          {/* Active indicator: 1px arterial-red underline */}
          {isActive && (
            <div
              style={{
                position: "absolute",
                bottom: -2,
                left: 0,
                right: 0,
                height: "1px",
                background: "var(--color-arterial-red)",
              }}
            />
          )}
          {/* Done indicator: strikethrough in Iron */}
          {isDone && (
            <div
              style={{
                position: "absolute",
                bottom: -2,
                left: 0,
                right: 0,
                height: "1px",
                background: "var(--color-iron)",
              }}
            />
          )}
        </div>

        {/* Description */}
        <p
          className="svz-label"
          style={{ color: isActive ? "var(--color-ash)" : "var(--color-iron)" }}
        >
          {agent.description}
        </p>

        {/* Active spinner */}
        {isActive && (
          <div style={{ marginTop: "10px" }}>
            <span className="svz-spinner" />
          </div>
        )}
      </div>

      {/* Connector line */}
      {!isLast && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            paddingTop: "6px",
            flexShrink: 0,
            width: "40px",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "1px",
              background: isDone
                ? "var(--color-bone-white)"
                : "var(--color-iron)",
              transition: "background 0.5s",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function AgentPipeline({ status, currentAgent, completedSteps }: Props) {
  const getAgentState = (agent: (typeof AGENTS)[0]): "idle" | "active" | "done" => {
    if (completedSteps.includes(agent.name)) return "done";
    if (status === "done" && agent.name === "Reviewer") return "done";
    if (currentAgent === agent.name || status === agent.activeStatus) return "active";
    return "idle";
  };

  return (
    <div className="svz-card svz-fade-in" style={{ padding: "32px 40px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          paddingBottom: "20px",
          borderBottom: "1px solid var(--color-iron)",
        }}
      >
        <p className="svz-label">Agent Pipeline</p>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {status === "done" && <span className="svz-accent-dot" />}
          <span className="svz-status">{STATUS_LABELS[status]}</span>
        </div>
      </div>

      {/* Pipeline strip */}
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        {AGENTS.map((agent, i) => (
          <AgentStep
            key={agent.name}
            agent={agent}
            state={getAgentState(agent)}
            isLast={i === AGENTS.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
