"use client";
// components/ResultPanel.tsx — Vivid+Co × SVZ Fusion

import { useState } from "react";
import { PipelineResult } from "@/lib/api";

interface Props {
  result: PipelineResult;
}

export default function ResultPanel({ result }: Props) {
  const [activeTab, setActiveTab] = useState<"plan" | "code" | "tests" | "review">("plan");

  const tabs = [
    { id: "plan", label: "Planner Output", content: result.plan },
    { id: "code", label: "Coder Output", content: result.code },
    { id: "tests", label: "Tester Output", content: result.tests },
    { id: "review", label: "Reviewer Output", content: result.review },
  ] as const;

  return (
    <div className="fade-in">
      {/* Editorial Tab Row */}
      <div className="tab-row" style={{ marginBottom: "var(--sp-40)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ minHeight: "400px" }}>
        {tabs.map((tab) => {
          if (activeTab !== tab.id) return null;
          
          return (
            <div key={tab.id} className="fade-in">
              {tab.content ? (
                <div className="code-block">
                  {tab.content}
                </div>
              ) : (
                <p className="body-lg" style={{ color: "rgba(255,253,249,0.3)", fontStyle: "italic" }}>
                  No output available for this step.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
