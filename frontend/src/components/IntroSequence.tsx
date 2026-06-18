"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  onComplete: () => void;
}

export default function IntroSequence({ onComplete }: Props) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Wait for the sequence to play, then unmount
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 1000); // Wait for fade out animation
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(10px)" }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="fixed top-0 left-0 w-[100vw] h-[100vh] z-[9999] flex flex-col items-center justify-center bg-[#030014] overflow-hidden m-0 p-0"
        >
          {/* Abstract Optical Lines drawing */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none"
          >
            <svg viewBox="0 0 100 100" className="w-[150vw] h-[150vh] text-purple-500" fill="none" stroke="currentColor" strokeWidth="0.1">
              {[...Array(20)].map((_, i) => (
                <motion.circle
                  key={i}
                  cx="50" cy="50" r={10 + i * 2}
                  initial={{ pathLength: 0, rotate: 0 }}
                  animate={{ pathLength: 1, rotate: 360 }}
                  transition={{ 
                    duration: 3, 
                    ease: "easeInOut",
                    delay: i * 0.05 
                  }}
                  style={{ transformOrigin: "50% 50%" }}
                />
              ))}
            </svg>
          </motion.div>

          <div className="relative z-10 flex flex-col items-center">
            {/* Logo Mark Reveal */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.5 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.5)] mb-8"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
            </motion.div>

            {/* Text Reveal with Glitch/Shiny Effect */}
            <motion.div className="overflow-hidden">
              <motion.h1 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 1 }}
                className="text-4xl md:text-6xl font-black tracking-tighter text-white"
              >
                SWARM <span className="text-purple-400">OS</span>
              </motion.h1>
            </motion.div>
            
            <motion.div className="overflow-hidden mt-4">
              <motion.p
                initial={{ y: 40 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 1.2 }}
                className="text-sm tracking-[0.3em] text-white/50 uppercase"
              >
                Initializing Neural Links
              </motion.p>
            </motion.div>

            {/* Loading Bar */}
            <motion.div 
              className="w-48 h-1 bg-white/10 rounded-full mt-12 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              <motion.div 
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut", delay: 1.5 }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
