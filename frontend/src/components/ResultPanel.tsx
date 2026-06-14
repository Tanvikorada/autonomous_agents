"use client";

import { useState } from "react";
import { PipelineResult } from "@/lib/api";

interface Props {
  result: PipelineResult;
}

export default function ResultPanel({ result }: Props) {
  const [activeTab, setActiveTab] = useState<"plan" | "code" | "tests" | "review">("plan");

  const tabs = [
    { id: "plan", label: "Planner Log", content: result.plan },
    { id: "code", label: "Synthesized Code", content: result.code },
    { id: "tests", label: "Test Suites", content: result.tests },
    { id: "review", label: "Audit Report", content: result.review },
  ] as const;

  return (
    <div className="glass-panel" style={{ overflow: "hidden" }}>
      {/* Header Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--glass-border)", background: "rgba(0,0,0,0.2)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: 1, padding: "20px 0", background: "transparent", border: "none",
              borderBottom: `2px solid ${activeTab === tab.id ? "var(--accent-4)" : "transparent"}`,
              color: activeTab === tab.id ? "#fff" : "var(--text-secondary)",
              fontSize: 14, fontWeight: activeTab === tab.id ? 600 : 400,
              textTransform: "uppercase", letterSpacing: 1, cursor: "pointer",
              transition: "all 0.3s ease"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ padding: 40, minHeight: 400, background: "rgba(0,0,0,0.4)" }}>
        {tabs.map((tab) => {
          if (activeTab !== tab.id) return null;
          
          return (
            <div key={tab.id} style={{ animation: "textReveal 0.5s cubic-bezier(0.16, 1, 0.3, 1)" }}>
              {tab.content ? (
                <div style={{
                  background: "rgba(0,0,0,0.5)", border: "1px solid var(--glass-border)",
                  borderRadius: 12, padding: 24, overflowX: "auto"
                }}>
                  <pre style={{
                    margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                    lineHeight: 1.6, color: "rgba(255,255,255,0.8)", whiteSpace: "pre-wrap"
                  }}>
                    {tab.content}
                  </pre>
                </div>
              ) : (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  height: 300, color: "var(--text-secondary)", fontStyle: "italic"
                }}>
                  Telemetry unavailable for this node.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
