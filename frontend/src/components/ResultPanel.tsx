import { PipelineResult } from "@/lib/api";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  result: PipelineResult;
}

export default function ResultPanel({ result }: Props) {
  const [activeTab, setActiveTab] = useState<"plan" | "code" | "tests" | "review">("plan");

  const tabs = [
    { id: "plan", label: "Architecture Plan", content: result.plan },
    { id: "code", label: "Source Code", content: result.code },
    { id: "tests", label: "Test Suite", content: result.tests },
    { id: "review", label: "Security Audit", content: result.review },
  ] as const;

  const activeContent = tabs.find(t => t.id === activeTab)?.content || "";

  return (
    <div className="panel flex flex-col h-[600px] overflow-hidden">
      
      {/* Header Tabs */}
      <div className="flex items-center gap-1 p-2 border-b border-[#1a1a1a] bg-[#050505]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-sm
              ${activeTab === tab.id 
                ? "bg-[#111] text-white" 
                : "text-[#666] hover:text-[#aaa] hover:bg-[#111]/50"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-[#000] p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <pre className="text-[#ccc] text-[13px] font-mono leading-relaxed whitespace-pre-wrap">
              <code>{activeContent}</code>
            </pre>
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
