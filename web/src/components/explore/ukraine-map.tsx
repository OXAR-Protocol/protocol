"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

import { UKRAINE_DOTS, UKRAINE_VIEWBOX } from "@/lib/ukraine-dots";
import { BOND_CITIES, getBondCity } from "@/lib/bond-cities";
import { getBondColor } from "@/lib/bond-constants";
import { VAULT_CONFIGS } from "@oxar/sdk";

interface UkraineMapProps {
  selectedId: string;
  onPinClick?: (id: string) => void;
}

const ZOOM = 1.25;
const { width: W, height: H } = UKRAINE_VIEWBOX;

export function UkraineMap({ selectedId, onPinClick }: UkraineMapProps) {
  const activeCity = getBondCity(selectedId);
  const activeConfig = VAULT_CONFIGS.find((c) => c.id === selectedId);
  const activeColor = activeConfig
    ? getBondColor(activeConfig.denomination).color
    : "rgba(255,255,255,0.8)";
  const activeRgb = activeConfig
    ? getBondColor(activeConfig.denomination).rgb
    : "255,255,255";

  const transform = useMemo(() => {
    if (!activeCity) return { x: 0, y: 0, scale: 1 };
    const targetX = W / 2 - activeCity.x * ZOOM;
    const targetY = H / 2 - activeCity.y * ZOOM;
    return { x: targetX, y: targetY, scale: ZOOM };
  }, [activeCity]);

  return (
    <div className="relative w-full aspect-[1000/600]">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="map-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={`rgba(${activeRgb},0.12)`} />
            <stop offset="70%" stopColor={`rgba(${activeRgb},0)`} />
          </radialGradient>
        </defs>

        <motion.g
          animate={transform}
          transition={{ duration: 1.1, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ transformOrigin: "0 0" }}
        >
          <g style={{ pointerEvents: "none" }}>
            {UKRAINE_DOTS.map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={1.8}
                fill="rgba(255,255,255,0.28)"
              />
            ))}

            {activeCity && (
              <circle
                cx={activeCity.x}
                cy={activeCity.y}
                r={130}
                fill="url(#map-glow)"
              />
            )}
          </g>

          {BOND_CITIES.map((city) => {
            const isActive = city.id === selectedId;
            const config = VAULT_CONFIGS.find((c) => c.id === city.id);
            if (!config) return null;
            const { color, rgb } = getBondColor(config.denomination);

            return (
              <g
                key={city.id}
                onClick={() => onPinClick?.(city.id)}
                style={{ cursor: onPinClick ? "pointer" : "default" }}
              >
                {isActive && (
                  <>
                    <motion.circle
                      cx={city.x}
                      cy={city.y}
                      r={22}
                      fill="none"
                      stroke={color}
                      strokeWidth={1.5}
                      initial={{ scale: 0.4, opacity: 0.9 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                      style={{
                        transformOrigin: `${city.x}px ${city.y}px`,
                        pointerEvents: "none",
                      }}
                    />
                    <circle
                      cx={city.x}
                      cy={city.y}
                      r={16}
                      fill="none"
                      stroke={color}
                      strokeWidth={1}
                      opacity={0.4}
                      style={{ pointerEvents: "none" }}
                    />
                  </>
                )}
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={22}
                  fill="transparent"
                />
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={isActive ? 6 : 4}
                  fill={isActive ? color : `rgba(${rgb},0.6)`}
                  style={{ pointerEvents: "none" }}
                />
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={isActive ? 2.5 : 1.5}
                  fill="#000000"
                  opacity={isActive ? 1 : 0}
                  style={{ pointerEvents: "none" }}
                />
              </g>
            );
          })}
        </motion.g>
      </svg>

      {activeCity && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: activeColor }}
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/60">
              {activeCity.name}, Ukraine
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/20">
            {activeCity.lat.toFixed(2)}°N {activeCity.lng.toFixed(2)}°E
          </span>
        </div>
      )}
    </div>
  );
}
