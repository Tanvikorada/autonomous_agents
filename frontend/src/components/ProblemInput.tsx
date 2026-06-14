"use client";
// components/ProblemInput.tsx — Vivid+Co × SVZ Fusion

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
    <form onSubmit={handleSubmit} className="fade-in">
      {/* Textarea — minimal slate canvas */}
      <div style={{ position: "relative", marginBottom: "32px" }}>
        <textarea
          id="problem-input"
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="e.g. Build a Python REST API for a todo list with CRUD operations and JWT authentication..."
          disabled={isLoading}
          rows={6}
          style={{
            width: "100%",
            background: "rgba(16, 16, 16, 0.4)", // slight carbon recess
            border: `1px solid ${problem.length > 0 ? "var(--arterial-red)" : "rgba(111,135,156,0.3)"}`,
            borderRadius: "0px",
            padding: "32px 40px",
            color: "var(--bone-white)",
            fontFamily: "var(--font-primary)",
            fontSize: "20px",
            fontWeight: 400,
            lineHeight: 1.6,
            letterSpacing: "-0.01em",
            resize: "vertical",
            outline: "none",
            transition: "border-color 0.3s ease",
          }}
        />
        {/* Inside char count */}
        <p className="caption" style={{
          position: "absolute", bottom: "16px", right: "24px",
          color: problem.length > 0 ? "var(--bone-white)" : "rgba(255,253,249,0.3)",
          transition: "color 0.3s ease",
        }}>
          {String(problem.length).padStart(2, "0")} / MIN 10
        </p>
      </div>

      {/* Examples & Action Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "32px" }}>
        
        {/* Quick Examples */}
        <div style={{ maxWidth: "500px" }}>
          <p className="caption" style={{ marginBottom: "16px", color: "rgba(255,253,249,0.4)" }}>
            Quick Examples
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setProblem(ex)}
                disabled={isLoading}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(111,135,156,0.3)",
                  borderRadius: "0px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontFamily: "var(--font-primary)",
                  fontSize: "12px",
                  fontWeight: 400,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "rgba(255,253,249,0.6)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget).style.color = "var(--bone-white)";
                  (e.currentTarget).style.borderColor = "var(--bone-white)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget).style.color = "rgba(255,253,249,0.6)";
                  (e.currentTarget).style.borderColor = "rgba(111,135,156,0.3)";
                }}
              >
                Ex. 0{i + 1} ↗
              </button>
            ))}
          </div>
        </div>

        {/* Submit Action */}
        <button
          id="submit-btn"
          type="submit"
          className="ghost-btn"
          disabled={isLoading || problem.trim().length < 10}
          style={{ padding: "16px 32px", fontSize: "14px" }}
        >
          {isLoading ? (
            <>
              <span className="spinner" />
              Initializing...
            </>
          ) : (
            "Run Pipeline ↗"
          )}
        </button>
      </div>
    </form>
  );
}
