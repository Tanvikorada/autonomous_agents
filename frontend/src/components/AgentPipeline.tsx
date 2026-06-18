"use client";

import { JobStatus } from "@/lib/api";

interface Props {
  status: JobStatus | "pending";
  currentAgent: string | null;
  completedSteps: string[];
  isIdle?: boolean;
}

const AGENTS = [
  { name: "Planner", label: "Planner", activeStatus: "planning", id: "01" },
  { name: "Coder", label: "Coder", activeStatus: "coding", id: "02" },
  { name: "Tester", label: "Tester", activeStatus: "testing", id: "03" },
  { name: "Reviewer", label: "Reviewer", activeStatus: "reviewing", id: "04" },
] as const;

export default function AgentPipeline({ status, currentAgent, completedSteps, isIdle }: Props) {
  const getState = (agent: typeof AGENTS[number]): "idle" | "active" | "done" => {
    if (completedSteps.includes(agent.name)) return "done";
    if (status === "done" && agent.name === "Reviewer") return "done";
    if (currentAgent === agent.name || status === agent.activeStatus) return "active";
    return "idle";
  };

  return (
    <div className="flex flex-col gap-4 relative ml-2">
      {AGENTS.map((agent, index) => {
        const state = isIdle ? "idle" : getState(agent);
        const isActive = state === "active";
        const isDone = state === "done";

        return (
          <div key={agent.name} className="flex gap-4 relative pb-4">
            {/* Connecting Line */}
            {index !== AGENTS.length - 1 && (
              <div 
                className={`absolute left-[11px] top-[24px] bottom-0 w-[2px] ${isDone ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--border))]"}`}
              />
            )}
            
            {/* Step Indicator */}
            <div className="z-10 flex items-center justify-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isActive ? "border-[hsl(var(--primary))] bg-[hsl(var(--background))]" : isDone ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]" : "border-[hsl(var(--border))] bg-[hsl(var(--background))]"}`}>
                {isDone ? (
                  <svg className="w-3.5 h-3.5 text-[hsl(var(--primary-foreground))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : isActive ? (
                  <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] animate-pulse" />
                ) : null}
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1 -mt-0.5">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isActive || isDone ? "text-[hsl(var(--foreground))]" : "text-[hsl(var(--muted-foreground))]"}`}>
                  {agent.label}
                </span>
                <span className={`shadcn-badge ${isActive ? "shadcn-badge-active" : ""}`}>
                  {state.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {isActive ? "Processing current step..." : isDone ? "Completed successfully." : "Waiting in queue."}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
