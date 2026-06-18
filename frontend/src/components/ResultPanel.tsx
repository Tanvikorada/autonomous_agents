import { PipelineResult } from "@/lib/api";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  result: PipelineResult | null;
  isLoading: boolean;
  currentAgent?: string | null;
}

export default function ResultPanel({ result, isLoading, currentAgent }: Props) {
  const [activeTab, setActiveTab] = useState<"plan" | "code" | "tests" | "review">("plan");

  const tabs = [
    { id: "plan", label: "01_PLAN.md", content: result?.plan },
    { id: "code", label: "02_CODE.py", content: result?.code },
    { id: "tests", label: "03_TESTS.py", content: result?.tests },
    { id: "review", label: "04_AUDIT.log", content: result?.review },
  ] as const;

  const activeContent = tabs.find(t => t.id === activeTab)?.content;

  // Auto-switch tabs based on current agent if loading
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (isLoading && currentAgent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (currentAgent === "Planner") setActiveTab("plan");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (currentAgent === "Coder") setActiveTab("code");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (currentAgent === "Tester") setActiveTab("tests");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (currentAgent === "Reviewer") setActiveTab("review");
    }
  }, [currentAgent, isLoading]);

  return (
    <div className="cc-panel flex flex-col h-full overflow-hidden relative">
      
      {/* Header Tabs */}
      <div className="flex items-center p-2 border-b border-[var(--border-dim)] bg-[#0A0A0F]/50 gap-2">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const hasContent = !!tab.content;
          const isGenerating = isLoading && currentAgent?.toLowerCase().startsWith(tab.id.slice(0, 3)); // rough match
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "plan" | "code" | "tests" | "review")}
              className={`px-4 py-2 text-xs font-mono transition-all rounded flex items-center gap-2
                ${isActive 
                  ? "bg-[#1E1B4B] text-[#A78BFA] border border-[#7C3AED]/30" 
                  : "text-[#64748B] hover:text-[#94A3B8] hover:bg-[#1E293B]/50 border border-transparent"}`}
            >
              {tab.label}
              {isGenerating && <span className="flex h-1.5 w-1.5 rounded-full bg-[#06B6D4] animate-ping ml-1" />}
              {hasContent && !isGenerating && <span className="flex h-1.5 w-1.5 rounded-full bg-[#7C3AED] ml-1" />}
            </button>
          )
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-[#050505] p-6 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeContent ? (
              <pre className="text-[#E2E8F0] text-[13px] font-mono leading-relaxed whitespace-pre-wrap">
                <code>{activeContent}</code>
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-[#475569] font-mono text-sm flex-col gap-3 opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>
                <p>Awaiting stream buffer...</p>
              </div>
            )}
            
            {/* Blinking Cursor if actively generating this tab */}
            {isLoading && currentAgent?.toLowerCase().includes(activeTab.slice(0, 3)) && (
              <span className="cursor-blink ml-1"></span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
