"use client";

import { useState, useRef, MouseEvent } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface Props {
  onSubmit: (problem: string) => void;
  isLoading: boolean;
}

export default function ProblemInput({ onSubmit, isLoading }: Props) {
  const [problem, setProblem] = useState("");
  
  // Magnetic Button Logic
  const buttonRef = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const center = { x: left + width / 2, y: top + height / 2 };
    const distance = { x: e.clientX - center.x, y: e.clientY - center.y };
    x.set(distance.x * 0.2); // Magnetic pull strength
    y.set(distance.y * 0.2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (problem.trim().length >= 10) onSubmit(problem.trim());
  };

  const canSubmit = !isLoading && problem.trim().length >= 10;

  return (
    <div className="magic-border-container shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      <form onSubmit={handleSubmit} className="magic-border-content p-6 flex flex-col gap-4">
        
        <div className="flex flex-col gap-1.5 z-10">
          <label className="text-sm font-semibold tracking-wide text-white/90 uppercase text-xs tracking-widest">What are we building today?</label>
          <p className="text-xs text-white/60">
            Tell the team what you need. They will handle the architecture, code, and testing.
          </p>
        </div>
        
        <div className="relative z-10">
          <textarea
            value={problem}
            onChange={e => setProblem(e.target.value)}
            disabled={isLoading}
            placeholder="Hey team, I need a Python trading bot that connects to the Binance API..."
            rows={5}
            className="w-full bg-transparent border-none text-white/90 placeholder:text-white/30 focus:outline-none resize-none text-[16px] leading-relaxed"
          />
        </div>
        
        <div className="flex justify-between items-center mt-2 z-10">
          <span className="text-[10px] font-mono tracking-wider text-white/30 uppercase">
            {problem.length < 10 ? `[ ERR: MIN_CHARS ${10 - problem.length} ]` : "[ SYSTEM: READY ]"}
          </span>
          
          <motion.button
            ref={buttonRef}
            type="submit"
            disabled={!canSubmit}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ x: mouseX, y: mouseY }}
            className="magic-btn min-w-[160px]"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deploying...
              </>
            ) : (
              <>
                Deploy Swarm
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
