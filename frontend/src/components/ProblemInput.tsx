"use client";
// components/ProblemInput.tsx — Problem statement input form

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
    <div className="glass-card p-8 fade-in">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-1">
          Describe Your Problem
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          The AI pipeline will plan, code, test, and review a solution automatically.
        </p>
      </div>

      {/* Textarea */}
      <form onSubmit={handleSubmit}>
        <textarea
          id="problem-input"
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="e.g. Build a Python REST API for a todo list with CRUD operations..."
          disabled={isLoading}
          rows={5}
          style={{
            width: "100%",
            background: "rgba(0,0,0,0.3)",
            border: `1px solid ${problem.length > 0 ? "rgba(99,102,241,0.5)" : "var(--border)"}`,
            borderRadius: 12,
            padding: "16px 18px",
            color: "var(--text-primary)",
            fontFamily: "'Inter', sans-serif",
            fontSize: 15,
            lineHeight: 1.6,
            resize: "vertical",
            outline: "none",
            transition: "border-color 0.2s",
          }}
        />
        <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>
          {problem.length} characters (min 10)
        </p>

        {/* Example buttons */}
        <div className="mt-4 mb-6">
          <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 8 }}>
            QUICK EXAMPLES
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setProblem(ex)}
                disabled={isLoading}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "6px 14px",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.color = "var(--text-primary)";
                  (e.target as HTMLButtonElement).style.borderColor = "rgba(99,102,241,0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.color = "var(--text-secondary)";
                  (e.target as HTMLButtonElement).style.borderColor = "var(--border)";
                }}
              >
                Example {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <button
          id="submit-btn"
          type="submit"
          className="btn-primary"
          disabled={isLoading || problem.trim().length < 10}
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          {isLoading ? (
            <>
              <span className="spinner" />
              Running Pipeline...
            </>
          ) : (
            <>
              <span>🚀</span>
              Run AI Pipeline
            </>
          )}
        </button>
      </form>
    </div>
  );
}
