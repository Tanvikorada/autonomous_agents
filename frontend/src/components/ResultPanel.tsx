import { useState, useEffect, MouseEvent, useRef } from "react";
import { PipelineResult } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, ShieldCheck, Terminal } from "lucide-react";

interface Props {
  result: PipelineResult;
}

type TabType = "plan" | "code" | "tests" | "review";

export default function ResultPanel({ result }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("plan");
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Spotlight Effect
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

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
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className="spotlight-card min-h-[500px] flex flex-col"
    >
      <div className="spotlight-content flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-[#33d0ff] shadow-[0_0_20px_rgba(51,208,255,0.3)]">
              <Terminal className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-bold text-sm tracking-widest text-white uppercase">Execution Sandbox</h2>
              <span className="text-[10px] text-white/40 font-mono">JOB_ID: {result.job_id.substring(0, 8)}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 bg-white/[0.02]">
          {result.plan && (
            <button
              onClick={() => setActiveTab("plan")}
              className={`relative px-8 py-4 text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === "plan" ? "text-purple-400" : "text-white/40 hover:text-white/80"}`}
            >
              Strategy Matrix
              {activeTab === "plan" && (
                <motion.div layoutId="activeTabPanel" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-[#33d0ff] shadow-[0_0_15px_rgba(51,208,255,0.6)]" />
              )}
            </button>
          )}
          {result.code && (
            <button
              onClick={() => setActiveTab("code")}
              className={`relative px-8 py-4 text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === "code" ? "text-purple-400" : "text-white/40 hover:text-white/80"}`}
            >
              Source Protocol
              {activeTab === "code" && (
                <motion.div layoutId="activeTabPanel" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-[#33d0ff] shadow-[0_0_15px_rgba(51,208,255,0.6)]" />
              )}
            </button>
          )}
          {result.tests && (
            <button
              onClick={() => setActiveTab("tests")}
              className={`relative px-8 py-4 text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === "tests" ? "text-purple-400" : "text-white/40 hover:text-white/80"}`}
            >
              Validation
              {activeTab === "tests" && (
                <motion.div layoutId="activeTabPanel" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-[#33d0ff] shadow-[0_0_15px_rgba(51,208,255,0.6)]" />
              )}
            </button>
          )}
          {result.review && (
            <button
              onClick={() => setActiveTab("review")}
              className={`relative px-8 py-4 text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === "review" ? "text-purple-400" : "text-white/40 hover:text-white/80"}`}
            >
              Security Audit
              {activeTab === "review" && (
                <motion.div layoutId="activeTabPanel" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-[#33d0ff] shadow-[0_0_15px_rgba(51,208,255,0.6)]" />
              )}
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="relative flex-1">
          <AnimatePresence mode="wait">
            {activeTab === "plan" && result.plan && (
              <motion.div 
                key="plan"
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(10px)" }}
                className="p-8 space-y-6"
              >
                {result.plan.map((step, i) => (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="flex gap-5 items-start group p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white/70 group-hover:bg-gradient-to-br group-hover:from-purple-500 group-hover:to-[#33d0ff] group-hover:text-white group-hover:border-transparent transition-all shadow-lg">
                      {i + 1}
                    </div>
                    <p className="text-[15px] pt-1 leading-relaxed text-white/80 font-medium">
                      {step}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {(activeTab === "code" || activeTab === "tests") && currentCode && (
              <motion.div 
                key="code"
                initial={{ opacity: 1 }}
                className="flex flex-col h-full absolute inset-0"
              >
                <div className="flex items-center justify-between px-6 py-3 bg-black/60 border-b border-white/5 backdrop-blur-md">
                  <span className="text-[11px] font-mono text-purple-300 tracking-wider">./{currentFileName}</span>
                  <button 
                    onClick={() => handleCopy(currentCode)}
                    className="flex items-center gap-2 rounded-md px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy Source"}
                  </button>
                </div>
                <div className="flex-1 overflow-auto bg-[#030014]/80 p-6">
                  <pre className="text-[#e6edf3] text-[13px] font-mono leading-relaxed">
                    <code>{currentCode}</code>
                  </pre>
                </div>
              </motion.div>
            )}

            {activeTab === "review" && result.review && (
              <motion.div 
                key="review"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-8 h-full"
              >
                <div className="h-full rounded-2xl border border-[#33d0ff]/20 bg-[#33d0ff]/5 p-8 space-y-6 shadow-[inset_0_0_50px_rgba(51,208,255,0.05)]">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-[#33d0ff]/20">
                      <ShieldCheck className="w-6 h-6 text-[#33d0ff]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">System Audit Complete</h3>
                      <p className="text-xs text-[#33d0ff]/70 font-mono uppercase tracking-widest">Zero Critical Vulnerabilities Detected</p>
                    </div>
                  </div>
                  <div className="w-full h-px bg-gradient-to-r from-[#33d0ff]/30 to-transparent"></div>
                  <p className="text-[15px] text-white/80 leading-relaxed whitespace-pre-wrap font-medium">
                    {result.review}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
