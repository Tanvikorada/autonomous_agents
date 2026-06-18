"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import AgentPipeline from "@/components/AgentPipeline";
import ResultPanel from "@/components/ResultPanel";
import ProblemInput from "@/components/ProblemInput";
import {
  startPipeline, getJobStatus, getJobResult,
  JobStatus, JobStatusResponse, PipelineResult,
} from "@/lib/api";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

const POLL_INTERVAL_MS = 2000;
const TERMINAL_STATUSES: JobStatus[] = ["done", "error"];

type ViewState = "Workspace" | "Agents" | "Logs";
interface Toast { id: number; message: string; }

// Framer Motion Spring config
const springConfig = { type: "spring", stiffness: 400, damping: 25 } as const;
const buttonSpring = { type: "spring", stiffness: 500, damping: 15 } as const;

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

  // Scroll Parallax
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const titleY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const addToast = (msg: string) => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, message: msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
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
    <div style={{ minHeight: "100vh", fontFamily: "'Outfit', sans-serif", color: "#e5e2e1", overflowX: "hidden" }}>
      <motion.div style={{ y: bgY, position: "fixed", inset: 0, zIndex: -2 }}>
        <canvas ref={shaderCanvasRef} style={{ width: "100%", height: "100%" }} />
      </motion.div>
      <div ref={cursorDotRef} className="custom-cursor-dot" />
      <div ref={cursorTrailRef} className="custom-cursor-trail" />

      {/* ── Toast Notifications ── */}
      <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column", gap: 12, zIndex: 1000 }}>
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              style={{
                background: "rgba(19, 19, 19, 0.9)", backdropFilter: "blur(20px)",
                border: "1px solid rgba(71, 214, 255, 0.3)", borderRadius: 8,
                padding: "16px 24px", color: "#b6ebff", fontFamily: "'Geist', monospace",
                fontSize: 13, boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                display: "flex", alignItems: "center", gap: 12
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>notifications_active</span>
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Drawers ── */}
      <AnimatePresence>
        {showTree && (
          <div style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex", justifyContent: "flex-end" }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setShowTree(false)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="glass-panel" style={{ position: "relative", width: 360, height: "100%", borderLeft: "1px solid rgba(255,255,255,0.1)", padding: 24 }}
            >
              <h2 style={{ color: "#ddb7ff", fontFamily: "'Geist', monospace", fontSize: 18, marginTop: 0, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>Project Directory</h2>
              <div style={{ color: "#bbc9cf", fontFamily: "'Geist', monospace", fontSize: 13, marginTop: 16 }}>
                <div style={{ padding: "8px 0" }}>📁 root</div>
                <div style={{ padding: "8px 0", paddingLeft: 16 }}>📁 src</div>
                <div style={{ padding: "8px 0", paddingLeft: 32 }}>📄 index.ts</div>
                <div style={{ padding: "8px 0", paddingLeft: 32 }}>📄 utils.ts</div>
                <div style={{ padding: "8px 0", paddingLeft: 16 }}>📄 package.json</div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="shimmer-btn" style={{ position: "absolute", bottom: 24, left: 24, right: 24, padding: "12px", borderRadius: 8, color: "#fff", border: "none", fontWeight: "bold" }} onClick={(e) => { triggerRipple(e); addToast("Syncing project tree..."); }}>Sync Now</motion.button>
            </motion.div>
          </div>
        )}

        {showSettings && (
          <div style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex", justifyContent: "flex-end" }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setShowSettings(false)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="glass-panel" style={{ position: "relative", width: 360, height: "100%", borderLeft: "1px solid rgba(255,255,255,0.1)", padding: 24 }}
            >
              <h2 style={{ color: "#b6ebff", fontFamily: "'Geist', monospace", fontSize: 18, marginTop: 0, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>System Settings</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
                {["Enable Debug Logs", "Auto-approve PRs", "Strict Mode"].map(setting => (
                  <label key={setting} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#e5e2e1", fontSize: 14, cursor: "none" }}>
                    {setting}
                    <div style={{ width: 40, height: 20, background: "rgba(71, 214, 255, 0.2)", borderRadius: 10, position: "relative" }}>
                      <motion.div layout transition={springConfig as any} style={{ width: 16, height: 16, background: "#47d6ff", borderRadius: "50%", position: "absolute", right: 2, top: 2 }} />
                    </div>
                  </label>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 w-full z-50 flex flex-wrap justify-between items-center px-4 md:px-10 py-4 border-b border-white/10 shadow-[0_0_20px_rgba(71,214,255,0.08)] bg-[#131313]/60 backdrop-blur-xl gap-4">
        <motion.div whileHover={{ scale: 1.05 }} className="glitch-hover" data-text="AUTONOMOUS_" style={{ fontFamily: "'Geist', monospace", color: "#b6ebff", fontSize: 16, fontWeight: 600, letterSpacing: "-0.04em" }}>
          AUTONOMOUS<span style={{ color: "#00d2ff" }}>_</span>
        </motion.div>

        <div className="flex items-center gap-4 md:gap-8 overflow-x-auto w-full md:w-auto order-3 md:order-2 pb-2 md:pb-0 hide-scrollbar" style={{ position: "relative" }}>
          {(["Workspace", "Agents", "Logs"] as ViewState[]).map(view => (
            <motion.button key={view} onClick={(e) => { triggerRipple(e as any); setActiveView(view); }} style={{
              background: "transparent", border: "none", fontFamily: "'Outfit', sans-serif", fontSize: 16,
              color: activeView === view ? "#b6ebff" : "#bbc9cf", paddingBottom: 4, position: "relative", whiteSpace: "nowrap"
            }}>
              {view}
              {activeView === view && (
                <motion.div layoutId="nav-underline" style={{ position: "absolute", bottom: -2, left: 0, right: 0, height: 2, background: "#b6ebff" }} transition={springConfig as any} />
              )}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-4 order-2 md:order-3">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={(e) => { triggerRipple(e as any); setShowTree(true); }} style={{ background: "none", border: "none", color: "#bbc9cf", padding: 4, lineHeight: 1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>account_tree</span>
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={(e) => { triggerRipple(e as any); setShowSettings(true); }} style={{ background: "none", border: "none", color: "#bbc9cf", padding: 4, lineHeight: 1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>settings</span>
          </motion.button>
          <motion.div whileHover={{ scale: 1.1 }} style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #47d6ff, #7900cd)", border: "1px solid rgba(255,255,255,0.1)" }} />
        </div>
      </nav>

      {/* ── Main Grid ── */}
      <AnimatePresence mode="wait">
        <motion.main
          key={activeView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="max-w-[1400px] mx-auto px-4 md:px-10 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-6 relative"
        >
          {activeView === "Workspace" && (
            <>
              <section className="col-span-full text-center mb-12 relative">
                <motion.div style={{ y: useTransform(scrollYProgress, [0, 1], [0, 200]) }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] -z-10 pointer-events-none">
                  <div className="w-full h-full rounded-full border border-[rgba(71,214,255,0.2)] shadow-[0_0_80px_rgba(71,214,255,0.15),inset_0_0_80px_rgba(71,214,255,0.05)] animate-float" />
                </motion.div>
                
                {/* Kinetic Typography */}
                <motion.h1 style={{ y: titleY, opacity: titleOpacity }} className="gradient-text font-['Outfit'] font-extrabold text-[clamp(36px,7vw,64px)] leading-[1.1] tracking-[-0.04em] m-0">
                  {"Build Software. Without Coding.".split(" ").map((word, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, type: "spring", stiffness: 200, damping: 20 }}
                      style={{ display: "inline-block", marginRight: "0.25em" }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.85 }} transition={{ delay: 0.6 }} className="max-w-[640px] mx-auto mt-4 text-[16px] leading-[1.7] color-[#bbc9cf]">
                  Deploy a swarm of specialized autonomous agents to architect, synthesize, and audit your applications. Experience the next evolution of multi-agent software engineering.
                </motion.p>
              </section>

              <aside className="col-span-1 hidden lg:flex flex-col gap-3 sticky top-32 self-start">
                {[
                  { icon: "analytics",     action: "Analytics module" },
                  { icon: "memory",        action: "Memory cache" },
                  { icon: "shield",        action: "Security protocols" },
                  { icon: "rocket_launch", action: "Deployment config" },
                ].map(({ icon, action }, i) => (
                  <motion.button
                    key={icon}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.5, type: "spring", stiffness: 500, damping: 15 }}
                    whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { triggerRipple(e as any); addToast(`Toggled ${action}`); }}
                    className="glass-panel w-12 h-12 rounded-xl flex items-center justify-center text-[#bbc9cf] border-none"
                  >
                    <span className="material-symbols-outlined text-[22px]">{icon}</span>
                  </motion.button>
                ))}
              </aside>

              <motion.div layoutId="main-workspace-content" className="col-span-1 lg:col-span-8 flex flex-col gap-6">
                <ProblemInput onSubmit={handleSubmit} isLoading={isLoading} />
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-panel rounded-xl p-6 border-l-4 border-[#ffb4ab]">
                    <h3 className="text-[#ffb4ab] m-0 mb-2 text-[18px] font-bold">System Fault</h3>
                    <p className="m-0 text-[#bbc9cf] text-[14px]">{error}</p>
                  </motion.div>
                )}
                {result && <ResultPanel result={result} />}
                {isIdle && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="glass-panel rounded-xl overflow-hidden flex flex-col h-[560px]">
                    <div className="flex border-b border-white/10 bg-white/5 overflow-x-auto">
                      {["Implementation Plan", "Generated Code", "Test Suite", "Audit Report"].map((tab, i) => (
                        <button key={tab} className="px-5 py-4 bg-transparent border-none text-[13px] font-['Geist'] font-medium whitespace-nowrap" style={{ color: i === 0 ? "#b6ebff" : "#bbc9cf", borderBottom: `2px solid ${i === 0 ? "#b6ebff" : "transparent"}` }}>{tab}</button>
                      ))}
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto">
                      <div className="bg-[#0a0a0a] rounded-lg p-6 border border-white/5 opacity-30 font-['Geist'] text-[13px] leading-[1.7]">
                        <div className="text-[#bbc9cf] mb-2">{"// Submit a problem above to generate code"}</div>
                        <div><span className="text-[#ddb7ff]">interface </span><span className="text-[#a00034]">AutonomousAgent </span><span className="text-[#e5e2e1]">{"{"}</span></div>
                        <div className="pl-5">{"id: "}<span className="text-[#ffb2b9]">string</span>{";"}</div>
                        <div className="pl-5">{"status: "}<span className="text-[#00d2ff]">'idle'</span>{" | "}<span className="text-[#00d2ff]">'active'</span>{" | "}<span className="text-[#00d2ff]">'done'</span>{";"}</div>
                        <div><span className="text-[#e5e2e1]">{"}"}</span></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              <div className="col-span-1 lg:col-span-3 flex flex-col gap-6 lg:sticky top-32 self-start">
                <motion.div layoutId="agent-pipeline-container" style={{ width: "100%" }}>
                  <AgentPipeline status={statusData?.status ?? "pending"} currentAgent={statusData?.current_agent ?? null} completedSteps={statusData?.completed_steps ?? []} isIdle={isIdle} />
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1 }} className="glass-panel rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#00d2ff] shadow-[0_0_8px_#00d2ff]" /><span className="font-['Geist'] text-[13px] text-[#bbc9cf]">CPU: {isLoading ? "78%" : "12%"}</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#7900cd] shadow-[0_0_8px_#7900cd]" /><span className="font-['Geist'] text-[13px] text-[#bbc9cf]">Memory: {isLoading ? "2.1GB/4GB" : "0.4GB/4GB"}</span></div>
                  {jobId && <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ddb7ff] shadow-[0_0_8px_#ddb7ff]" /><span className="font-['Geist'] text-[11px] text-[#bbc9cf] break-all">JOB: {jobId.slice(0, 8)}…</span></div>}
                </motion.div>
              </div>
            </>
          )}

          {activeView === "Agents" && (
            <motion.div layoutId="agent-pipeline-container" className="col-span-full">
              <h1 className="gradient-text text-[32px] font-bold m-0 mb-6">Configured Agents</h1>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
                {["Cognitive Planner", "Neural Synthesizer", "Validation Matrix", "Security Auditor"].map((agent, i) => (
                  <motion.div
                    key={agent}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 20 }}
                    whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
                    className="glass-panel p-6 rounded-xl relative"
                  >
                    <div className="absolute top-3 right-3 text-[12px] text-[#47d6ff] bg-[rgba(71,214,255,0.1)] px-2 py-1 rounded font-['Geist']">ONLINE</div>
                    <h3 className="text-[#ddb7ff] m-0 mb-2 text-[18px]">{agent}</h3>
                    <p className="text-[#bbc9cf] text-[14px] m-0 mb-4">Model: GPT-4o Swarm Node 0{i + 1}</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => { triggerRipple(e as any); addToast(`Re-calibrating ${agent}...`); }}
                      className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-md cursor-none"
                    >
                      Re-calibrate
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeView === "Logs" && (
            <motion.div layoutId="main-workspace-content" className="col-span-full h-[calc(100vh-200px)]">
              <h1 className="gradient-text text-[32px] font-bold m-0 mb-6">System Logs</h1>
              <div className="glass-panel h-full rounded-xl p-6 font-['Geist'] text-[13px] text-[#a5e7ff] overflow-y-auto">
                <div className="opacity-50 mb-3">[SYSTEM] Swarm OS Initialized.</div>
                <div className="opacity-50 mb-3">[NETWORK] Establishing secure connection to local runtime... OK.</div>
                <div className="opacity-50 mb-3">[MODULES] 4/4 neural agents standing by.</div>
                <div className="opacity-50 mb-3 text-[#ffd2d5]">[WARN] Cache hit ratio suboptimal (42%). Triggering gc.</div>
                <div className="opacity-50">[IDLE] Awaiting user instructions...</div>
              </div>
            </motion.div>
          )}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
