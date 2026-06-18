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
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
        <textarea
          value={problem}
          onChange={e => setProblem(e.target.value)}
          disabled={isLoading}
          placeholder="Describe what you want to build..."
          rows={4}
          style={{
            width: "100%",
            backgroundColor: "var(--color-obsidian-surface)",
            border: "1px solid var(--color-mist)",
            borderRadius: "var(--radius-inputs)",
            padding: "var(--spacing-16)",
            outline: "none",
            fontFamily: "var(--font-canvasans)",
            fontSize: "16px",
            fontWeight: 400,
            color: "var(--color-bone-white)",
            resize: "none",
            transition: "border-color 0.3s ease"
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--color-leonardo-violet)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-mist)")}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--spacing-10)" }}>
        <div style={{ fontFamily: "var(--font-canvasans)", fontSize: "12px", color: "var(--color-charcoal-mute)" }}>
          Minimum 10 characters required.
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="primary-cta"
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: 18, animation: "spin 2s linear infinite" }}>sync</span>
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
