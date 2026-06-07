"use client";
// components/ResultPanel.tsx — Tabbed output panel for plan/code/tests/review

import { useState } from "react";
import { PipelineResult } from "@/lib/api";

interface Props {
  result: PipelineResult;
}

type Tab = "plan" | "code" | "tests" | "review";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "plan",   label: "Plan",   icon: "📋" },
  { id: "code",   label: "Code",   icon: "💻" },
  { id: "tests",  label: "Tests",  icon: "🧪" },
  { id: "review", label: "Review", icon: "🔍" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      style={{
        background: copied ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)",
        border: `1px solid ${copied ? "rgba(16,185,129,0.4)" : "var(--border)"}`,
        color: copied ? "#34d399" : "var(--text-secondary)",
        borderRadius: 8,
        padding: "5px 14px",
        fontSize: 12,
        cursor: "pointer",
        transition: "all 0.2s",
        fontFamily: "'Inter', sans-serif",
        fontWeight: 500,
      }}
    >
      {copied ? "✓ Copied!" : "Copy"}
    </button>
  );
}

function PlanView({ plan }: { plan: string[] | null }) {
  if (!plan || plan.length === 0) return <p style={{ color: "var(--text-muted)" }}>No plan generated.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {plan.map((step, i) => (
        <div
          key={i}
          className="fade-in"
          style={{
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
            animationDelay: `${i * 60}ms`,
          }}
        >
          <div
            style={{
              minWidth: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(99,102,241,0.2)",
              border: "1px solid rgba(99,102,241,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#818cf8",
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            {i + 1}
          </div>
          <p style={{ color: "var(--text-primary)", lineHeight: 1.6, fontSize: 14 }}>{step}</p>
        </div>
      ))}
    </div>
  );
}

function CodeView({ code, label }: { code: string | null; label: string }) {
  if (!code) return <p style={{ color: "var(--text-muted)" }}>No {label} generated.</p>;
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
        <CopyButton text={code} />
      </div>
      <pre className="code-block" style={{ paddingTop: 44 }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function ReviewView({ review }: { review: string | null }) {
  if (!review) return <p style={{ color: "var(--text-muted)" }}>No review generated.</p>;

  // Simple markdown-like rendering for the review
  const lines = review.split("\n");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 8, color: "var(--text-primary)" }}>
              {line.replace("## ", "")}
            </h3>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", paddingLeft: 8 }}>
              <span style={{ color: "var(--accent)", marginTop: 2 }}>▸</span>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
                {line.replace(/^[-*] /, "")}
              </p>
            </div>
          );
        }
        if (line.startsWith("```")) return null;
        if (line.trim() === "") return <div key={i} style={{ height: 4 }} />;
        return (
          <p key={i} style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7 }}>
            {line}
          </p>
        );
      })}
    </div>
  );
}

export default function ResultPanel({ result }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("plan");

  return (
    <div className="glass-card p-6 fade-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h3 style={{ fontWeight: 600, fontSize: 16 }}>
          Pipeline Results
          <span className="status-badge status-done" style={{ marginLeft: 12 }}>✅ Complete</span>
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
          Job: <code style={{ color: "var(--text-secondary)" }}>{result.job_id.slice(0, 8)}...</code>
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 20,
          background: "rgba(0,0,0,0.2)",
          borderRadius: 10,
          padding: 4,
          border: "1px solid var(--border)",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "plan"   && <PlanView plan={result.plan} />}
        {activeTab === "code"   && <CodeView code={result.code} label="code" />}
        {activeTab === "tests"  && <CodeView code={result.tests} label="tests" />}
        {activeTab === "review" && <ReviewView review={result.review} />}
      </div>
    </div>
  );
}
