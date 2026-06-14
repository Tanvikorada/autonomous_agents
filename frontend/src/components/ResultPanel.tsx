"use client";
// components/ResultPanel.tsx — SVZ editorial output panel

import { useState } from "react";
import { PipelineResult } from "@/lib/api";

interface Props {
  result: PipelineResult;
}

type Tab = "plan" | "code" | "tests" | "review";

const TABS: { id: Tab; label: string }[] = [
  { id: "plan",   label: "Plan" },
  { id: "code",   label: "Code" },
  { id: "tests",  label: "Tests" },
  { id: "review", label: "Review" },
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
      className="svz-ghost-link"
      style={{
        color: copied ? "var(--color-bone-white)" : "var(--color-iron)",
        fontSize: "10px",
      }}
    >
      {copied ? "Copied" : "Copy ↗"}
    </button>
  );
}

function PlanView({ plan }: { plan: string[] | null }) {
  if (!plan || plan.length === 0)
    return <p className="svz-body">No plan generated.</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {plan.map((step, i) => (
        <div
          key={i}
          className="svz-fade-in"
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "flex-start",
            animationDelay: `${i * 50}ms`,
            paddingLeft: "12px",
            borderLeft: "1px solid var(--color-arterial-red)",
          }}
        >
          <span className="svz-label" style={{ flexShrink: 0, minWidth: "20px" }}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <p className="svz-body" style={{ color: "var(--color-bone-white)", lineHeight: 1.6 }}>
            {step}
          </p>
        </div>
      ))}
    </div>
  );
}

function CodeView({ code, label }: { code: string | null; label: string }) {
  if (!code)
    return <p className="svz-body">No {label} generated.</p>;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: "12px", right: "12px", zIndex: 10 }}>
        <CopyButton text={code} />
      </div>
      <pre className="svz-code-block" style={{ paddingTop: "40px" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function ReviewView({ review }: { review: string | null }) {
  if (!review)
    return <p className="svz-body">No review generated.</p>;

  const lines = review.split("\n");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {lines.map((line, i) => {
        if (line.startsWith("## "))
          return (
            <p
              key={i}
              style={{
                fontFamily: "var(--font-primary)",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "var(--tracking-out-sm)",
                textTransform: "uppercase",
                color: "var(--color-bone-white)",
                marginTop: "24px",
                marginBottom: "8px",
              }}
            >
              {line.replace("## ", "")}
            </p>
          );
        if (line.startsWith("- ") || line.startsWith("* "))
          return (
            <div key={i} style={{ display: "flex", gap: "12px", paddingLeft: "8px" }}>
              <span style={{ color: "var(--color-iron)", marginTop: "3px", flexShrink: 0 }}>—</span>
              <p className="svz-body">{line.replace(/^[-*] /, "")}</p>
            </div>
          );
        if (line.startsWith("```")) return null;
        if (line.trim() === "") return <div key={i} style={{ height: "6px" }} />;
        return (
          <p key={i} className="svz-body" style={{ lineHeight: 1.7 }}>
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
    <div className="svz-card svz-fade-in" style={{ padding: "40px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: "32px",
          paddingBottom: "24px",
          borderBottom: "1px solid var(--color-iron)",
        }}
      >
        <div>
          <h3 className="svz-heading-sm" style={{ marginBottom: "6px" }}>
            Pipeline Results
          </h3>
          <p className="svz-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span className="svz-accent-dot" />
            Complete
          </p>
        </div>
        <p className="svz-label">
          Job {result.job_id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      {/* Tabs */}
      <div className="svz-tab-row" style={{ marginBottom: "32px" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={`svz-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
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
