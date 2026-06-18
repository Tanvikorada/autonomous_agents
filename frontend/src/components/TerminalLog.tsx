import { JobStatusResponse } from "@/lib/api";
import { useEffect, useRef, useState } from "react";

interface Props {
  statusData: JobStatusResponse | null;
}

interface LogEntry {
  id: number;
  timestamp: string;
  agent: string;
  message: string;
  type: "info" | "warn" | "success";
}

export default function TerminalLog({ statusData }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Simulated log generation based on state changes
  useEffect(() => {
    if (!statusData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLogs([]);
      return;
    }

    const now = new Date().toISOString().split("T")[1].slice(0, -1); // HH:MM:SS.mmm
    
    setLogs(prev => {
      const newLogs = [...prev];
      
      // If we just started
      if (prev.length === 0 && statusData.status !== "pending") {
        newLogs.push({ id: Date.now(), timestamp: now, agent: "SYSTEM", message: "Swarm matrix initialized.", type: "info" });
      }

      // Check for newly completed steps
      const lastCompletedCount = prev.filter(l => l.message.includes("completed")).length;
      if (statusData.completed_steps.length > lastCompletedCount) {
        const newlyCompleted = statusData.completed_steps[statusData.completed_steps.length - 1];
        newLogs.push({ 
          id: Date.now() + 1, 
          timestamp: now, 
          agent: newlyCompleted, 
          message: `Process completed successfully.`, 
          type: "success" 
        });
      }

      // Check current active agent
      if (statusData.current_agent) {
        // Only log if the last log wasn't this agent starting
        const lastLog = prev[prev.length - 1];
        if (!lastLog || lastLog.agent !== statusData.current_agent || lastLog.message.includes("completed")) {
          newLogs.push({ 
            id: Date.now() + 2, 
            timestamp: now, 
            agent: statusData.current_agent, 
            message: `Allocating compute resources and beginning synthesis...`, 
            type: "info" 
          });
        }
      }

      if (statusData.status === "done") {
        newLogs.push({ id: Date.now() + 3, timestamp: now, agent: "SYSTEM", message: "All agent pipelines flushed. Job complete.", type: "success" });
      } else if (statusData.status === "error") {
        newLogs.push({ id: Date.now() + 3, timestamp: now, agent: "SYSTEM", message: `CRITICAL FAULT: ${statusData.error}`, type: "warn" });
      }

      return newLogs;
    });

  }, [statusData]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="cc-panel flex flex-col h-full overflow-hidden bg-[var(--color-steel-navy)]">
      <div className="flex items-center p-[12px] border-b border-[var(--border-dim)] bg-[var(--color-abyssal-blue)] gap-[8px]">
        <span className="text-[var(--color-warning-amber)]">ℹ</span>
        <span className="text-[12px] font-jetbrains-mono text-[var(--color-mist)] tracking-widest uppercase">System Telemetry</span>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-auto bg-[var(--color-cosmic-void)] p-[16px] font-jetbrains-mono text-[12px] leading-relaxed space-y-[8px]"
      >
        {logs.length === 0 ? (
          <div className="text-[var(--color-ash)] italic">Waiting for telemetry...</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-[12px]">
              <span className="text-[var(--color-ash)] shrink-0">[{log.timestamp}]</span>
              <span className={`shrink-0 font-normal uppercase w-16
                ${log.agent === "SYSTEM" ? "text-[var(--color-ash)]" : 
                  log.agent === "Planner" ? "text-[var(--color-portal-blue)]" : 
                  log.agent === "Coder" ? "text-[var(--color-ice-blue)]" : 
                  log.agent === "Tester" ? "text-[var(--color-terminal-amber)]" : "text-[var(--color-specimen-green)]"}`}
              >
                {log.agent}
              </span>
              <span className={`break-words
                ${log.type === "success" ? "text-[var(--color-specimen-green)]" : log.type === "warn" ? "text-[var(--color-fault-red)]" : "text-[var(--color-mist)]"}`}
              >
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
