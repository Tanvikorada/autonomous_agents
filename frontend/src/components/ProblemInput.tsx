"use client";
// components/ProblemInput.tsx — SVZ Editorial redesign

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
    <div className="svz-card svz-fade-in" style={{ padding: "48px" }}>
      {/* Section heading */}
      <div style={{ marginBottom: "32px" }}>
        <h2 className="svz-heading-lg" style={{ marginBottom: "16px" }}>
          Describe<br />
          <span className="svz-serif-italic" style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-1.6px", textTransform: "none" }}>
            the problem
          </span>
        </h2>
        <p className="svz-body">
          The AI pipeline will plan, write, test, and review a complete solution automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Textarea */}
        <div style={{ position: "relative", marginBottom: "8px" }}>
          <textarea
            id="problem-input"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="e.g. Build a Python REST API for a todo list with CRUD operations..."
            disabled={isLoading}
            rows={6}
            style={{
              width: "100%",
              background: "transparent",
              border: `1px solid ${problem.length > 0 ? "var(--color-arterial-red)" : "var(--color-iron)"}`,
              borderRadius: "var(--radius-cards)",
              padding: "20px 24px",
              color: "var(--color-bone-white)",
              fontFamily: "var(--font-primary)",
              fontSize: "14px",
              fontWeight: 300,
              lineHeight: 1.7,
              letterSpacing: "var(--tracking-in-body)",
              resize: "vertical",
              outline: "none",
              transition: "border-color 0.2s",
            }}
          />
        </div>

        {/* Char count */}
        <p className="svz-label" style={{ marginBottom: "24px" }}>
          {problem.length} characters — min 10
        </p>

        {/* Quick examples */}
        <div style={{ marginBottom: "32px" }}>
          <p className="svz-label" style={{ marginBottom: "12px" }}>
            Quick examples
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setProblem(ex)}
                disabled={isLoading}
                className="svz-label-bone"
                style={{
                  background: "transparent",
                  border: "1px solid var(--color-iron)",
                  borderRadius: "var(--radius-buttons)",
                  padding: "8px 16px",
                  cursor: "pointer",
                  transition: "border-color 0.15s, color 0.15s",
                  fontSize: "10px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-bone-white)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-iron)";
                }}
              >
                Example {i + 1} ↗
              </button>
            ))}
          </div>
        </div>

        {/* Submit CTA */}
        <button
          id="submit-btn"
          type="submit"
          className="svz-ghost-btn"
          disabled={isLoading || problem.trim().length < 10}
        >
          {isLoading ? (
            <>
              <span className="svz-spinner" />
              Running Pipeline
            </>
          ) : (
            "Run Pipeline ↗"
          )}
        </button>
      </form>
    </div>
  );
}
