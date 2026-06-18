import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function IntroScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<"initial" | "booting" | "ready">("initial");
  const [logs, setLogs] = useState<string[]>([]);

  const bootLogs = [
    "SYS: Authenticating core...",
    "SYS: Mounting Planner Agent...",
    "SYS: Mounting Coder Agent...",
    "SYS: Mounting Tester Agent...",
    "SYS: Mounting Reviewer Agent...",
    "SYS: Establishing LLM handshake...",
    "OK: Dayos OS online."
  ];

  const handleStartBoot = () => {
    setStep("booting");
  };

  useEffect(() => {
    if (step === "booting") {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < bootLogs.length) {
          setLogs(prev => [...prev, bootLogs[currentIndex]]);
          currentIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setStep("ready");
            setTimeout(onComplete, 800);
          }, 600);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [step]);

  return (
    <motion.div 
      className="fixed inset-0 z-[100] bg-[var(--color-cosmic-void, #06051d)] flex items-center justify-center font-suisseintlmono overflow-hidden"
      exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-col items-center justify-center max-w-[600px] w-full px-[24px]">
        {step === "initial" && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartBoot}
            className="group relative px-[48px] py-[24px] bg-transparent border border-[var(--color-mist, #cad5e2)]/20 rounded-[100px] text-[var(--color-mist, #cad5e2)] hover:border-[var(--color-mint-pulse, #d1ffca)] hover:text-[var(--color-mint-pulse, #d1ffca)] transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-[var(--color-mint-pulse, #d1ffca)]/0 group-hover:bg-[var(--color-mint-pulse, #d1ffca)]/10 transition-colors"></div>
            <span className="relative z-10 text-[16px] tracking-[0.2em] uppercase font-bold">Initialize Dayos OS</span>
          </motion.button>
        )}

        {step !== "initial" && (
          <div className="w-full text-[14px] leading-[2] text-[var(--color-mint-pulse, #d1ffca)]">
            {logs.map((log, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={log.startsWith("OK:") ? "text-[var(--color-electric-yellow, #fff100)] mt-4 font-bold" : "opacity-80"}
              >
                {log}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
