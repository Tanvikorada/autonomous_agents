import { JobStatus } from "@/lib/api";
import { motion } from "framer-motion";

interface Props {
  status: JobStatus | "pending";
  currentAgent: string | null;
  completedSteps: string[];
  isIdle?: boolean;
}

const AGENTS = [
  { name: "Planner", label: "Architecture Planner", activeStatus: "planning" },
  { name: "Coder", label: "Software Engineer", activeStatus: "coding" },
  { name: "Tester", label: "QA Automation", activeStatus: "testing" },
  { name: "Reviewer", label: "Security Auditor", activeStatus: "reviewing" },
] as const;

export default function AgentPipeline({ status, currentAgent, completedSteps, isIdle }: Props) {
  const getState = (agent: typeof AGENTS[number]): "idle" | "active" | "done" => {
    if (completedSteps.includes(agent.name)) return "done";
    if (status === "done" && agent.name === "Reviewer") return "done";
    if (currentAgent === agent.name || status === agent.activeStatus) return "active";
    return "idle";
  };

  return (
    <div className="flex flex-col gap-0 relative ml-2">
      {/* Background track line */}
      <div className="absolute left-[7px] top-[10px] bottom-[10px] w-[1px] bg-[#222]" />

      {AGENTS.map((agent, index) => {
        const state = isIdle ? "idle" : getState(agent);
        const isActive = state === "active";
        const isDone = state === "done";

        return (
          <div key={agent.name} className="flex gap-6 relative py-4">
            
            {/* Timeline Dot */}
            <div className="relative z-10 flex flex-col items-center justify-start mt-1">
              <div 
                className={`w-[15px] h-[15px] rounded-full transition-colors duration-300
                  ${isActive ? "bg-white ring-4 ring-white/10" 
                  : isDone ? "bg-[#555]" 
                  : "bg-[#111] border border-[#333]"}`}
              />
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center gap-3">
                <span className={`text-[15px] font-medium tracking-tight ${isActive ? "text-white" : isDone ? "text-[#888]" : "text-[#444]"}`}>
                  {agent.label}
                </span>
                {isActive && (
                  <span className="text-[10px] uppercase tracking-wider font-mono text-[#888] bg-[#111] px-2 py-0.5 rounded-sm">
                    In Progress
                  </span>
                )}
              </div>
              <p className="text-[13px] text-[#555] font-light">
                {isActive ? "Synthesizing code architecture..." : isDone ? "Task completed." : "Waiting..."}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
