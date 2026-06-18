"use client";

import { useState } from "react";

interface Props {
  onSubmit: (problem: string) => void;
  isLoading: boolean;
}

export default function ProblemInput({ onSubmit, isLoading }: Props) {
  const [problem, setProblem] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (problem.trim().length >= 10) onSubmit(problem.trim());
  };

  const canSubmit = !isLoading && problem.trim().length >= 10;

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <textarea
          value={problem}
          onChange={e => setProblem(e.target.value)}
          disabled={isLoading}
          placeholder="Describe what you want to build..."
          rows={4}
          style={{
            width: "100%",
            backgroundColor: "var(--surface-parchment-canvas)",
            border: "1px solid var(--color-fog)",
            borderRadius: "var(--radius-inputs)",
            padding: "16px",
            outline: "none",
            fontFamily: "var(--font-pplxsans)",
            fontSize: "var(--text-body-lg)",
            fontWeight: 400,
            lineHeight: "var(--leading-body-lg)",
            color: "var(--color-aged-sepia)",
            resize: "none",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--color-teal-accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-fog)")}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <div className="mono-badge">
          /query: task-generator
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="pill-cta"
          style={{ padding: "8px 24px" }}
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>sync</span>
              Processing...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>bolt</span>
              Run Swarm
            </>
          )}
        </button>
      </div>
    </form>
  );
}
