"use client";
// app/page.tsx — SVZ Editorial — Autonomous Agents (Full dramatic redesign)

import { useState, useCallback, useRef, useEffect } from "react";
import ProblemInput from "@/components/ProblemInput";
import AgentPipeline from "@/components/AgentPipeline";
import ResultPanel from "@/components/ResultPanel";
import {
  startPipeline,
  getJobStatus,
  getJobResult,
  JobStatus,
  JobStatusResponse,
  PipelineResult,
} from "@/lib/api";

const POLL_INTERVAL_MS = 2000;
const TERMINAL_STATUSES: JobStatus[] = ["done", "error"];

/* ─── Decorative background cross ────────────────────────────────── */
function DecorativeCross({ size = 400, x = 0, y = 0, opacity = 0.06 }: {
  size?: number; x?: number | string; y?: number | string; opacity?: number;
}) {
  const thickness = size * 0.12;
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        pointerEvents: "none",
        opacity,
      }}
    >
      {/* Horizontal bar */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: 0,
        right: 0,
        height: thickness,
        transform: "translateY(-50%)",
        background: "var(--color-charcoal-plate)",
      }} />
      {/* Vertical bar */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: 0,
        bottom: 0,
        width: thickness,
        transform: "translateX(-50%)",
        background: "var(--color-charcoal-plate)",
      }} />
    </div>
  );
}

/* ─── Large decorative letter / shape ────────────────────────────── */
function DecorativeGlyph({ char, size, x, y, opacity = 0.04 }: {
  char: string; size: number; x: number | string; y: number | string; opacity?: number;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontFamily: "var(--font-primary)",
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: "-0.08em",
        color: "var(--color-charcoal-plate)",
        opacity,
        pointerEvents: "none",
        userSelect: "none",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {char}
    </div>
  );
}

