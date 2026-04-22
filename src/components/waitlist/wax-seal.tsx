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
              <svg viewBox="0 0 104 104" className="w-full h-full drop-shadow-[0_6px_14px_rgba(168,34,43,0.55)]">
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

                {/* OXAR brand mark — embossed gold silhouette in the seal core */}
                <g transform="translate(31 30) scale(0.142)" fill="#F5D5A1" opacity="0.92">
                  <path d="M61 34.9998C70.6662 34.5653 77.192 35.0722 84.4688 36.4841C89.7906 37.4616 98.371 39.8505 103.476 41.8054C108.58 43.6518 116.726 47.6709 121.722 50.6033C126.718 53.6443 134.537 58.8574 139.099 62.3328C143.66 65.8082 151.914 72.6505 157.236 77.5378C162.558 82.4252 172.65 91.4574 189.919 108.292C182.858 113.617 122.59 221.118 114.879 224.92C106.842 228.938 97.7191 232.523 90.9854 234.26C83.0569 236.324 76.3227 237.302 66.0049 237.628C64.4678 237.691 62.365 237.97 61 238V201.525C62.3155 201.625 63.5599 201.681 64.6465 201.681C68.6667 201.681 75.5124 200.886 79.75 199.864C84.0963 198.842 92.5717 195.661 98.5479 192.707C104.524 189.639 113.326 184.186 118.106 180.437C122.887 176.802 130.927 169.758 136.034 164.873C141.141 159.988 148.856 152.035 153.202 147.263L161.134 138.63C134.404 111.364 122.561 100.116 117.562 96.2537C112.456 92.2775 104.416 86.9386 99.6348 84.4392C94.854 81.9399 87.2479 78.8722 82.793 77.7361C78.1207 76.4864 71.1664 75.5776 66.4941 75.6912C64.8445 75.6912 62.9267 75.8007 61 75.9841V34.9998Z" />
                  <path d="M244.5 297.649C234.836 298.132 228.308 297.659 221.024 296.284C215.698 295.333 207.105 292.987 201.991 291.057C196.877 289.237 188.711 285.259 183.701 282.352C178.69 279.336 170.844 274.163 166.265 270.71C161.686 267.258 153.398 260.456 148.051 255.595C142.705 250.735 131.853 241.747 114.5 225C121.532 219.643 181.976 111.843 189.668 108.003C197.684 103.944 206.789 100.314 213.514 98.5429C221.432 96.4395 228.161 95.4278 238.477 95.0502C240.014 94.9791 242.115 94.6888 243.48 94.652L243.663 131.127C242.347 131.034 241.103 130.983 240.016 130.988C235.996 131.008 229.154 131.839 224.922 132.882C220.581 133.927 212.122 137.15 206.16 140.134C200.2 143.231 191.426 148.729 186.664 152.502C181.901 156.161 173.896 163.245 168.814 168.155C163.732 173.066 156.057 181.057 151.735 185.851L143.847 194.525C170.713 221.656 182.613 232.843 187.631 236.681C192.757 240.631 200.824 245.93 205.617 248.406C210.411 250.881 218.032 253.909 222.493 255.023C227.171 256.249 234.13 257.123 238.802 256.986C240.451 256.978 242.369 256.86 244.294 256.667L244.5 297.649Z" />
                </g>

                <text
                  x="52"
                  y="86"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize="4.6"
                  letterSpacing="2"
                  fill="#F5D5A1"
                  opacity="0.7"
                >
                  OXAR PROTOCOL
                </text>
              </svg>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
