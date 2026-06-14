"use client";
// app/page.tsx — Vivid+Co × SVZ Fusion — Autonomous Agents

import { useState, useCallback, useRef, useEffect } from "react";
import ProblemInput from "@/components/ProblemInput";
import AgentPipeline from "@/components/AgentPipeline";
import ResultPanel from "@/components/ResultPanel";
import {
  startPipeline, getJobStatus, getJobResult,
  JobStatus, JobStatusResponse, PipelineResult,
} from "@/lib/api";

const POLL_INTERVAL_MS = 2000;
const TERMINAL_STATUSES: JobStatus[] = ["done", "error"];

/* ── Hero word-reveal animation rows ──────────────────────────────*/
const HERO_LINES = [
  { text: "AI Agents", delay: 0.15 },
  { text: "That Build", delay: 0.35 },
  { text: "Software.", delay: 0.55 },
];

function HeroSection() {
  const prismRef = useRef<HTMLDivElement>(null);
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const rafRef = useRef<number | null>(null);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetX.current = (e.clientX / window.innerWidth - 0.5) * 50;
      targetY.current = (e.clientY / window.innerHeight - 0.5) * 35;
    };
    const animate = () => {
      currentX.current = lerp(currentX.current, targetX.current, 0.04);
      currentY.current = lerp(currentY.current, targetY.current, 0.04);
      if (prismRef.current) {
        prismRef.current.style.transform =
          `translate(${currentX.current}px, ${currentY.current}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    window.addEventListener("mousemove", handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section
      style={{
        position: "relative",
        height: "100vh",
        minHeight: "700px",
        background: "var(--slate-veil)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "0 64px 80px",
      }}
    >
      {/* Vignette overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
        background: "radial-gradient(ellipse at 60% 50%, transparent 30%, rgba(25,30,37,0.55) 100%)",
      }} />

      {/* Floating glass prism — mouse parallax + CSS float */}
      <div
        ref={prismRef}
        style={{
          position: "absolute",
          right: "-4%",
          top: "5%",
          width: "55%",
          maxWidth: "680px",
          zIndex: 1,
          willChange: "transform",
          animation: "floatPrism 9s ease-in-out infinite",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/prism.png"
          alt=""
          style={{
            width: "100%",
            height: "auto",
            opacity: 0.92,
            maskImage: "radial-gradient(ellipse 80% 80% at 55% 45%, black 30%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 55% 45%, black 30%, transparent 80%)",
            filter: "contrast(1.05) saturate(1.1)",
          }}
        />
      </div>

      {/* Top-left caption */}
      <div style={{
        position: "absolute", top: "32px", left: "64px", zIndex: 10,
        display: "flex", alignItems: "center", gap: "10px",
        animation: "slideDownNav 0.8s ease-out 0.1s both",
      }}>
        <span className="red-dot" />
        <span className="caption">Multi-Agent Software Engineering System — 2024</span>
      </div>

      {/* Top-right corner label */}
      <div style={{
        position: "absolute", top: "32px", right: "64px", zIndex: 10,
        animation: "slideDownNav 0.8s ease-out 0.2s both",
      }}>
        <span className="caption">Vol. I</span>
      </div>

      {/* Hero headline — word-by-word reveal */}
      <div style={{ position: "relative", zIndex: 5, marginBottom: "40px" }}>
        {HERO_LINES.map((line) => (
          <div key={line.text} style={{ overflow: "hidden", lineHeight: "1.0" }}>
            <h1
              className="display-xl"
              style={{
                display: "block",
                animation: `revealUp 1s cubic-bezier(0.16, 1, 0.3, 1) ${line.delay}s both`,
                paddingBottom: "4px",
              }}
            >
              {line.text}
            </h1>
          </div>
        ))}
      </div>

      {/* Bottom row — body + indicator */}
      <div style={{
        position: "relative", zIndex: 5,
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        animation: "fadeUp 0.8s ease-out 1.0s both",
      }}>
        <div style={{ maxWidth: "380px" }}>
          {/* Red rule — SVZ heartbeat */}
          <div style={{
            width: "32px", height: "1px",
            background: "var(--arterial-red)",
            marginBottom: "18px",
          }} />
          <p className="body-lg">
            Submit any software problem. Four specialized agents collaborate
            to plan, implement, test, and review — autonomously.
          </p>
        </div>

        {/* Scroll cue */}
        <div style={{ textAlign: "right" }}>
          <p className="caption" style={{ marginBottom: "8px" }}>Scroll to begin</p>
          <div style={{
            width: "1px", height: "40px",
            background: "linear-gradient(to bottom, rgba(255,253,249,0.4), transparent)",
            marginLeft: "auto",
            animation: "breathe 2s ease-in-out infinite",
          }} />
        </div>
      </div>

      {/* Bottom hairline */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: "1px", background: "rgba(111,135,156,0.3)", zIndex: 10,
      }} />
    </section>
  );
}

/* ── Navigation ───────────────────────────────────────────────────*/
function Nav({
  jobId, statusData, result, error, onReset,
}: {
  jobId: string | null;
  statusData: JobStatusResponse | null;
  result: PipelineResult | null;
  error: string | null;
  onReset: () => void;
}) {
  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 64px", height: "56px",
      background: "rgba(73,87,100,0.75)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(111,135,156,0.2)",
      animation: "slideDownNav 0.6s ease-out both",
    }}>
      {/* Wordmark */}
      <p style={{
        fontFamily: "var(--font-primary)", fontSize: "16px", fontWeight: 400,
        color: "var(--bone-white)", letterSpacing: "0.01em",
      }}>
        Autonomous<span style={{ color: "var(--arterial-red)", fontWeight: 700 }}>.</span>
      </p>

      {/* Center nav items */}
      <nav style={{ display: "flex", gap: "32px" }}>
        {["System", "Agents", "Pipeline", "Output"].map((item) => (
          <span key={item} className="caption" style={{
            color: "rgba(255,253,249,0.55)", letterSpacing: "0.08em",
          }}>
            {item}
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {jobId && statusData && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {statusData.status !== "done" && statusData.status !== "pending" && statusData.status !== "error" && (
              <span className="spinner" />
            )}
            {statusData.status === "done" && <span className="red-dot" />}
            <span className="caption" style={{ letterSpacing: "0.1em" }}>
              {statusData.status.toUpperCase()}
            </span>
          </div>
        )}
        {(result || error) && (
          <button onClick={onReset} className="ghost-btn-accent ghost-btn" style={{ padding: "6px 14px", fontSize: "12px" }}>
            Reset ↗
          </button>
        )}
        <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer"
          className="ghost-btn" style={{ padding: "8px 16px", fontSize: "12px", borderRadius: "var(--r-nav)" }}>
          API Docs
        </a>
      </div>
    </header>
  );
}

/* ── Main App ─────────────────────────────────────────────────────*/
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
        stopPolling(); setIsLoading(false);
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
    stopPolling(); setIsLoading(false); setJobId(null);
    setStatusData(null); setResult(null); setError(null);
  };

  const isIdle = !isLoading && !statusData && !result && !error;

  return (
    <div className="grain" style={{ background: "var(--slate-veil)", minHeight: "100vh" }}>

      <Nav jobId={jobId} statusData={statusData} result={result} error={error} onReset={handleReset} />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── MANIFESTO — full bleed type composition ───────────────── */}
      {isIdle && (
        <section style={{ padding: "var(--sp-108) 64px", position: "relative", overflow: "hidden" }}>
          {/* Faint vertical rule — editorial punctuation */}
          <div style={{
            position: "absolute", left: "64px", top: "var(--sp-108)", bottom: "var(--sp-108)",
            width: "1px", background: "rgba(111,135,156,0.15)",
          }} />

          <div style={{ paddingLeft: "40px" }}>
            <p className="caption" style={{ marginBottom: "var(--sp-40)" }}>
              What we do
            </p>
            <div className="heading" style={{ maxWidth: "900px", lineHeight: 1.13 }}>
              We don&apos;t just generate code.<br />
              We{" "}
              <strong style={{ fontWeight: 700, color: "var(--bone-white)" }}>
                plan, engineer, test
              </strong>{" "}
              and review it — using four specialized agents working in sequence, autonomously.
            </div>
          </div>

          {/* Bottom hairline */}
          <hr className="hairline" style={{ marginTop: "var(--sp-108)" }} />
        </section>
      )}

      {/* ── AGENTS INTRO — four-column editorial ─────────────────── */}
      {isIdle && (
        <section style={{ padding: "var(--sp-108) 64px", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--sp-72)", alignItems: "flex-end" }}>
            <div className="heading-sm" style={{ color: "var(--bone-white)" }}>
              Four agents.<br />
              <span style={{ color: "rgba(255,253,249,0.45)", fontStyle: "normal" }}>
                One mission.
              </span>
            </div>
            <p className="caption" style={{ textAlign: "right" }}>
              Sequential pipeline<br />autonomously orchestrated
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            borderTop: "1px solid rgba(111,135,156,0.25)",
          }}>
            {[
              { n: "01", name: "Planner",  desc: "Decomposes the problem into a precise sequence of executable implementation steps." },
              { n: "02", name: "Coder",    desc: "Translates the plan into production-quality implementation code, line by line." },
              { n: "03", name: "Tester",   desc: "Generates comprehensive test suites that validate correctness and catch edge cases." },
              { n: "04", name: "Reviewer", desc: "Audits code and tests with expert eyes, surfacing improvements and critical issues." },
            ].map((a, i) => (
              <div key={a.name} style={{
                padding: "32px 32px 32px 0",
                paddingLeft: i > 0 ? "32px" : 0,
                borderLeft: i > 0 ? "1px solid rgba(111,135,156,0.2)" : "none",
              }}>
                <p className="caption" style={{ marginBottom: "16px" }}>{a.n}</p>
                <p style={{
                  fontFamily: "var(--font-primary)", fontSize: "22px", fontWeight: 400,
                  color: "var(--bone-white)", letterSpacing: "-0.01em",
                  lineHeight: 1.2, marginBottom: "16px",
                }}>
                  {a.name}
                </p>
                <p className="body-lg" style={{ fontSize: "15px", lineHeight: 1.6 }}>
                  {a.desc}
                </p>
              </div>
            ))}
          </div>
          <hr className="hairline" style={{ marginTop: "var(--sp-108)" }} />
        </section>
      )}

      {/* ── TYPOGRAPHIC BREAK — "WE BUILD" ───────────────────────── */}
      {isIdle && (
        <section style={{
          padding: "var(--sp-108) 64px",
          display: "flex", flexDirection: "column", gap: "0",
          overflow: "hidden", position: "relative",
        }}>
          {/* Overflowing background type */}
          <div aria-hidden="true" style={{
            position: "absolute", right: "-20px", top: "-20px",
            fontFamily: "var(--font-primary)", fontSize: "clamp(200px, 30vw, 400px)",
            fontWeight: 700, lineHeight: 1, letterSpacing: "-0.05em",
            color: "rgba(111,135,156,0.05)", pointerEvents: "none",
            userSelect: "none", whiteSpace: "nowrap",
          }}>
            CODE
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "28px", flexWrap: "wrap", position: "relative" }}>
            {[
              { text: "We",        weight: 400, size: "clamp(60px, 9vw, 120px)" },
              { text: "engineer",  weight: 400, size: "clamp(44px, 6.5vw, 88px)", italic: true },
              { text: "software",  weight: 700, size: "clamp(60px, 9vw, 120px)" },
            ].map((w) => (
              <span key={w.text} style={{
                fontFamily: w.italic ? "var(--font-serif)" : "var(--font-primary)",
                fontStyle: w.italic ? "italic" : "normal",
                fontSize: w.size,
                fontWeight: w.weight,
                lineHeight: 1.0,
                letterSpacing: "-0.02em",
                color: "var(--bone-white)",
              }}>
                {w.text}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "28px", flexWrap: "wrap", marginTop: "4px" }}>
            {[
              { text: "autonomously.", weight: 400, size: "clamp(60px, 9vw, 120px)" },
            ].map((w) => (
              <span key={w.text} style={{
                fontFamily: "var(--font-primary)",
                fontSize: w.size, fontWeight: w.weight,
                lineHeight: 1.0, letterSpacing: "-0.02em",
                color: "rgba(255,253,249,0.35)",
              }}>
                {w.text}
              </span>
            ))}
          </div>

          <hr className="hairline" style={{ marginTop: "var(--sp-108)" }} />
        </section>
      )}

      {/* ── PROBLEM INPUT — full-bleed editorial ──────────────────── */}
      {!result && (
        <section style={{
          padding: "var(--sp-108) 64px",
          position: "relative", overflow: "hidden",
        }}>
          {/* Decorative corner index */}
          <p className="caption" style={{ marginBottom: "var(--sp-56)" }}>
            {String("→").padStart(1)} Submit the problem
          </p>

          {/* Display heading */}
          <div style={{ marginBottom: "var(--sp-64)" }}>
            <div style={{ overflow: "hidden" }}>
              <h2 className="display" style={{ lineHeight: 1.0 }}>Describe</h2>
            </div>
            <div style={{ overflow: "hidden" }}>
              <h2 style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic", fontWeight: 400,
                fontSize: "clamp(40px, 6vw, 82px)",
                lineHeight: 1.05, letterSpacing: "-0.02em",
                color: "rgba(255,253,249,0.5)",
              }}>
                the problem to solve.
              </h2>
            </div>
          </div>

          <div style={{ maxWidth: "860px" }}>
            <ProblemInput onSubmit={handleSubmit} isLoading={isLoading} />
          </div>

          <hr className="hairline" style={{ marginTop: "var(--sp-108)" }} />
        </section>
      )}

      {/* ── PIPELINE — dramatic live tracker ─────────────────────── */}
      {statusData && (
        <section style={{ padding: "var(--sp-108) 64px" }}>
          <AgentPipeline
            status={statusData.status}
            currentAgent={statusData.current_agent}
            completedSteps={statusData.completed_steps}
          />
          <hr className="hairline" style={{ marginTop: "var(--sp-108)" }} />
        </section>
      )}

      {/* ── ERROR ─────────────────────────────────────────────────── */}
      {error && (
        <section style={{ padding: "var(--sp-108) 64px" }}>
          <div style={{
            borderLeft: "2px solid var(--arterial-red)",
            paddingLeft: "40px",
          }}>
            <p className="caption" style={{ color: "var(--arterial-red)", marginBottom: "24px" }}>
              Pipeline Error
            </p>
            <p className="heading-sm" style={{ marginBottom: "20px" }}>Something went wrong.</p>
            <p className="body-lg" style={{ marginBottom: "40px" }}>{error}</p>
            <div>
              <p className="caption" style={{ marginBottom: "16px" }}>Common fixes</p>
              {[
                "Ensure GROQ_API_KEY is set in your .env file",
                "Make sure the backend is running on port 8000",
                "Check backend terminal for detailed error output",
              ].map((fix, i) => (
                <div key={i} style={{ display: "flex", gap: "16px", marginBottom: "8px" }}>
                  <span style={{ color: "rgba(255,253,249,0.3)", flexShrink: 0 }}>—</span>
                  <p className="body-lg" style={{ fontSize: "16px" }}>{fix}</p>
                </div>
              ))}
            </div>
          </div>
          <hr className="hairline" style={{ marginTop: "var(--sp-108)" }} />
        </section>
      )}

      {/* ── RESULTS ───────────────────────────────────────────────── */}
      {result && (
        <>
          {/* Stats — massive editorial numbers */}
          <section style={{
            padding: "var(--sp-108) 64px",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "var(--sp-72)" }}>
              <span className="red-dot" />
              <p className="caption">Pipeline complete</p>
            </div>

            <div style={{
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
              borderTop: "1px solid rgba(111,135,156,0.25)",
            }}>
              {[
                { label: "Plan Steps",   value: String(result.plan?.length ?? 0) },
                { label: "Code Lines",   value: String(result.code?.split("\n").length ?? 0) },
                { label: "Test Lines",   value: String(result.tests?.split("\n").length ?? 0) },
                { label: "Review",       value: `${Math.round((result.review?.length ?? 0) / 100) / 10}k` },
              ].map((s, i) => (
                <div key={s.label} style={{
                  paddingTop: "32px",
                  paddingRight: i < 3 ? "40px" : 0,
                  paddingLeft: i > 0 ? "40px" : 0,
                  borderLeft: i > 0 ? "1px solid rgba(111,135,156,0.2)" : "none",
                }}>
                  <p style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: "clamp(48px, 6vw, 80px)",
                    fontWeight: 400, lineHeight: 1.0, letterSpacing: "-0.03em",
                    color: "var(--bone-white)", marginBottom: "12px",
                  }}>
                    {s.value}
                  </p>
                  <p className="caption">{s.label}</p>
                </div>
              ))}
            </div>
            <hr className="hairline" style={{ marginTop: "var(--sp-108)" }} />
          </section>

          {/* Output panel */}
          <section style={{ padding: "0 64px var(--sp-108)" }}>
            <ResultPanel result={result} />
          </section>
        </>
      )}

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid rgba(111,135,156,0.25)",
        background: "rgba(30,35,40,0.4)",
        padding: "var(--sp-64) 64px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px",
      }}>
        <div>
          <p style={{
            fontFamily: "var(--font-primary)", fontSize: "16px", fontWeight: 400,
            color: "var(--bone-white)", marginBottom: "6px",
          }}>
            Autonomous<span style={{ color: "var(--arterial-red)", fontWeight: 700 }}>.</span>
          </p>
          <p className="caption">Multi-Agent Software Engineering System</p>
        </div>
        <div style={{ display: "flex", gap: "32px" }}>
          <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer"
            className="caption" style={{ color: "rgba(255,253,249,0.4)", textDecoration: "none", letterSpacing: "0.08em" }}>
            API Docs ↗
          </a>
          <a href="https://github.com/Tanvikorada/autonomous_agents" target="_blank" rel="noopener noreferrer"
            className="caption" style={{ color: "rgba(255,253,249,0.4)", textDecoration: "none", letterSpacing: "0.08em" }}>
            GitHub ↗
          </a>
        </div>
      </footer>

    </div>
  );
}
