"use client";

import { useState } from "react";
import { PipelineResult } from "@/lib/api";

interface Props {
  result: PipelineResult;
}

type TabId = "plan" | "code" | "tests" | "review";

export default function ResultPanel({ result }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("plan");
  const [copied, setCopied] = useState(false);

  const tabs: { id: TabId; label: string; content: string | null | string[] }[] = [
    { id: "plan",   label: "Implementation Plan", content: result.plan },
    { id: "code",   label: "Generated Code",      content: result.code },
    { id: "tests",  label: "Test Suite",          content: result.tests },
    { id: "review", label: "Audit Report",        content: result.review },
  ];

  const rawContent = tabs.find(t => t.id === activeTab)?.content ?? null;
  const activeContent = Array.isArray(rawContent) ? rawContent.join("\n\n") : rawContent;

  const handleCopy = () => {
    if (activeContent) {
      navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="glass-panel"
      style={{ borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: 680 }}
    >
      {/* ── Tab Bar ── */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        overflowX: "auto",
        flexShrink: 0,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "16px 20px",
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${activeTab === tab.id ? "#b6ebff" : "transparent"}`,
              color: activeTab === tab.id ? "#b6ebff" : "#bbc9cf",
              fontSize: 13,
              fontFamily: "'Geist', monospace",
              fontWeight: 500,
              whiteSpace: "nowrap",
              transition: "color 0.2s, border-color 0.2s",
            }}
            onMouseEnter={e => {
              if (activeTab !== tab.id)
                (e.currentTarget as HTMLButtonElement).style.color = "#e5e2e1";
            }}
            onMouseLeave={e => {
              if (activeTab !== tab.id)
                (e.currentTarget as HTMLButtonElement).style.color = "#bbc9cf";
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content Area ── */}
      <div style={{ flex: 1, padding: 24, overflowY: "auto", position: "relative" }}>
        {activeContent ? (
          <div style={{ position: "relative" }}>
            {/* Copy button */}
            <button
              onClick={handleCopy}
              style={{
                position: "absolute", top: 12, right: 12, zIndex: 10,
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.08)",
                border: "none",
                padding: "5px 12px",
                borderRadius: 4,
                color: copied ? "#47d6ff" : "#bbc9cf",
                fontSize: 12, fontFamily: "'Geist', monospace",
                transition: "background 0.2s, color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                {copied ? "check" : "content_copy"}
              </span>
              {copied ? "Copied!" : "Copy"}
            </button>

            {/* Code block */}
            <div style={{
              background: "#0a0a0a",
              borderRadius: 8,
              padding: "24px 24px 24px 24px",
              border: "1px solid rgba(255,255,255,0.06)",
              marginTop: 0,
            }}>
              <pre style={{
                margin: 0,
                fontFamily: "'Geist', monospace",
                fontSize: 13,
                lineHeight: 1.7,
                color: "#47d6ff",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}>
                {activeContent}
              </pre>
            </div>
          </div>
        ) : (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: 280, flexDirection: "column", gap: 12,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#bbc9cf", opacity: 0.4 }}>
              data_object
            </span>
            <p style={{
              color: "#bbc9cf", fontFamily: "'Outfit', sans-serif",
              fontSize: 14, margin: 0, opacity: 0.6, fontStyle: "italic",
            }}>
              Telemetry unavailable for this node.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
