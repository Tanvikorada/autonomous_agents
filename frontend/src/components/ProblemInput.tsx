"use client";
// components/ProblemInput.tsx — SVZ editorial, stripped down

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
    <form onSubmit={handleSubmit}>
      {/* Textarea — the primary surface */}
      <div style={{ position: "relative", marginBottom: "16px" }}>
        <textarea
          id="problem-input"
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="e.g. Build a Python REST API for a todo list with CRUD operations and JWT authentication..."
          disabled={isLoading}
          rows={7}
          style={{
            width: "100%",
            background: "transparent",
            border: `1px solid ${problem.length > 0 ? "var(--color-arterial-red)" : "var(--color-iron)"}`,
            borderRadius: "8px",
            padding: "28px 32px",
            color: "var(--color-bone-white)",
            fontFamily: "var(--font-primary)",
            fontSize: "16px",
            fontWeight: 300,
            lineHeight: 1.7,
            letterSpacing: "-0.01em",
            resize: "vertical",
            outline: "none",
            transition: "border-color 0.2s",
          }}
        />
        {/* Char count inside */}
        <p style={{
          position: "absolute", bottom: "16px", right: "20px",
          fontFamily: "var(--font-primary)", fontSize: "10px", fontWeight: 400,
          letterSpacing: "0.1em", textTransform: "uppercase",
          color: "var(--color-iron)",
        }}>
          {problem.length} chars
        </p>
      </div>

      {/* Quick examples */}
      <div style={{ marginBottom: "32px" }}>
        <p style={{
          fontFamily: "var(--font-primary)", fontSize: "10px", fontWeight: 400,
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: "var(--color-iron)", marginBottom: "12px",
        }}>
          Quick examples
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setProblem(ex)}
              disabled={isLoading}
              style={{
                background: "transparent",
                border: "1px solid var(--color-iron)",
                borderRadius: "3px",
                padding: "6px 14px",
                cursor: "pointer",
                fontFamily: "var(--font-primary)",
                fontSize: "10px",
                fontWeight: 400,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-iron)",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget).style.color = "var(--color-bone-white)";
                (e.currentTarget).style.borderColor = "var(--color-bone-white)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget).style.color = "var(--color-iron)";
                (e.currentTarget).style.borderColor = "var(--color-iron)";
              }}
            >
              Example {i + 1} ↗
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        id="submit-btn"
        type="submit"
        className="svz-ghost-btn"
        disabled={isLoading || problem.trim().length < 10}
        style={{ fontSize: "12px", letterSpacing: "0.15em" }}
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
  );
}
