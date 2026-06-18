import { useState, useEffect } from "react";
import { PipelineResult } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  result: PipelineResult;
}

type TabType = "plan" | "code" | "tests" | "review";

export default function ResultPanel({ result }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("plan");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (result.plan && result.plan.length > 0) {
      setActiveTab("plan");
    } else if (result.code) {
      setActiveTab("code");
    } else if (result.tests) {
      setActiveTab("tests");
    } else if (result.review) {
      setActiveTab("review");
    }
  }, [result]);

  const handleCopy = async (text: string | null) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const currentCode = activeTab === "code" ? result.code : result.tests;
  const currentFileName = activeTab === "code" ? "main.py" : "test_main.py";

  return (
    <div className="glass-panel overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/20 text-purple-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
          </div>
          <h2 className="font-semibold text-sm tracking-wide text-white/90">Execution Output</h2>
          <span className="glass-badge ml-2 font-mono">{result.job_id.substring(0, 8)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-black/20">
        {result.plan && (
          <button
            onClick={() => setActiveTab("plan")}
            className={`relative px-6 py-3 text-sm font-medium transition-colors ${activeTab === "plan" ? "text-purple-400" : "text-white/40 hover:text-white/80"}`}
          >
            Strategy
            {activeTab === "plan" && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            )}
          </button>
        )}
        {result.code && (
          <button
            onClick={() => setActiveTab("code")}
            className={`relative px-6 py-3 text-sm font-medium transition-colors ${activeTab === "code" ? "text-purple-400" : "text-white/40 hover:text-white/80"}`}
          >
            Source Code
            {activeTab === "code" && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            )}
          </button>
        )}
        {result.tests && (
          <button
            onClick={() => setActiveTab("tests")}
            className={`relative px-6 py-3 text-sm font-medium transition-colors ${activeTab === "tests" ? "text-purple-400" : "text-white/40 hover:text-white/80"}`}
          >
            Validation
            {activeTab === "tests" && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            )}
          </button>
        )}
        {result.review && (
          <button
            onClick={() => setActiveTab("review")}
            className={`relative px-6 py-3 text-sm font-medium transition-colors ${activeTab === "review" ? "text-purple-400" : "text-white/40 hover:text-white/80"}`}
          >
            Security Audit
            {activeTab === "review" && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            )}
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="bg-black/20 relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === "plan" && result.plan && (
            <motion.div 
              key="plan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 space-y-6"
            >
              {result.plan.map((step, i) => (
                <div key={i} className="flex gap-5 items-start group">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/70 group-hover:bg-purple-500/20 group-hover:text-purple-400 group-hover:border-purple-500/30 transition-colors">
                    {i + 1}
                  </div>
                  <p className="text-[15px] pt-0.5 leading-relaxed text-white/80">
                    {step}
                  </p>
                </div>
              ))}
            </motion.div>
          )}

          {(activeTab === "code" || activeTab === "tests") && currentCode && (
            <motion.div 
              key="code"
              initial={{ opacity: 0, opacity: 1 }} // Note: keeping code static to avoid layout jumps
              className="flex flex-col h-full"
            >
              <div className="flex items-center justify-between px-4 py-2.5 bg-black/40 border-b border-white/5">
                <span className="text-xs font-mono text-white/50">{currentFileName}</span>
                <button 
                  onClick={() => handleCopy(currentCode)}
                  className="rounded px-3 py-1 text-xs font-medium border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition-colors"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="p-6 overflow-x-auto bg-[#0a0a0c] text-purple-100/80 text-[13px] font-mono m-0 leading-relaxed">
                <code>{currentCode}</code>
              </pre>
            </motion.div>
          )}

          {activeTab === "review" && result.review && (
            <motion.div 
              key="review"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8"
            >
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h3 className="font-semibold text-sm text-purple-100">Audit Complete</h3>
                </div>
                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                  {result.review}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
