"use client";

import { useState } from "react";
import { PipelineResult } from "@/lib/api";

interface Props {
  result: PipelineResult;
}

type TabId = "plan" | "code" | "tests" | "review";

export default function ResultPanel({ result }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("plan");

  const tabs: { id: TabId; label: string; content: string | null | string[] }[] = [
    { id: "plan",   label: "IMPLEMENTATION", content: result.plan },
    { id: "code",   label: "CODE",           content: result.code },
    { id: "tests",  label: "TESTS",          content: result.tests },
    { id: "review", label: "AUDIT",          content: result.review },
  ];

  const rawContent = tabs.find(t => t.id === activeTab)?.content ?? null;
  const activeContent = Array.isArray(rawContent) ? rawContent.join("\n\n") : rawContent;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Tab Bar */}
      <div style={{ display: "flex", gap: 30, borderBottom: "1px solid var(--color-smoke)", paddingBottom: 10 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: "transparent",
              border: "none",
              color: activeTab === tab.id ? "var(--color-paper-white)" : "var(--color-smoke)",
              fontFamily: "var(--font-saans)",
              fontSize: "var(--text-caption)",
              textTransform: "uppercase",
              letterSpacing: "var(--tracking-caption)",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div>
        {activeContent ? (
          <pre style={{
            margin: 0,
            fontFamily: "monospace",
            fontSize: "var(--text-caption)",
            color: "var(--color-smoke)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            {activeContent}
          </pre>
        ) : (
          <div style={{ color: "var(--color-smoke)", fontSize: "var(--text-caption)" }}>NO DATA</div>
        )}
      </div>
    </div>
  );
}
