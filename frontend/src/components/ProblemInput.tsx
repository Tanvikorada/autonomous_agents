"use client";

import { useState } from "react";
import { motion } from "framer-motion";

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
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-20)" }}>
      <div style={{ position: "relative" }}>
        <textarea
          value={problem}
          onChange={e => setProblem(e.target.value)}
          disabled={isLoading}
          placeholder="Describe the system you want to generate..."
          rows={3}
          style={{
            width: "100%",
            backgroundColor: "var(--color-obsidian-surface)",
            border: "1px solid var(--color-mist)",
            borderRadius: "var(--radius-cardslarge)",
            padding: "var(--spacing-27)",
            paddingRight: "180px", // space for the absolute positioned button
            outline: "none",
            fontFamily: "var(--font-canvasans)",
            fontSize: "19px",
            fontWeight: 400,
            lineHeight: 1.4,
            color: "var(--color-bone-white)",
            resize: "none",
            transition: "border-color 0.4s ease, box-shadow 0.4s ease"
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "var(--color-bone-white)";
            e.target.style.boxShadow = "0 0 0 1px rgba(255,255,255,0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--color-mist)";
            e.target.style.boxShadow = "none";
          }}
        />
        
        <div style={{ position: "absolute", bottom: "var(--spacing-20)", right: "var(--spacing-20)" }}>
          <button
            type="submit"
            disabled={!canSubmit}
            className="primary-cta"
            style={{ 
              padding: "14px 34px", 
              fontSize: "16px",
              boxShadow: "none" // enforce no shadow per rules
            }}
          >
            {isLoading ? (
              <>
                <motion.span 
                  className="material-symbols-outlined" 
                  style={{ fontSize: 18 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  sync
                </motion.span>
                Processing
              </>
            ) : (
              <>
                Generate
              </>
            )}
          </button>
        </div>
      </div>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 var(--spacing-10)" }}>
        <div style={{ fontFamily: "var(--font-canvasans)", fontSize: "12px", color: "var(--color-charcoal-mute)" }}>
          Minimum 10 characters required. Swarm OS will orchestrate planning, coding, and validation.
        </div>
      </div>
    </form>
  );
}
