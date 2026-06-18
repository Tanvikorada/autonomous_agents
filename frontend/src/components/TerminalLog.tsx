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
  type: "info" | "warn" | "success" | "system" | "agent_start" | "agent_complete";
}

export default function TerminalLog({ statusData }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (!statusData) {
      setLogs([
        { id: 1, type: "system", message: "System initializing...", timestamp: new Date().toISOString(), agent: "SYSTEM" },
        { id: 2, type: "system", message: "Awaiting problem statement in the console.", timestamp: new Date().toISOString(), agent: "SYSTEM" }
      ]);
      return;
    }

    const now = new Date().toISOString();
    
    setLogs(prev => {
      const newLogs = [...prev];
      
      // If we just started
      if (prev.length <= 2 && statusData.status !== "pending") {
        newLogs.push({ id: Date.now(), timestamp: now, agent: "SYSTEM", message: "Swarm matrix initialized.", type: "system" });
      }

      // Check for newly completed steps
      const lastCompletedCount = prev.filter(l => l.type === "agent_complete").length;
      if (statusData.completed_steps.length > lastCompletedCount) {
        const newlyCompleted = statusData.completed_steps[statusData.completed_steps.length - 1];
        newLogs.push({ 
          id: Date.now() + 1, 
          timestamp: now, 
          agent: newlyCompleted, 
          message: `Process completed successfully.`, 
          type: "agent_complete" 
        });
      }

      // Check current active agent
      if (statusData.current_agent) {
        const lastLog = prev[prev.length - 1];
        if (!lastLog || lastLog.agent !== statusData.current_agent || lastLog.type === "agent_complete") {
          newLogs.push({ 
            id: Date.now() + 2, 
            timestamp: now, 
            agent: statusData.current_agent, 
            message: `Allocating compute resources and beginning synthesis...`, 
            type: "agent_start" 
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

  return (
    <div className="cc-panel flex flex-col h-full overflow-hidden bg-[var(--color-pure-white)]">
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-[24px] pb-[16px] border-b border-[var(--color-surface-mist)]">
        <div className="flex items-center gap-[8px]">
          <span className="text-[12px] font-suisseintlmono font-bold tracking-widest uppercase text-[var(--color-ink-black)]">
            Telemetry
          </span>
        </div>
        <div className="flex items-center gap-[6px]">
          {!["pending", "done", "error"].includes(statusData?.status ?? "pending") ? (
            <span className="w-[8px] h-[8px] bg-[var(--color-mint-pulse)] rounded-full animate-pulse" />
          ) : (
            <span className="w-[8px] h-[8px] bg-[var(--color-surface-mist)] rounded-full" />
          )}
        </div>
      </div>

      {/* Terminal Output */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-[24px] font-suisseintlmono text-[12px] leading-[1.6] tracking-[-0.36px] space-y-[12px]"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex gap-[16px] group">
            {/* Timestamp */}
            <div className="text-[var(--color-steel-gray)] shrink-0 select-none">
              {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
            </div>
            
            {/* Message Body */}
            <div className="flex-1 text-[var(--color-ink-black)] break-words">
              {log.type === "agent_start" && (
                <span className="bg-[var(--color-electric-yellow)] text-[var(--color-ink-black)] px-[4px] font-bold mr-2 uppercase">
                  {log.agent}
                </span>
              )}
              {log.type === "agent_complete" && (
                <span className="bg-[var(--color-mint-pulse)] text-[var(--color-ink-black)] px-[4px] font-bold mr-2 uppercase">
                  OK
                </span>
              )}
              <span className={(log.type === "system" || log.type === "info") ? "text-[var(--color-steel-gray)]" : ""}>
                {log.message}
              </span>
            </div>
          </div>
        ))}
        
        {/* Blinking Cursor */}
        {!["pending", "done", "error"].includes(statusData?.status ?? "pending") && (
          <div className="flex gap-[16px]">
            <div className="text-[var(--color-surface-mist)] shrink-0">--:--:--</div>
            <div className="cursor-blink"></div>
          </div>
        )}
      </div>
    </div>
  );
}
