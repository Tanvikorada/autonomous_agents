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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-fog)", pb: 4 }}>
        <h2 className="serif-headline" style={{ fontSize: "24px" }}>System Output</h2>
        <div className="mono-badge">job: {result.job_id.substring(0, 8)}...</div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", borderBottom: "1px solid var(--color-fog)", paddingBottom: "1px" }}>
        {result.plan && (
          <button
            onClick={() => setActiveTab("plan")}
            className={`result-tab-btn ${activeTab === "plan" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>menu_book</span>
            Strategy
          </button>
        )}
        {result.code && (
          <button
            onClick={() => setActiveTab("code")}
            className={`result-tab-btn ${activeTab === "code" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>code</span>
            Source Code
          </button>
        )}
        {result.tests && (
          <button
            onClick={() => setActiveTab("tests")}
            className={`result-tab-btn ${activeTab === "tests" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified</span>
            Validation
          </button>
        )}
        {result.review && (
          <button
            onClick={() => setActiveTab("review")}
            className={`result-tab-btn ${activeTab === "review" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>shield</span>
            Audit
          </button>
        )}
      </div>

      {/* Tab Contents */}
      <div style={{ marginTop: "8px" }}>
        {activeTab === "plan" && result.plan && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="mono-badge">/plan</span>
              <h3 style={{ fontFamily: "var(--font-pplxsans)", fontSize: "15px", fontWeight: 600, color: "var(--color-teal-accent)" }}>Execution Strategy</h3>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {result.plan.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ 
                    fontFamily: "var(--font-pplxsansmono)", 
                    fontSize: "11px", 
                    fontWeight: 600, 
                    color: "var(--color-teal-accent)", 
                    backgroundColor: "rgba(59, 241, 224, 0.15)", 
                    borderRadius: "50%", 
                    width: "20px", 
                    height: "20px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2
                  }}>
                    {i + 1}
                  </div>
                  <p className="body-stack" style={{ margin: 0, fontSize: "14px", color: "var(--color-aged-sepia)" }}>
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === "code" || activeTab === "tests") && currentCode && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Terminal Window Chrome */}
            <div className="code-console-header">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {/* Simulated mac dots */}
                <div style={{ display: "flex", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#e26c5c" }}></div>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#f3cc63" }}></div>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#6fc961" }}></div>
                </div>
                <span style={{ marginLeft: 6, opacity: 0.8 }}>{currentFileName}</span>
              </div>
              <button 
                onClick={() => handleCopy(currentCode)}
                style={{ 
                  background: "transparent", 
                  border: "none", 
                  color: "var(--color-moss-shadow)", 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 4,
                  fontSize: "11px",
                  fontWeight: 500,
                  fontFamily: "var(--font-pplxsans)"
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  {copied ? "check" : "content_copy"}
                </span>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            {/* Code Body */}
            <pre className="code-console-body">
              <code>{currentCode}</code>
            </pre>
          </div>
        )}

        {activeTab === "review" && result.review && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="mono-badge">/audit</span>
              <h3 style={{ fontFamily: "var(--font-pplxsans)", fontSize: "15px", fontWeight: 600, color: "var(--color-teal-accent)" }}>Security & Code Quality Review</h3>
            </div>
            
            <div style={{ 
              backgroundColor: "rgba(59, 241, 224, 0.05)", 
              border: "1px solid rgba(59, 241, 224, 0.15)", 
              borderRadius: "var(--radius-other)",
              padding: "16px",
              display: "flex",
              gap: 16,
              alignItems: "flex-start"
            }}>
              <span className="material-symbols-outlined" style={{ color: "var(--color-teal-accent)", fontSize: 24, flexShrink: 0 }}>
                gavel
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontFamily: "var(--font-pplxsans)", fontSize: "14px", fontWeight: 600, color: "var(--color-aged-sepia)" }}>
                  Audited System Report
                </div>
                <p className="body-stack" style={{ margin: 0, fontSize: "13.5px", lineHeight: "1.6", color: "var(--color-aged-sepia)" }}>
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
