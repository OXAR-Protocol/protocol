"use client";

import { motion, AnimatePresence } from "framer-motion";

interface WaxSealProps {
  sealed: boolean;
}

export function WaxSeal({ sealed }: WaxSealProps) {
  return (
    <div className="relative w-[110px] h-[110px] flex items-center justify-center">
      {/* Empty placeholder ring */}
      <div
        className={`absolute inset-0 rounded-full border border-dashed transition-opacity duration-500 ${
          sealed ? "opacity-0" : "opacity-100 border-white/20"
        }`}
      >
        <div className="absolute inset-0 flex items-center justify-center font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">
          place seal
        </div>
      </div>

      <AnimatePresence>
        {sealed && (
          <>
            {/* Splash particles */}
            {[0, 72, 144, 216, 288].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const dx = Math.cos(rad) * 90;
              const dy = Math.sin(rad) * 90;
              return (
                <motion.span
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-[#A8222B]"
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{
                    x: dx,
                    y: dy,
                    opacity: [0, 1, 0],
                    scale: [0, 1.2, 0.4],
                  }}
                  transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
                />
              );
            })}

            {/* The seal itself */}
            <motion.div
              className="relative w-[104px] h-[104px]"
              initial={{ y: -180, rotate: -40, scale: 1.2, opacity: 0 }}
              animate={{
                y: 0,
                rotate: 0,
                scale: [1.2, 0.88, 1],
                opacity: 1,
              }}
              transition={{
                duration: 0.7,
                ease: [0.34, 1.26, 0.64, 1],
              }}
            >
              <svg viewBox="0 0 104 104" className="absolute inset-0 w-full h-full drop-shadow-[0_6px_14px_rgba(168,34,43,0.55)]">
                <defs>
                  <radialGradient id="seal-grad" cx="38%" cy="32%" r="75%">
                    <stop offset="0%" stopColor="#D4313C" />
                    <stop offset="55%" stopColor="#A8222B" />
                    <stop offset="100%" stopColor="#671116" />
                  </radialGradient>
                  <filter id="seal-noise">
                    <feTurbulence baseFrequency="0.9" numOctaves="2" />
                    <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.25 0" />
                    <feComposite in2="SourceGraphic" operator="in" />
                  </filter>
                </defs>
                <circle cx="52" cy="52" r="48" fill="url(#seal-grad)" />
                <circle cx="52" cy="52" r="48" fill="black" filter="url(#seal-noise)" opacity="0.4" />
                <circle cx="52" cy="52" r="44" fill="none" stroke="#F5D5A1" strokeWidth="0.6" opacity="0.65" />
                <circle cx="52" cy="52" r="40" fill="none" stroke="#F5D5A1" strokeWidth="0.3" opacity="0.4" />
              </svg>

              {/* OXAR brand mark embossed in gold — uses the real /images/white.svg
                  as a CSS mask, so the shape always matches the live logo asset. */}
              <div
                className="absolute top-1/2 left-1/2 w-[58px] h-[62px] pointer-events-none"
                style={{
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "#F5D5A1",
                  maskImage: "url(/images/white.svg)",
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskImage: "url(/images/white.svg)",
                  WebkitMaskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  opacity: 0.95,
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
