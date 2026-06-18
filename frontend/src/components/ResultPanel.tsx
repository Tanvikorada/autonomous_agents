import { useState, useEffect } from "react";
import { PipelineResult } from "@/lib/api";

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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-20)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-mist)", paddingBottom: "var(--spacing-14)" }}>
        <h2 className="editorial-accent" style={{ color: "var(--color-bone-white)", fontSize: "24px" }}>System Output</h2>
        <div className="tag-chip" style={{ backgroundColor: "var(--color-obsidian-surface)" }}>
          job: {result.job_id.substring(0, 8)}...
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: "flex", gap: "var(--spacing-14)", overflowX: "auto", borderBottom: "1px solid var(--color-mist)", paddingBottom: "var(--spacing-14)" }}>
        {result.plan && (
          <button
            onClick={() => setActiveTab("plan")}
            className={activeTab === "plan" ? "active-tab-pill" : "inactive-tab-btn"}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>menu_book</span>
            Strategy
          </button>
        )}
        {result.code && (
          <button
            onClick={() => setActiveTab("code")}
            className={activeTab === "code" ? "active-tab-pill" : "inactive-tab-btn"}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>code</span>
            Source Code
          </button>
        )}
        {result.tests && (
          <button
            onClick={() => setActiveTab("tests")}
            className={activeTab === "tests" ? "active-tab-pill" : "inactive-tab-btn"}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified</span>
            Validation
          </button>
        )}
        {result.review && (
          <button
            onClick={() => setActiveTab("review")}
            className={activeTab === "review" ? "active-tab-pill" : "inactive-tab-btn"}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>shield</span>
            Audit
          </button>
        )}
      </div>

      {/* Tab Contents */}
      <div style={{ marginTop: "var(--spacing-10)" }}>
        {activeTab === "plan" && result.plan && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-20)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-10)" }}>
              <span className="tag-chip" style={{ backgroundColor: "var(--color-voltage-yellow)", color: "var(--color-obsidian-surface)" }}>/plan</span>
              <h3 style={{ fontFamily: "var(--font-canvasans)", fontSize: "16px", fontWeight: 700, color: "var(--color-bone-white)", margin: 0 }}>Execution Strategy</h3>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-14)" }}>
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
                  <p className="body-text" style={{ color: "var(--color-ash-text)", margin: 0 }}>
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === "code" || activeTab === "tests") && currentCode && (
          <div style={{ display: "flex", flexDirection: "column", borderRadius: "var(--radius-cards)", overflow: "hidden", border: "1px solid var(--color-mist)" }}>
            {/* Terminal Window Chrome */}
            <div style={{ 
              backgroundColor: "var(--color-obsidian-surface)", 
              padding: "var(--spacing-14) var(--spacing-20)", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              borderBottom: "1px solid var(--color-mist)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-10)" }}>
                {/* Simulated mac dots */}
                <div style={{ display: "flex", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "var(--color-ember-coral)" }}></div>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "var(--color-voltage-yellow)" }}></div>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "var(--color-toxic-lime)" }}></div>
                </div>
                <span style={{ marginLeft: "var(--spacing-10)", fontFamily: "var(--font-canvasans)", fontSize: "14px", color: "var(--color-ash-text)" }}>{currentFileName}</span>
              </div>
              <button 
                onClick={() => handleCopy(currentCode)}
                className="ghost-cta"
                style={{ padding: "6px 14px", fontSize: "12px", borderRadius: "var(--radius-buttons)" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  {copied ? "check" : "content_copy"}
                </span>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            {/* Code Body */}
            <pre style={{ 
              backgroundColor: "var(--color-midnight-canvas)", 
              padding: "var(--spacing-20)", 
              margin: 0, 
              overflowX: "auto", 
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace", 
              fontSize: "13px",
              lineHeight: 1.5,
              color: "var(--color-arc-blue)" 
            }}>
              <code>{currentCode}</code>
            </pre>
          </div>
        )}

        {activeTab === "review" && result.review && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-20)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-10)" }}>
              <span className="tag-chip" style={{ backgroundColor: "var(--color-toxic-lime)", color: "var(--color-obsidian-surface)" }}>/audit</span>
              <h3 style={{ fontFamily: "var(--font-canvasans)", fontSize: "16px", fontWeight: 700, color: "var(--color-bone-white)", margin: 0 }}>Security & Code Quality Review</h3>
            </div>
            
            <div style={{ 
              backgroundColor: "var(--color-obsidian-surface)", 
              border: "1px solid var(--color-mist)", 
              borderRadius: "var(--radius-cards)",
              padding: "var(--spacing-20)",
              display: "flex",
              gap: "var(--spacing-16)",
              alignItems: "flex-start"
            }}>
              <span className="material-symbols-outlined" style={{ color: "var(--color-toxic-lime)", fontSize: 24, flexShrink: 0 }}>
                gavel
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-10)" }}>
                <div style={{ fontFamily: "var(--font-canvasans)", fontSize: "16px", fontWeight: 700, color: "var(--color-bone-white)" }}>
                  Audited System Report
                </div>
                <p className="body-text" style={{ margin: 0 }}>
                  {result.review}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