/* ─── Accent dot ─────────────────────────────────────────────────── */
function AccentDot({ size = 10 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--color-arterial-red)",
        flexShrink: 0,
      }}
    />
  );
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<JobStatusResponse | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPolling = useCallback((id: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const status = await getJobStatus(id);
        setStatusData(status);
        if (TERMINAL_STATUSES.includes(status.status)) {
          stopPolling();
          if (status.status === "done") { const res = await getJobResult(id); setResult(res); }
          else if (status.status === "error") setError(status.error || "An unknown error occurred.");
          setIsLoading(false);
        }
      } catch {
        setError("Lost connection to the backend.");
        stopPolling();
        setIsLoading(false);
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleSubmit = async (problem: string) => {
    setError(null); setResult(null); setStatusData(null); setJobId(null); setIsLoading(true);
    try {
      const { job_id } = await startPipeline(problem);
      setJobId(job_id);
      setStatusData({ job_id, status: "pending", current_agent: null, completed_steps: [], error: null });
      startPolling(job_id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start pipeline.");
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    stopPolling(); setIsLoading(false); setJobId(null); setStatusData(null); setResult(null); setError(null);
  };

  const isIdle = !isLoading && !statusData && !result && !error;

  return (
    <div style={{ background: "var(--color-void-canvas)", minHeight: "100vh", overflowX: "hidden" }}>

      {/* ══ NAVIGATION ══════════════════════════════════════════════════ */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        borderBottom: "1px solid var(--color-iron)",
      }}>
        <div style={{ padding: "0 48px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "56px" }}>
          {/* Wordmark */}
          <p style={{
            fontFamily: "var(--font-primary)", fontSize: "13px", fontWeight: 700,
            letterSpacing: "0.15em", color: "var(--color-bone-white)", textTransform: "uppercase",
          }}>
            Autonomous<span style={{ color: "var(--color-arterial-red)" }}>.</span>
          </p>

          {/* Center nav labels */}
          <div style={{ display: "flex", gap: "40px" }}>
            {["System", "Agents", "Pipeline", "Output"].map((label) => (
              <p key={label} style={{
                fontFamily: "var(--font-primary)", fontSize: "10px", fontWeight: 400,
                letterSpacing: "0.2em", color: "var(--color-iron)", textTransform: "uppercase",
              }}>
                {label}
              </p>
            ))}
          </div>

          {/* Right: status + CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {jobId && statusData && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {statusData.status !== "pending" && statusData.status !== "done" && (
                  <span className="svz-spinner" />
                )}
                {statusData.status === "done" && <AccentDot size={8} />}
                <span className="svz-status">{statusData.status.toUpperCase()}</span>
              </div>
            )}
            {(result || error) && (
              <button onClick={handleReset} className="svz-ghost-btn" style={{ padding: "6px 16px", fontSize: "10px" }}>
                New Problem ↗
              </button>
            )}
            <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="svz-ghost-link">
              API Docs ↗
            </a>
          </div>
        </div>
      </header>

      {/* ══ HERO — Full viewport ════════════════════════════════════════ */}
      <section style={{
        position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column",
        justifyContent: "flex-end", padding: "0 48px 72px", overflow: "hidden", paddingTop: "56px",
      }}>
        {/* Decorative shapes bleeding off-canvas */}
        <DecorativeCross size={520} x="-140px" y="60px" opacity={0.07} />
        <DecorativeCross size={280} x="65%" y="55%" opacity={0.05} />
        <DecorativeGlyph char="AI" size={420} x="-30px" y="10%" opacity={0.03} />
        <DecorativeGlyph char="01" size={260} x="60%" y="60%" opacity={0.04} />

        {/* Top caption */}
        <div style={{ position: "absolute", top: "80px", left: "48px", display: "flex", alignItems: "center", gap: "12px" }}>
          <AccentDot size={8} />
          <p className="svz-label">Multi-Agent Software Engineering System</p>
        </div>

        {/* The massive display headline */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <h1 style={{
            fontFamily: "var(--font-primary)",
            fontSize: "clamp(72px, 11vw, 130px)",
            fontWeight: 700,
            lineHeight: 0.88,
            letterSpacing: "clamp(-4px, -0.07em, -9px)",
            color: "var(--color-bone-white)",
            textTransform: "uppercase",
            marginBottom: "0",
          }}>
            AI Agents
          </h1>

          {/* Italic serif connective on the same baseline */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "24px", flexWrap: "wrap" }}>
            <span style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(48px, 7vw, 86px)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: "var(--color-bone-white)",
            }}>
              that
            </span>
            <h1 style={{
              fontFamily: "var(--font-primary)",
              fontSize: "clamp(72px, 11vw, 130px)",
              fontWeight: 700,
              lineHeight: 0.88,
              letterSpacing: "clamp(-4px, -0.07em, -9px)",
              color: "var(--color-bone-white)",
              textTransform: "uppercase",
              margin: 0,
            }}>
              Build Code
            </h1>
          </div>
        </div>

        {/* Bottom row — body + scroll cue */}
        <div style={{
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          marginTop: "48px", flexWrap: "wrap", gap: "24px", position: "relative", zIndex: 2,
        }}>
          <div style={{ maxWidth: "400px" }}>
            <div style={{ width: "32px", height: "1px", background: "var(--color-arterial-red)", marginBottom: "20px" }} />
            <p className="svz-body" style={{ color: "var(--color-ash)", lineHeight: 1.7 }}>
              Submit any software problem. Four specialized AI agents collaborate to plan, implement, test, and review a complete solution — autonomously.
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <p className="svz-label" style={{ marginBottom: "4px" }}>Four agents</p>
            <p className="svz-label">One pipeline</p>
          </div>
        </div>

        {/* Bottom hairline */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: "1px", background: "var(--color-iron)",
        }} />
      </section>

      {/* ══ TYPOGRAPHIC BREAK — "WE BUILD" ════════════════════════════ */}
      {isIdle && (
        <section style={{
          position: "relative", padding: "112px 48px",
          borderBottom: "1px solid var(--color-iron)", overflow: "hidden",
        }}>
          <DecorativeGlyph char="→" size={480} x="55%" y="-20%" opacity={0.04} />

          <div style={{ display: "flex", alignItems: "baseline", gap: "32px", flexWrap: "wrap" }}>
            <span style={{
              fontFamily: "var(--font-primary)",
              fontSize: "clamp(56px, 9vw, 100px)",
              fontWeight: 700,
              lineHeight: 0.9,
              letterSpacing: "-0.065em",
              color: "var(--color-bone-white)",
              textTransform: "uppercase",
            }}>
              We
            </span>
            <span style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(40px, 6vw, 72px)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: "var(--color-bone-white)",
            }}>
              engineer
            </span>
            <span style={{
              fontFamily: "var(--font-primary)",
              fontSize: "clamp(56px, 9vw, 100px)",
              fontWeight: 700,
              lineHeight: 0.9,
              letterSpacing: "-0.065em",
              color: "var(--color-bone-white)",
              textTransform: "uppercase",
            }}>
              Software
            </span>
          </div>
          <p className="svz-label" style={{ marginTop: "32px" }}>
            Planner — Coder — Tester — Reviewer
          </p>
        </section>
      )}

      {/* ══ LINEN PANEL — what each agent does ════════════════════════ */}
      {isIdle && (
        <section style={{
          background: "var(--color-linen)",
          padding: "80px 48px",
          borderBottom: "1px solid var(--color-iron)",
        }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <p style={{
              fontFamily: "var(--font-primary)", fontSize: "10px", fontWeight: 400,
              letterSpacing: "0.2em", color: "var(--color-smoke-plate)", textTransform: "uppercase",
              marginBottom: "48px",
            }}>
              The Pipeline
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0" }}>
              {[
                { index: "01", name: "Planner", desc: "Decomposes the problem into a structured sequence of executable steps." },
                { index: "02", name: "Coder",   desc: "Translates the plan into production-ready implementation code." },
                { index: "03", name: "Tester",  desc: "Generates comprehensive test cases to validate correctness and edge cases." },
                { index: "04", name: "Reviewer",desc: "Audits the code and tests, surfacing improvements and catching issues." },
              ].map((agent, i, arr) => (
                <div key={agent.name} style={{
                  padding: "0 40px 0 0",
                  borderRight: i < arr.length - 1 ? "1px solid var(--color-ash)" : "none",
                  marginRight: i < arr.length - 1 ? "40px" : 0,
                }}>
                  <p style={{
                    fontFamily: "var(--font-primary)", fontSize: "10px", fontWeight: 400,
                    letterSpacing: "0.15em", color: "var(--color-smoke-plate)", textTransform: "uppercase",
                    marginBottom: "16px",
                  }}>
                    {agent.index}
                  </p>
                  <p style={{
                    fontFamily: "var(--font-primary)", fontSize: "20px", fontWeight: 700,
                    letterSpacing: "-0.5px", color: "var(--color-absolute-black)",
                    textTransform: "uppercase", marginBottom: "12px",
                  }}>
                    {agent.name}
                  </p>
                  <p style={{
                    fontFamily: "var(--font-primary)", fontSize: "14px", fontWeight: 400,
                    lineHeight: 1.6, color: "var(--color-smoke-plate)",
                  }}>
                    {agent.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ PROBLEM INPUT SECTION ══════════════════════════════════════ */}
      {!result && (
        <section style={{
          position: "relative", padding: "112px 48px 80px", overflow: "hidden",
          borderBottom: "1px solid var(--color-iron)",
        }}>
          <DecorativeCross size={360} x="70%" y="-10%" opacity={0.05} />

          <div style={{ maxWidth: "900px", position: "relative", zIndex: 2 }}>
            {/* Section label */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "48px" }}>
              <div style={{ width: "24px", height: "1px", background: "var(--color-iron)" }} />
              <p className="svz-label">Submit your problem</p>
            </div>

            {/* Display heading */}
            <h2 style={{
              fontFamily: "var(--font-primary)",
              fontSize: "clamp(40px, 6.5vw, 80px)",
              fontWeight: 700,
              lineHeight: 0.9,
              letterSpacing: "clamp(-2px, -0.055em, -5px)",
              color: "var(--color-bone-white)",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}>
              Describe
            </h2>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(30px, 5vw, 60px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--color-ash)",
              marginBottom: "56px",
            }}>
              the problem to solve
            </h2>

            <ProblemInput onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        </section>
      )}

      {/* ══ PIPELINE TRACKER ══════════════════════════════════════════ */}
      {statusData && (
        <section style={{ padding: "80px 48px", borderBottom: "1px solid var(--color-iron)" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <AgentPipeline
              status={statusData.status}
              currentAgent={statusData.current_agent}
              completedSteps={statusData.completed_steps}
            />
          </div>
        </section>
      )}

      {/* ══ ERROR ══════════════════════════════════════════════════════ */}
      {error && (
        <section style={{ padding: "80px 48px" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div className="svz-card-red svz-fade-in" style={{ padding: "48px" }}>
              <p className="svz-label" style={{ color: "var(--color-arterial-red)", marginBottom: "24px" }}>
                Pipeline Error
              </p>
              <p style={{
                fontFamily: "var(--font-primary)", fontSize: "clamp(24px, 3vw, 42px)",
                fontWeight: 700, lineHeight: 1.05, letterSpacing: "-1.5px",
                color: "var(--color-bone-white)", marginBottom: "32px",
              }}>
                Something went wrong.
              </p>
              <p className="svz-body" style={{ color: "var(--color-ash)", marginBottom: "32px" }}>
                {error}
              </p>
              <div style={{ borderTop: "1px solid var(--color-iron)", paddingTop: "24px" }}>
                <p className="svz-label" style={{ marginBottom: "16px" }}>Common fixes</p>
                {[
                  "Check your .env file has a valid GROQ_API_KEY",
                  "Make sure the backend is running on port 8000",
                  "Check backend terminal for detailed error logs",
                ].map((fix, i) => (
                  <div key={i} style={{ display: "flex", gap: "16px", marginBottom: "8px" }}>
                    <span style={{ color: "var(--color-iron)", fontSize: "10px", marginTop: "2px", flexShrink: 0 }}>—</span>
                    <p className="svz-body">{fix}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ RESULTS ════════════════════════════════════════════════════ */}
      {result && (
        <>
          {/* Stats — full-bleed typographic break */}
          <section style={{
            padding: "80px 48px", borderBottom: "1px solid var(--color-iron)",
            position: "relative", overflow: "hidden",
          }}>
            <DecorativeGlyph char="✓" size={400} x="65%" y="-10%" opacity={0.04} />
            <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "56px" }}>
                <AccentDot size={10} />
                <p className="svz-label">Pipeline complete</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
                {[
                  { label: "Plan Steps",    value: result.plan?.length ?? 0 },
                  { label: "Code Lines",    value: result.code?.split("\n").length ?? 0 },
                  { label: "Test Lines",    value: result.tests?.split("\n").length ?? 0 },
                  { label: "Review",        value: `${Math.round((result.review?.length ?? 0) / 100) / 10}k` },
                ].map((stat, i) => (
                  <div key={stat.label} style={{
                    paddingLeft: i > 0 ? "40px" : 0,
                    borderLeft: i > 0 ? "1px solid var(--color-iron)" : "none",
                    paddingRight: i < 3 ? "40px" : 0,
                  }}>
                    <p style={{
                      fontFamily: "var(--font-primary)",
                      fontSize: "clamp(36px, 5vw, 64px)",
                      fontWeight: 700, lineHeight: 0.9,
                      letterSpacing: "-0.05em",
                      color: "var(--color-bone-white)",
                      marginBottom: "12px",
                    }}>
                      {stat.value}
                    </p>
                    <p className="svz-label">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Output panel */}
          <section style={{ padding: "80px 48px 112px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
              <ResultPanel result={result} />
            </div>
          </section>
        </>
      )}

      {/* ══ FOOTER ═════════════════════════════════════════════════════ */}
      <footer style={{
        background: "var(--color-charcoal-plate)",
        borderTop: "1px solid var(--color-iron)",
      }}>
        <div style={{
          padding: "48px",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px",
        }}>
          <div>
            <p style={{
              fontFamily: "var(--font-primary)", fontSize: "13px", fontWeight: 700,
              letterSpacing: "0.15em", color: "var(--color-bone-white)", textTransform: "uppercase",
              marginBottom: "6px",
            }}>
              Autonomous<span style={{ color: "var(--color-arterial-red)" }}>.</span>
            </p>
            <p className="svz-label">Multi-Agent Software Engineering System</p>
          </div>
          <div style={{ display: "flex", gap: "32px" }}>
            <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="svz-ghost-link">
              API Docs ↗
            </a>
            <a href="https://github.com/Tanvikorada/autonomous_agents" target="_blank" rel="noopener noreferrer" className="svz-ghost-link">
              GitHub ↗
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
