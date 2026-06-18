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

  const canSubmit = !isLoading && problem.trim().length >= 10;

  return (
    <form onSubmit={handleSubmit}>
      <div
        id="problem-card"
        className="glass-panel"
        style={{ borderRadius: 12, padding: 24, position: "relative", overflow: "hidden" }}
      >
        {/* "Primary Objective" badge */}
        <div style={{
          position: "absolute", top: -12, left: 24,
          padding: "4px 14px",
          background: "#2a2a2a",
          borderRadius: 9999,
          border: "1px solid rgba(255,255,255,0.1)",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          color: "#b6ebff",
          zIndex: 20,
          fontFamily: "'Geist', monospace",
          fontWeight: 500,
        }}>
          Primary Objective
        </div>

        {/* Textarea */}
        <textarea
          value={problem}
          onChange={e => setProblem(e.target.value)}
          disabled={isLoading}
          placeholder="Describe the application you want to build... (e.g. 'A REST API for a todo list with CRUD operations')"
          rows={4}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "'Outfit', sans-serif",
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: "-0.03em",
            color: "#e5e2e1",
            resize: "none",
            position: "relative",
            zIndex: 10,
            caretColor: "#47d6ff",
            marginTop: 8,
          }}
        />

        {/* Footer row */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 20, position: "relative", zIndex: 10, flexWrap: "wrap", gap: 12,
        }}>
          {/* Quick-prompt chips */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setProblem(ex)}
                disabled={isLoading}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "4px 10px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 4,
                  color: "#bbc9cf",
                  fontSize: 12,
                  fontFamily: "'Geist', monospace",
                  opacity: isLoading ? 0.4 : 1,
                  transition: "background 0.2s, color 0.2s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#e5e2e1";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#bbc9cf";
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>terminal</span>
                Prompt 0{i + 1}
              </button>
            ))}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={canSubmit ? "shimmer-btn" : ""}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 28px",
              borderRadius: 9999,
              border: "1px solid rgba(255,255,255,0.2)",
              background: canSubmit ? undefined : "rgba(255,255,255,0.06)",
              color: "#ffffff",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              opacity: canSubmit ? 1 : 0.45,
              whiteSpace: "nowrap",
              transition: "box-shadow 0.3s, opacity 0.2s",
              boxShadow: canSubmit ? "0 0 0 0 rgba(142,45,226,0)" : "none",
            }}
            onMouseEnter={e => {
              if (canSubmit)
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 28px rgba(142,45,226,0.55)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
            }}
          >
            {isLoading ? (
              <>
                <span className="loader-ring" />
                Running Swarm
              </>
            ) : (
              <>
                Run Swarm
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>bolt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
