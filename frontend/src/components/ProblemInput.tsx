"use client";

import { useState } from "react";

interface Props {
  onSubmit: (problem: string) => void;
  isLoading: boolean;
}

const EXAMPLES = [
  "Build a Python REST API for a todo list with CRUD operations using FastAPI.",
  "Write a Python script that reads a CSV file and generates a statistical summary report.",
  "Create a Python class for a bank account with deposit, withdraw, and balance tracking.",
];

export default function ProblemInput({ onSubmit, isLoading }: Props) {
  const [problem, setProblem] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (problem.trim().length >= 10) onSubmit(problem.trim());
  };

  return (
    <div className="glass-panel" style={{ padding: 40, position: "relative", overflow: "hidden" }}>
      {/* Background glow accent inside the panel */}
      <div style={{
        position: "absolute", top: -50, right: -50, width: 200, height: 200,
        background: "radial-gradient(circle, var(--accent-3) 0%, transparent 70%)",
        opacity: 0.2, pointerEvents: "none"
      }} />

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 32 }}>
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="Describe the software you want to build..."
            disabled={isLoading}
            className="glass-input"
            rows={5}
            style={{
              width: "100%", padding: 24, borderRadius: 16, fontSize: 18,
              lineHeight: 1.6, resize: "vertical"
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "var(--text-secondary)", marginBottom: 12 }}>
              Quick Prompts
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setProblem(ex)}
                  disabled={isLoading}
                  style={{
                    background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)",
                    borderRadius: 100, padding: "8px 16px", fontSize: 12, color: "var(--text-secondary)",
                    cursor: "pointer", transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
                    (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                  }}
                >
                  Prompt 0{i + 1}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="glow-btn"
            disabled={isLoading || problem.trim().length < 10}
            style={{ minWidth: 200, display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}
          >
            {isLoading ? (
              <>
                <span className="loader-ring" />
                Initializing
              </>
            ) : (
              "Deploy Agents"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
