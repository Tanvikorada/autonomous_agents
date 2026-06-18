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
    <div className="cc-panel flex flex-col h-full overflow-hidden">
      <div className="flex items-center p-3 border-b border-[var(--border-dim)] bg-[#0A0A0F]/50 gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#64748B]"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>
        <span className="text-xs font-mono text-[#94A3B8] tracking-widest uppercase">System Telemetry</span>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-auto bg-[#050505] p-4 font-mono text-[11px] leading-relaxed space-y-2"
      >
        {logs.length === 0 ? (
          <div className="text-[#475569] italic">Waiting for telemetry...</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-3">
              <span className="text-[#475569] shrink-0">[{log.timestamp}]</span>
              <span className={`shrink-0 font-bold uppercase w-16
                ${log.agent === "SYSTEM" ? "text-[#94A3B8]" : 
                  log.agent === "Planner" ? "text-[#7C3AED]" : 
                  log.agent === "Coder" ? "text-[#3B82F6]" : 
                  log.agent === "Tester" ? "text-[#EAB308]" : "text-[#10B981]"}`}
              >
                {log.agent}
              </span>
              <span className={`break-words
                ${log.type === "success" ? "text-[#06B6D4]" : log.type === "warn" ? "text-[#EF4444]" : "text-[#CBD5E1]"}`}
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
