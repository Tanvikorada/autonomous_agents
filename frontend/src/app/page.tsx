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

type ViewState = "Workspace" | "Agents" | "Logs";
interface Toast { id: number; message: string; exiting?: boolean }

function useRipple() {
  return (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const span = document.createElement("span");
    span.className = "ripple-span";
    span.style.width = span.style.height = `${size}px`;
    span.style.left = `${x}px`;
    span.style.top = `${y}px`;
    el.classList.add("ripple");
    el.appendChild(span);
    setTimeout(() => span.remove(), 600);
  };
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<JobStatusResponse | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [activeView, setActiveView] = useState<ViewState>("Workspace");
  const [showSettings, setShowSettings] = useState(false);
  const [showTree, setShowTree] = useState(false);
  
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);

  const cursorDotRef   = useRef<HTMLDivElement>(null);
  const cursorTrailRef = useRef<HTMLDivElement>(null);
  const shaderCanvasRef = useRef<HTMLCanvasElement>(null);
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);

  const triggerRipple = useRipple();

  const addToast = (msg: string) => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, message: msg }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, 3000);
  };

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
          addToast("Pipeline execution finished");
        }
      } catch {
        setError("Lost connection to the backend."); stopPolling(); setIsLoading(false);
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleSubmit = async (problem: string) => {
    setError(null); setResult(null); setStatusData(null); setJobId(null); setIsLoading(true);
    addToast("Initializing Neural Swarm Pipeline...");
    try {
      const { job_id } = await startPipeline(problem);
      setJobId(job_id);
      setStatusData({ job_id, status: "pending", current_agent: null, completed_steps: [], error: null });
      startPolling(job_id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start pipeline.");
      setIsLoading(false);
      addToast("Failed to initialize pipeline");
    }
  };

  const isIdle = !isLoading && !statusData && !result && !error;

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Outfit', sans-serif", color: "#e5e2e1" }}>
      <canvas ref={shaderCanvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: -2 }} />
      <div ref={cursorDotRef} className="custom-cursor-dot" />
      <div ref={cursorTrailRef} className="custom-cursor-trail" />

      {/* ── Toast Notifications ── */}
      <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column", gap: 12, zIndex: 1000 }}>
        {toasts.map(t => (
          <div key={t.id} className={t.exiting ? "toast-exit" : "toast-enter"} style={{
            background: "rgba(19, 19, 19, 0.9)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(71, 214, 255, 0.3)", borderRadius: 8,
            padding: "16px 24px", color: "#b6ebff", fontFamily: "'Geist', monospace",
            fontSize: 13, boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            display: "flex", alignItems: "center", gap: 12
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>notifications_active</span>
            {t.message}
          </div>
        ))}
      </div>

      {/* ── Drawers ── */}
      {showTree && (
        <div style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setShowTree(false)} />
          <div className="drawer-enter glass-panel" style={{ position: "relative", width: 360, height: "100%", borderLeft: "1px solid rgba(255,255,255,0.1)", padding: 24 }}>
            <h2 style={{ color: "#ddb7ff", fontFamily: "'Geist', monospace", fontSize: 18, marginTop: 0, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>Project Directory</h2>
            <div style={{ color: "#bbc9cf", fontFamily: "'Geist', monospace", fontSize: 13, marginTop: 16 }}>
              <div style={{ padding: "8px 0" }}>📁 root</div>
              <div style={{ padding: "8px 0", paddingLeft: 16 }}>📁 src</div>
              <div style={{ padding: "8px 0", paddingLeft: 32 }}>📄 index.ts</div>
              <div style={{ padding: "8px 0", paddingLeft: 32 }}>📄 utils.ts</div>
              <div style={{ padding: "8px 0", paddingLeft: 16 }}>📄 package.json</div>
            </div>
            <button className="shimmer-btn interactive-node" style={{ position: "absolute", bottom: 24, left: 24, right: 24, padding: "12px", borderRadius: 8, color: "#fff", border: "none", fontWeight: "bold" }} onClick={(e) => { triggerRipple(e); addToast("Syncing project tree..."); }}>Sync Now</button>
          </div>
        </div>
      )}

      {showSettings && (
        <div style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setShowSettings(false)} />
          <div className="drawer-enter glass-panel" style={{ position: "relative", width: 360, height: "100%", borderLeft: "1px solid rgba(255,255,255,0.1)", padding: 24 }}>
            <h2 style={{ color: "#b6ebff", fontFamily: "'Geist', monospace", fontSize: 18, marginTop: 0, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>System Settings</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
              {["Enable Debug Logs", "Auto-approve PRs", "Strict Mode"].map(setting => (
                <label key={setting} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#e5e2e1", fontSize: 14, cursor: "none" }}>
                  {setting}
                  <div style={{ width: 40, height: 20, background: "rgba(71, 214, 255, 0.2)", borderRadius: 10, position: "relative" }}>
                    <div style={{ width: 16, height: 16, background: "#47d6ff", borderRadius: "50%", position: "absolute", right: 2, top: 2 }} />
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Navbar ── */}
      <nav className="sticky top-0 w-full z-50 flex flex-wrap justify-between items-center px-4 md:px-10 py-4 border-b border-white/10 shadow-[0_0_20px_rgba(71,214,255,0.08)] bg-[#131313]/60 backdrop-blur-xl gap-4">
        <div className="glitch-hover" data-text="AUTONOMOUS_" style={{
          fontFamily: "'Geist', monospace", color: "#b6ebff", fontSize: 16, fontWeight: 600, letterSpacing: "-0.04em",
        }}>
          AUTONOMOUS<span style={{ color: "#00d2ff" }}>_</span>
        </div>

        <div className="flex items-center gap-4 md:gap-8 overflow-x-auto w-full md:w-auto order-3 md:order-2 pb-2 md:pb-0 hide-scrollbar">
          {(["Workspace", "Agents", "Logs"] as ViewState[]).map(view => (
            <button key={view} onClick={(e) => { triggerRipple(e); setActiveView(view); }} style={{
              background: "transparent", border: "none",
              fontFamily: "'Outfit', sans-serif", fontSize: 16,
              color: activeView === view ? "#b6ebff" : "#bbc9cf",
              borderBottom: activeView === view ? "2px solid #b6ebff" : "2px solid transparent",
              paddingBottom: 4, transition: "color 0.2s", whiteSpace: "nowrap"
            }}>
              {view}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 order-2 md:order-3">
          <button className="interactive-node" onClick={(e) => { triggerRipple(e); setShowTree(true); }} style={{ background: "none", border: "none", color: "#bbc9cf", padding: 4, lineHeight: 1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>account_tree</span>
          </button>
          <button className="interactive-node" onClick={(e) => { triggerRipple(e); setShowSettings(true); }} style={{ background: "none", border: "none", color: "#bbc9cf", padding: 4, lineHeight: 1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>settings</span>
          </button>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #47d6ff, #7900cd)",
            border: "1px solid rgba(255,255,255,0.1)",
          }} />
        </div>
      </nav>


      {/* ── Main Grid ── */}
      <main className="view-enter max-w-[1400px] mx-auto px-4 md:px-10 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-6 relative" key={activeView}>
        
        {/* Workspace View */}
        {activeView === "Workspace" && (
          <>
            <section className="stagger-1" style={{ gridColumn: "1 / -1", textAlign: "center", marginBottom: 48, position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 420, height: 420, zIndex: -1, pointerEvents: "none" }}>
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: "1px solid rgba(71,214,255,0.2)", boxShadow: "0 0 80px rgba(71,214,255,0.15), inset 0 0 80px rgba(71,214,255,0.05)", animation: "float 6s ease-in-out infinite" }} />
              </div>
              <h1 className="gradient-text" style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(36px, 7vw, 64px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.04em", margin: 0 }}>Build Software. Without Coding.</h1>
              <p style={{ maxWidth: 640, margin: "16px auto 0", fontSize: 16, lineHeight: 1.7, color: "#bbc9cf", opacity: 0.85 }}>Deploy a swarm of specialized autonomous agents to architect, synthesize, and audit your applications. Experience the next evolution of multi-agent software engineering.</p>
            </section>

            <aside className="stagger-2 col-span-1 hidden lg:flex flex-col gap-3 sticky top-32 self-start">
              {[
                { icon: "analytics",     action: "Analytics module" },
                { icon: "memory",        action: "Memory cache" },
                { icon: "shield",        action: "Security protocols" },
                { icon: "rocket_launch", action: "Deployment config" },
              ].map(({ icon, action }) => (
                <button key={icon} onClick={(e) => { triggerRipple(e); addToast(`Toggled ${action}`); }} className="glass-panel interactive-node" style={{
                  width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#bbc9cf", border: "none", transition: "all 0.2s ease"
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
                </button>
              ))}
            </aside>

            <div className="stagger-3 col-span-1 lg:col-span-8 flex flex-col gap-6">
              <ProblemInput onSubmit={handleSubmit} isLoading={isLoading} />
              {error && (
                <div className="glass-panel" style={{ borderRadius: 12, padding: 24, borderLeft: "4px solid #ffb4ab" }}>
                  <h3 style={{ color: "#ffb4ab", margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>System Fault</h3>
                  <p style={{ margin: 0, color: "#bbc9cf", fontSize: 14 }}>{error}</p>
                </div>
              )}
              {result && <ResultPanel result={result} />}
              {isIdle && (
                <div className="glass-panel stagger-4" style={{ borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", height: 560 }}>
                  <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", overflowX: "auto" }}>
                    {["Implementation Plan", "Generated Code", "Test Suite", "Audit Report"].map((tab, i) => (
                      <button key={tab} style={{ padding: "16px 20px", background: "transparent", border: "none", borderBottom: `2px solid ${i === 0 ? "#b6ebff" : "transparent"}`, color: i === 0 ? "#b6ebff" : "#bbc9cf", fontSize: 13, fontFamily: "'Geist', monospace", fontWeight: 500, whiteSpace: "nowrap" }}>{tab}</button>
                    ))}
                  </div>
                  <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                      <div style={{ background: "#0a0a0a", borderRadius: 8, padding: 24, border: "1px solid rgba(255,255,255,0.06)", opacity: 0.3, fontFamily: "'Geist', monospace", fontSize: 13, lineHeight: 1.7 }}>
                        <div style={{ color: "#bbc9cf", marginBottom: 8 }}>{"// Submit a problem above to generate code"}</div>
                        <div><span style={{ color: "#ddb7ff" }}>interface </span><span style={{ color: "#a00034" }}>AutonomousAgent </span><span style={{ color: "#e5e2e1" }}>{"{"}</span></div>
                        <div style={{ paddingLeft: 20 }}>{"id: "}<span style={{ color: "#ffb2b9" }}>string</span>{";"}</div>
                        <div style={{ paddingLeft: 20 }}>{"status: "}<span style={{ color: "#00d2ff" }}>'idle'</span>{" | "}<span style={{ color: "#00d2ff" }}>'active'</span>{" | "}<span style={{ color: "#00d2ff" }}>'done'</span>{";"}</div>
                        <div><span style={{ color: "#e5e2e1" }}>{"}"}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="stagger-5 col-span-1 lg:col-span-3 flex flex-col gap-6 lg:sticky top-32 self-start">
              <AgentPipeline status={statusData?.status ?? "pending"} currentAgent={statusData?.current_agent ?? null} completedSteps={statusData?.completed_steps ?? []} isIdle={isIdle} />
              <div className="glass-panel" style={{ borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00d2ff", boxShadow: "0 0 8px #00d2ff", flexShrink: 0 }} /><span style={{ fontFamily: "'Geist', monospace", fontSize: 13, color: "#bbc9cf" }}>CPU: {isLoading ? "78%" : "12%"}</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7900cd", boxShadow: "0 0 8px #7900cd", flexShrink: 0 }} /><span style={{ fontFamily: "'Geist', monospace", fontSize: 13, color: "#bbc9cf" }}>Memory: {isLoading ? "2.1GB/4GB" : "0.4GB/4GB"}</span></div>
                {jobId && <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ddb7ff", boxShadow: "0 0 8px #ddb7ff", flexShrink: 0 }} /><span style={{ fontFamily: "'Geist', monospace", fontSize: 11, color: "#bbc9cf", wordBreak: "break-all" }}>JOB: {jobId.slice(0, 8)}…</span></div>}
              </div>
            </div>
          </>
        )}

        {/* Agents View */}
        {activeView === "Agents" && (
          <div style={{ gridColumn: "1 / -1" }}>
            <h1 className="gradient-text stagger-1" style={{ fontSize: 32, fontWeight: 700, margin: "0 0 24px" }}>Configured Agents</h1>
            <div className="stagger-2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
              {["Cognitive Planner", "Neural Synthesizer", "Validation Matrix", "Security Auditor"].map((agent, i) => (
                <div key={agent} className="glass-panel" style={{ padding: 24, borderRadius: 12, position: "relative" }}>
                  <div style={{ position: "absolute", top: 12, right: 12, fontSize: 12, color: "#47d6ff", background: "rgba(71,214,255,0.1)", padding: "4px 8px", borderRadius: 4, fontFamily: "'Geist', monospace" }}>ONLINE</div>
                  <h3 style={{ color: "#ddb7ff", margin: "0 0 8px", fontSize: 18 }}>{agent}</h3>
                  <p style={{ color: "#bbc9cf", fontSize: 14, margin: "0 0 16px" }}>Model: GPT-4o Swarm Node 0{i + 1}</p>
                  <button className="interactive-node" onClick={(e) => { triggerRipple(e); addToast(`Re-calibrating ${agent}...`); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "8px 16px", borderRadius: 6, cursor: "none" }}>Re-calibrate</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs View */}
        {activeView === "Logs" && (
          <div style={{ gridColumn: "1 / -1", height: "calc(100vh - 200px)" }}>
            <h1 className="gradient-text stagger-1" style={{ fontSize: 32, fontWeight: 700, margin: "0 0 24px" }}>System Logs</h1>
            <div className="glass-panel stagger-2" style={{ height: "100%", borderRadius: 12, padding: 24, fontFamily: "'Geist', monospace", fontSize: 13, color: "#a5e7ff", overflowY: "auto" }}>
              <div style={{ opacity: 0.5, marginBottom: 12 }}>[SYSTEM] Swarm OS Initialized.</div>
              <div style={{ opacity: 0.5, marginBottom: 12 }}>[NETWORK] Establishing secure connection to local runtime... OK.</div>
              <div style={{ opacity: 0.5, marginBottom: 12 }}>[MODULES] 4/4 neural agents standing by.</div>
              <div style={{ opacity: 0.5, marginBottom: 12, color: "#ffd2d5" }}>[WARN] Cache hit ratio suboptimal (42%). Triggering gc.</div>
              <div style={{ opacity: 0.5 }}>[IDLE] Awaiting user instructions...</div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
