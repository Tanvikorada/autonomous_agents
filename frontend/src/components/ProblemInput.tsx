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
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 600 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label style={{
          fontFamily: "var(--font-saans)",
          fontSize: "var(--text-caption)",
          fontWeight: "var(--font-weight-w380)",
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-caption)",
          color: "var(--color-paper-white)"
        }}>
          Initiate Sequence
        </label>
        <textarea
          value={problem}
          onChange={e => setProblem(e.target.value)}
          disabled={isLoading}
          placeholder="DESCRIBE THE APPLICATION..."
          rows={3}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid var(--color-paper-white)",
            outline: "none",
            fontFamily: "var(--font-saans)",
            fontSize: "var(--text-body)",
            fontWeight: "var(--font-weight-w380)",
            lineHeight: "var(--leading-body)",
            letterSpacing: "var(--tracking-body)",
            color: "var(--color-paper-white)",
            resize: "none",
            padding: "10px 0",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 15 }}>
        <button
          type="submit"
          disabled={!canSubmit}
          className={`ghost-pill ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isLoading ? "PROCESSING..." : "EXECUTE"}
        </button>
      </div>
    </form>
  );
}
