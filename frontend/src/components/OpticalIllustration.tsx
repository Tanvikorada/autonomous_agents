"use client";

import { motion } from "framer-motion";

export default function OpticalIllustration() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-[0.15]">
      {/* Mesh Gradient Orbs defined in globals.css */}
      <div className="mesh-bg">
        <div className="mesh-orb-1"></div>
        <div className="mesh-orb-2"></div>
        <div className="mesh-orb-3"></div>
      </div>
      
      {/* SVG Optical Wave */}
      <svg 
        className="absolute w-full h-full text-purple-500/20" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0,50 Q25,25 50,50 T100,50"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: 1,
            d: ["M0,50 Q25,25 50,50 T100,50", "M0,50 Q25,75 50,50 T100,50", "M0,50 Q25,25 50,50 T100,50"]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        <motion.path
          d="M0,60 Q25,35 50,60 T100,60"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: 1,
            d: ["M0,60 Q25,35 50,60 T100,60", "M0,60 Q25,85 50,60 T100,60", "M0,60 Q25,35 50,60 T100,60"]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
        <motion.path
          d="M0,40 Q25,15 50,40 T100,40"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: 1,
            d: ["M0,40 Q25,15 50,40 T100,40", "M0,40 Q25,65 50,40 T100,40", "M0,40 Q25,15 50,40 T100,40"]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
      </svg>
      
      {/* Grid overlay for depth */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 80%)"
        }}
      />
    </div>
  );
}
