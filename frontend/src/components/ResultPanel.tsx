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
      <div className="flex items-center p-[8px] border-b border-[var(--border-dim)] bg-[var(--color-abyssal-blue)] gap-[8px]">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const hasContent = !!tab.content;
          const isGenerating = isLoading && currentAgent?.toLowerCase().startsWith(tab.id.slice(0, 3)); // rough match
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "plan" | "code" | "tests" | "review")}
              className={`px-[16px] py-[8px] text-[12px] font-jetbrains-mono transition-all rounded-[4px] flex items-center gap-[8px]
                ${isActive 
                  ? "text-[var(--color-portal-blue)]" 
                  : "text-[var(--color-ash)] hover:text-[var(--color-mist)]"}`}
            >
              {tab.label}
              {isGenerating && <span className="flex h-1.5 w-1.5 rounded-full bg-[var(--color-portal-blue)] animate-ping ml-1" />}
              {hasContent && !isGenerating && <span className="flex h-1.5 w-1.5 rounded-full bg-[var(--color-steel-navy)] ml-1" />}
            </button>
          )
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-[var(--color-cosmic-void)] p-[24px] relative">
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
              <pre className="text-[var(--color-mist)] text-[13px] font-jetbrains-mono leading-relaxed whitespace-pre-wrap">
                <code>{activeContent}</code>
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--color-ash)] font-jetbrains-mono text-[14px] flex-col gap-[12px] opacity-50">
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
