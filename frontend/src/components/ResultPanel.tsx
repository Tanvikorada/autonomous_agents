"use client";

import { PipelineResult } from "@/lib/api";

interface Props {
  result: PipelineResult;
}

export default function ResultPanel({ result }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-28)" }}>
      <h2 className="serif-headline" style={{ fontSize: "32px" }}>Implementation</h2>
      
      {result.plan && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="mono-badge">/plan</span>
            <h3 style={{ fontFamily: "var(--font-pplxsans)", fontSize: "var(--text-body-lg)", fontWeight: 500, letterSpacing: "-0.028em" }}>Strategy</h3>
          </div>
          <ul style={{ paddingLeft: 20, color: "var(--color-aged-sepia)", margin: 0 }} className="body-stack">
            {result.plan.map((step, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{step}</li>
            ))}
          </ul>
        </div>
      )}

      {result.code && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="mono-badge">/code</span>
            <h3 style={{ fontFamily: "var(--font-pplxsans)", fontSize: "var(--text-body-lg)", fontWeight: 500, letterSpacing: "-0.028em" }}>Source</h3>
          </div>
          <pre style={{
            margin: 0,
            padding: "var(--spacing-20)",
            backgroundColor: "var(--color-parchment)",
            borderRadius: "var(--radius-other)",
            border: "1px solid var(--color-fog)",
            overflowX: "auto",
            fontFamily: "var(--font-pplxsansmono)",
            fontSize: "12px",
            color: "var(--color-aged-sepia)"
          }}>
            <code>{result.code}</code>
          </pre>
        </div>
      )}

      {result.tests && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="mono-badge">/tests</span>
            <h3 style={{ fontFamily: "var(--font-pplxsans)", fontSize: "var(--text-body-lg)", fontWeight: 500, letterSpacing: "-0.028em" }}>Validation</h3>
          </div>
          <pre style={{
            margin: 0,
            padding: "var(--spacing-20)",
            backgroundColor: "var(--color-parchment)",
            borderRadius: "var(--radius-other)",
            border: "1px solid var(--color-fog)",
            overflowX: "auto",
            fontFamily: "var(--font-pplxsansmono)",
            fontSize: "12px",
            color: "var(--color-aged-sepia)"
          }}>
            <code>{result.tests}</code>
          </pre>
        </div>
      )}

      {result.review && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="mono-badge">/review</span>
            <h3 style={{ fontFamily: "var(--font-pplxsans)", fontSize: "var(--text-body-lg)", fontWeight: 500, letterSpacing: "-0.028em" }}>Audit</h3>
          </div>
          <p className="body-stack" style={{ margin: 0 }}>
            {result.review}
          </p>
        </div>
      )}
    </div>
  );
}
