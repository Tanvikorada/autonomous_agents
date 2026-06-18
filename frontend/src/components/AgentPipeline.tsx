import { JobStatus } from "@/lib/api";
import { motion } from "framer-motion";

interface Props {
  status: JobStatus | "pending";
  currentAgent: string | null;
  completedSteps: string[];
}

const AGENTS = [
  { 
    name: "Planner", 
    label: "Planner", 
    activeStatus: "planning",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-5.224 4.668A4 4 0 0 0 5.88 18H12"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 5.224 4.668A4 4 0 0 1 18.12 18H12"/><path d="M12 20a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Z"/></svg>
    )
  },
  { 
    name: "Coder", 
    label: "Coder", 
    activeStatus: "coding",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
    )
  },
  { 
    name: "Tester", 
    label: "Tester", 
    activeStatus: "testing",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/></svg>
    )
  },
  { 
    name: "Reviewer", 
    label: "Reviewer", 
    activeStatus: "reviewing",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
    )
  },
] as const;

export default function AgentPipeline({ status, currentAgent, completedSteps }: Props) {
  const getState = (agent: typeof AGENTS[number]): "idle" | "active" | "done" => {
    if (completedSteps.includes(agent.name)) return "done";
    if (status === "done" && agent.name === "Reviewer") return "done";
    if (currentAgent === agent.name || status === agent.activeStatus) return "active";
    return "idle";
  };

  return (
    <div className="w-full py-[32px] overflow-x-auto overflow-y-hidden scrollbar-hide">
      <div className="flex items-center justify-between min-w-[600px] px-[16px]">
        {AGENTS.map((agent, index) => {
          const state = getState(agent);
          const isActive = state === "active";
          const isDone = state === "done";

          return (
            <div key={agent.name} className="flex items-center flex-1 last:flex-none">
              
              {/* Node */}
              <motion.div 
                className="relative flex flex-col items-center gap-[16px] z-10"
                animate={{
                  scale: isActive ? 1.05 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Square Shape container */}
                <div 
                  className={`w-[64px] h-[64px] rounded-[16px] flex items-center justify-center transition-all duration-500
                    ${isActive ? "bg-[var(--color-mint-pulse)] text-[var(--color-ink-black)]" 
                    : isDone ? "bg-[var(--color-ink-black)] text-[var(--color-pure-white)]" 
                    : "bg-[var(--color-surface-mist)] text-[var(--color-steel-gray)]"}`}
                >
                  {isDone ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  ) : (
                    agent.icon
                  )}
                </div>

                {/* Label */}
                <div className="absolute top-[80px] whitespace-nowrap text-center">
                  <span className={`text-[12px] font-suisseintlmono uppercase tracking-wide transition-colors
                    ${isActive ? "text-[var(--color-ink-black)] font-bold" : isDone ? "text-[var(--color-ink-black)]" : "text-[var(--color-steel-gray)]"}`}>
                    {agent.label}
                  </span>
                </div>
              </motion.div>

              {/* Connecting Line (except for last item) */}
              {index !== AGENTS.length - 1 && (
                <div className="flex-1 mx-[16px] h-[2px] bg-[var(--color-surface-mist)] relative overflow-hidden">
                  {(isDone || isActive) && (
                    <motion.div
                      className={`absolute top-0 bottom-0 left-0 w-full ${isDone ? "bg-[var(--color-ink-black)]" : "bg-[var(--color-mint-pulse)]"}`}
                      initial={isActive ? { x: "-100%" } : { x: 0 }}
                      animate={isActive ? { x: "100%" } : { x: 0 }}
                      transition={isActive ? { duration: 1.5, repeat: Infinity, ease: "linear" } : {}}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
