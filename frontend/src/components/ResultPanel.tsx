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

  // Set first available tab as active when result changes
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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-20)", width: "100%" }}>
      {/* Tabs Menu */}
      <div style={{ display: "flex", gap: "var(--spacing-14)", overflowX: "auto", justifyContent: "center", paddingBottom: "var(--spacing-10)" }}>
        {result.plan && (
          <button
            onClick={() => setActiveTab("plan")}
            className={activeTab === "plan" ? "active-tab-pill" : "inactive-tab-btn"}
          >
            Strategy
          </button>
        )}
        {result.code && (
          <button
            onClick={() => setActiveTab("code")}
            className={activeTab === "code" ? "active-tab-pill" : "inactive-tab-btn"}
          >
            Source Code
          </button>
        )}
        {result.tests && (
          <button
            onClick={() => setActiveTab("tests")}
            className={activeTab === "tests" ? "active-tab-pill" : "inactive-tab-btn"}
          >
            Validation
          </button>
        )}
        {result.review && (
          <button
            onClick={() => setActiveTab("review")}
            className={activeTab === "review" ? "active-tab-pill" : "inactive-tab-btn"}
          >
            Audit
          </button>
        )}
      </div>

      {/* Main Card (8.4px radius, Charcoal #353535) */}
      <div className="charcoal-card" style={{ padding: 0, overflow: "hidden", minHeight: "400px" }}>
        
        {/* Header Strip inside Card */}
        <div style={{ 
          backgroundColor: "rgba(0,0,0,0.2)", 
          padding: "var(--spacing-14) var(--spacing-20)", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          borderBottom: "1px solid var(--color-mist)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-10)" }}>
            <span className="tag-chip" style={{ backgroundColor: "var(--color-obsidian-surface)", color: "var(--color-ash-text)" }}>
              {activeTab.toUpperCase()}
            </span>
            <span style={{ fontFamily: "var(--font-canvasans)", fontSize: "14px", color: "var(--color-ash-text)" }}>
              {activeTab === "code" || activeTab === "tests" ? currentFileName : `job: ${result.job_id.substring(0, 8)}`}
            </span>
          </div>
          {(activeTab === "code" || activeTab === "tests") && currentCode && (
            <button 
              onClick={() => handleCopy(currentCode)}
              className="ghost-cta"
              style={{ padding: "6px 14px", fontSize: "12px", borderRadius: "var(--radius-buttons)" }}
            >
              {copied ? "Copied!" : "Copy Code"}
            </button>
          )}
        </div>

        {/* Tab Contents */}
        <div style={{ padding: "var(--spacing-27)" }}>
          <AnimatePresence mode="wait">
            {activeTab === "plan" && result.plan && (
              <motion.div 
                key="plan"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-14)" }}
              >
                {result.plan.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: "var(--spacing-14)", alignItems: "flex-start" }}>
                    <div style={{ 
                      fontFamily: "var(--font-canvasans)", 
                      fontSize: "12px", 
                      fontWeight: 700, 
                      color: "var(--color-obsidian-surface)", 
                      backgroundColor: "var(--color-voltage-yellow)", 
                      borderRadius: "50%", 
                      width: "24px", 
                      height: "24px", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      {i + 1}
                    </div>
                    <p className="body-text" style={{ color: "var(--color-bone-white)", margin: 0, fontSize: "16px" }}>
                      {step}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}

            {(activeTab === "code" || activeTab === "tests") && currentCode && (
              <motion.div 
                key="code"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <pre style={{ 
                  margin: 0, 
                  overflowX: "auto", 
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace", 
                  fontSize: "14px",
                  lineHeight: 1.6,
                  color: "var(--color-bone-white)" 
                }}>
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
                transition={{ duration: 0.3 }}
                style={{ display: "flex", gap: "var(--spacing-16)", alignItems: "flex-start" }}
              >
                <span className="material-symbols-outlined" style={{ color: "var(--color-toxic-lime)", fontSize: 24, flexShrink: 0 }}>
                  gavel
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-10)" }}>
                  <p className="body-text" style={{ margin: 0, fontSize: "16px", color: "var(--color-bone-white)" }}>
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
