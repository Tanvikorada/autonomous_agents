"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import AgentPipeline from "@/components/AgentPipeline";
import ResultPanel from "@/components/ResultPanel";
import ProblemInput from "@/components/ProblemInput";
import {
  startPipeline, getJobStatus, getJobResult,
  JobStatus, JobStatusResponse, PipelineResult,
} from "@/lib/api";

const POLL_INTERVAL_MS = 2000;
const TERMINAL_STATUSES: JobStatus[] = ["done", "error"];

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<JobStatusResponse | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cursorDotRef   = useRef<HTMLDivElement>(null);
  const cursorTrailRef = useRef<HTMLDivElement>(null);
  const shaderCanvasRef = useRef<HTMLCanvasElement>(null);
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);

  // ── WebGL Shader Background ──────────────────────────────────────────
  useEffect(() => {
    const canvas = shaderCanvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const vertSrc = `
      attribute vec2 position;
      varying vec2 v_uv;
      void main() {
        v_uv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;
    const fragSrc = `
      precision highp float;
      uniform float u_time;
      uniform vec2  u_resolution;
      uniform vec2  u_mouse;
      varying vec2  v_uv;
      void main() {
        vec2 uv    = v_uv;
        vec2 mouse = u_mouse / u_resolution;
        float n = sin(uv.x * 10.0 + u_time * 0.5) * cos(uv.y * 10.0 + u_time * 0.5);
        n += sin(uv.x * 20.0 - u_time * 0.8 + mouse.x * 5.0) * 0.5;
        vec3 c1 = vec3(0.0,  0.82, 1.0);
        vec3 c2 = vec3(0.29, 0.0,  0.88);
        vec3 col = mix(c1, c2, uv.y + n * 0.3);
        col *= sin(u_time * 0.2) * 0.1 + 0.9;
        float v = distance(uv, vec2(0.5));
        col *= 1.0 - v * 1.2;
        gl_FragColor = vec4(col * 0.15, 1.0);
      }
    `;

    const mkShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src); gl.compileShader(s); return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER,   vertSrc));
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

    const posLoc   = gl.getAttribLocation(prog, "position");
    const timeLoc  = gl.getUniformLocation(prog, "u_time");
    const resLoc   = gl.getUniformLocation(prog, "u_resolution");
    const mouseLoc = gl.getUniformLocation(prog, "u_mouse");

    let raf: number;
    const render = (t: number) => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(prog);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(timeLoc,   t * 0.001);
      gl.uniform2f(resLoc,    canvas.width, canvas.height);
      gl.uniform2f(mouseLoc,  mouseXRef.current, mouseYRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── Custom Cursor ────────────────────────────────────────────────────
  useEffect(() => {
    let trailX = 0, trailY = 0;
    let rafId: number;

    const onMove = (e: MouseEvent) => {
      mouseXRef.current = e.clientX;
      mouseYRef.current = e.clientY;
      if (cursorDotRef.current) {
        cursorDotRef.current.style.left = `${e.clientX}px`;
        cursorDotRef.current.style.top  = `${e.clientY}px`;
      }
      const card = document.getElementById("problem-card");
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mouse-x", `${((e.clientX - r.left) / r.width)  * 100}%`);
        card.style.setProperty("--mouse-y", `${((e.clientY - r.top)  / r.height) * 100}%`);
      }
    };

    const animateTrail = () => {
      trailX += (mouseXRef.current - trailX) * 0.15;
      trailY += (mouseYRef.current - trailY) * 0.15;
      if (cursorTrailRef.current) {
        cursorTrailRef.current.style.left = `${trailX}px`;
        cursorTrailRef.current.style.top  = `${trailY}px`;
      }
      rafId = requestAnimationFrame(animateTrail);
    };

    window.addEventListener("mousemove", onMove);
    rafId = requestAnimationFrame(animateTrail);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(rafId); };
  }, []);

  // ── Cursor hover effect ──────────────────────────────────────────────
  useEffect(() => {
    const trail = cursorTrailRef.current;
    if (!trail) return;
    const add    = () => trail.classList.add("hovering");
    const remove = () => trail.classList.remove("hovering");
    const els = document.querySelectorAll("button, a, textarea, .interactive-node");
    els.forEach(el => { el.addEventListener("mouseenter", add); el.addEventListener("mouseleave", remove); });
    return () => els.forEach(el => { el.removeEventListener("mouseenter", add); el.removeEventListener("mouseleave", remove); });
  });

  // ── Pipeline polling ─────────────────────────────────────────────────
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
          if (status.status === "done")  { const res = await getJobResult(id); setResult(res); }
          if (status.status === "error") setError(status.error || "An unknown error occurred.");
          setIsLoading(false);
        }
      } catch {
        setError("Lost connection to the backend."); stopPolling(); setIsLoading(false);
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

  const isIdle = !isLoading && !statusData && !result && !error;

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Outfit', sans-serif", color: "#e5e2e1" }}>

      {/* ── WebGL Background ── */}
      <canvas ref={shaderCanvasRef} style={{
        position: "fixed", top: 0, left: 0,
        width: "100%", height: "100%", zIndex: -2,
      }} />

      {/* ── Cursors ── */}
      <div ref={cursorDotRef}   className="custom-cursor-dot" />
      <div ref={cursorTrailRef} className="custom-cursor-trail" />

      {/* ── Navbar ── */}
      <nav style={{
        position: "sticky", top: 0, width: "100%", zIndex: 50,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 40px",
        background: "rgba(19,19,19,0.6)",
        backdropFilter: "blur(48px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 0 20px rgba(71,214,255,0.08)",
      }}>
        <div style={{
          fontFamily: "'Geist', monospace", color: "#b6ebff",
          fontSize: 16, fontWeight: 600, letterSpacing: "-0.04em",
        }}>
          AUTONOMOUS<span style={{ color: "#00d2ff" }}>_</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {[
            { label: "Workspace", active: true  },
            { label: "Agents",    active: false },
            { label: "Logs",      active: false },
          ].map(({ label, active }) => (
            <a key={label} href="#" style={{
              fontFamily: "'Outfit', sans-serif", fontSize: 16,
              color: active ? "#b6ebff" : "#bbc9cf",
              textDecoration: "none",
              borderBottom: active ? "2px solid #b6ebff" : "2px solid transparent",
              paddingBottom: 4,
              transition: "color 0.2s",
            }}>{label}</a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {["account_tree", "settings"].map(icon => (
            <button key={icon} style={{ background: "none", border: "none", color: "#bbc9cf", padding: 4, lineHeight: 1 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
            </button>
          ))}
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #47d6ff, #7900cd)",
            border: "1px solid rgba(255,255,255,0.1)",
          }} />
        </div>
      </nav>

      {/* ── Main Grid ── */}
      <main style={{
        maxWidth: 1400, margin: "0 auto",
        padding: "48px 40px",
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gap: 24,
        position: "relative",
      }}>

        {/* ── Hero ── */}
        <section className="stagger-1" style={{
          gridColumn: "1 / -1", textAlign: "center",
          marginBottom: 48, position: "relative",
        }}>
          {/* CSS orb */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 420, height: 420, zIndex: -1, pointerEvents: "none",
          }}>
            <div style={{
              width: "100%", height: "100%", borderRadius: "50%",
              border: "1px solid rgba(71,214,255,0.2)",
              boxShadow: "0 0 80px rgba(71,214,255,0.15), inset 0 0 80px rgba(71,214,255,0.05)",
              animation: "float 6s ease-in-out infinite",
            }} />
          </div>

          <h1 className="gradient-text" style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "clamp(36px, 7vw, 64px)",
            fontWeight: 800, lineHeight: 1.1,
            letterSpacing: "-0.04em", margin: 0,
          }}>
            Build Software. Without Coding.
          </h1>
          <p style={{
            maxWidth: 640, margin: "16px auto 0",
            fontSize: 16, lineHeight: 1.7, color: "#bbc9cf", opacity: 0.85,
          }}>
            Deploy a swarm of specialized autonomous agents to architect, synthesize, and audit your
            applications. Experience the next evolution of multi-agent software engineering.
          </p>
        </section>

        {/* ── Left Icon Sidebar ── */}
        <aside className="stagger-2" style={{
          gridColumn: "span 1",
          display: "flex", flexDirection: "column", gap: 12,
          position: "sticky", top: 96, alignSelf: "start",
        }}>
          {[
            { icon: "analytics",     active: true  },
            { icon: "memory",        active: false },
            { icon: "shield",        active: false },
            { icon: "rocket_launch", active: false },
          ].map(({ icon, active }) => (
            <div key={icon} className="glass-panel interactive-node" style={{
              width: 48, height: 48, borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: active ? "#ddb7ff" : "#bbc9cf",
              transition: "all 0.2s ease",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
            </div>
          ))}
        </aside>

        {/* ── Main Content Column ── */}
        <div className="stagger-3" style={{
          gridColumn: "span 8",
          display: "flex", flexDirection: "column", gap: 24,
        }}>
          {/* Problem Input */}
          <ProblemInput onSubmit={handleSubmit} isLoading={isLoading} />

          {/* Error panel */}
          {error && (
            <div className="glass-panel" style={{
              borderRadius: 12, padding: 24,
              borderLeft: "4px solid #ffb4ab",
            }}>
              <h3 style={{ color: "#ffb4ab", margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>
                System Fault
              </h3>
              <p style={{ margin: 0, color: "#bbc9cf", fontSize: 14 }}>{error}</p>
            </div>
          )}

          {/* Results panel (live) */}
          {result && <ResultPanel result={result} />}

          {/* Idle preview panel */}
          {isIdle && (
            <div className="glass-panel stagger-4" style={{
              borderRadius: 12, overflow: "hidden",
              display: "flex", flexDirection: "column", height: 560,
            }}>
              {/* Tab bar */}
              <div style={{
                display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)", overflowX: "auto",
              }}>
                {["Implementation Plan", "Generated Code", "Test Suite", "Audit Report"].map((tab, i) => (
                  <button key={tab} style={{
                    padding: "16px 20px", background: "transparent", border: "none",
                    borderBottom: `2px solid ${i === 0 ? "#b6ebff" : "transparent"}`,
                    color: i === 0 ? "#b6ebff" : "#bbc9cf",
                    fontSize: 13, fontFamily: "'Geist', monospace", fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}>{tab}</button>
                ))}
              </div>

              {/* Preview content */}
              <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {[
                    { n: "01", title: "Architectural Scaffolding",
                      desc: "Defining the core microservices architecture using Event-Driven Design patterns." },
                    { n: "02", title: "Schema Synthesis",
                      desc: "The Neural Synthesizer will generate schemas based on the requirements in your prompt." },
                  ].map(({ n, title, desc }) => (
                    <div key={n} style={{ display: "flex", gap: 16, opacity: 0.35 }}>
                      <div style={{ color: "#b6ebff", fontFamily: "'Geist', monospace", fontSize: 13, flexShrink: 0 }}>{n}</div>
                      <div>
                        <h4 style={{ color: "#e5e2e1", fontWeight: 700, margin: "0 0 6px", fontSize: 15 }}>{title}</h4>
                        <p style={{ color: "#bbc9cf", fontSize: 13, margin: 0, lineHeight: 1.6 }}>{desc}</p>
                      </div>
                    </div>
                  ))}

                  {/* Code preview block */}
                  <div style={{
                    background: "#0a0a0a", borderRadius: 8, padding: 24,
                    border: "1px solid rgba(255,255,255,0.06)", opacity: 0.3,
                    fontFamily: "'Geist', monospace", fontSize: 13, lineHeight: 1.7,
                  }}>
                    <div style={{ color: "#bbc9cf", marginBottom: 8 }}>{"// Submit a problem above to generate code"}</div>
                    <div>
                      <span style={{ color: "#ddb7ff" }}>interface </span>
                      <span style={{ color: "#a00034" }}>AutonomousAgent </span>
                      <span style={{ color: "#e5e2e1" }}>{"{"}</span>
                    </div>
                    <div style={{ paddingLeft: 20 }}>
                      {"id: "}<span style={{ color: "#ffb2b9" }}>string</span>{";"}
                    </div>
                    <div style={{ paddingLeft: 20 }}>
                      {"status: "}
                      <span style={{ color: "#00d2ff" }}>&apos;idle&apos;</span>
                      {" | "}
                      <span style={{ color: "#00d2ff" }}>&apos;active&apos;</span>
                      {" | "}
                      <span style={{ color: "#00d2ff" }}>&apos;done&apos;</span>
                      {";"}
                    </div>
                    <div><span style={{ color: "#e5e2e1" }}>{"}"}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Sidebar — Telemetry ── */}
        <div className="stagger-5" style={{
          gridColumn: "span 3",
          display: "flex", flexDirection: "column", gap: 24,
          position: "sticky", top: 96, alignSelf: "start",
        }}>
          <AgentPipeline
            status={statusData?.status ?? "pending"}
            currentAgent={statusData?.current_agent ?? null}
            completedSteps={statusData?.completed_steps ?? []}
            isIdle={isIdle}
          />

          {/* Resource monitor */}
          <div className="glass-panel" style={{ borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00d2ff", boxShadow: "0 0 8px #00d2ff", flexShrink: 0 }} />
              <span style={{ fontFamily: "'Geist', monospace", fontSize: 13, color: "#bbc9cf" }}>
                CPU: {isLoading ? "78%" : "12%"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7900cd", boxShadow: "0 0 8px #7900cd", flexShrink: 0 }} />
              <span style={{ fontFamily: "'Geist', monospace", fontSize: 13, color: "#bbc9cf" }}>
                Memory: {isLoading ? "2.1GB/4GB" : "0.4GB/4GB"}
              </span>
            </div>
            {jobId && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ddb7ff", boxShadow: "0 0 8px #ddb7ff", flexShrink: 0 }} />
                <span style={{ fontFamily: "'Geist', monospace", fontSize: 11, color: "#bbc9cf", wordBreak: "break-all" }}>
                  JOB: {jobId.slice(0, 8)}…
                </span>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* ── Mobile Footer ── */}
      <footer className="glass-panel" style={{
        display: "none",
        position: "fixed", bottom: 0, left: 0, width: "100%",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "12px 24px",
        justifyContent: "space-around", alignItems: "center", zIndex: 50,
      }}>
        {["dashboard", "rocket_launch", "history", "person"].map(icon => (
          <span key={icon} className="material-symbols-outlined" style={{ color: "#bbc9cf", fontSize: 24 }}>{icon}</span>
        ))}
      </footer>
    </div>
  );
}
