"use client";

import { motion } from "framer-motion";

const NODES = [
  { x: 150, y: 40 },
  { x: 270, y: 120 },
  { x: 230, y: 250 },
  { x: 70, y: 250 },
  { x: 30, y: 120 },
];

const ACTIVE = [0, 1, 4];
const CONNECTIONS = [
  [0, 1],
  [0, 4],
  [1, 4],
];

export function NodeVisualization() {
  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[300px] mx-auto">
      {CONNECTIONS.map(([from, to], i) => (
        <motion.line
          key={`line-${i}`}
          x1={NODES[from].x}
          y1={NODES[from].y}
          x2={NODES[to].x}
          y2={NODES[to].y}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 + i * 0.2 }}
        />
      ))}

      {CONNECTIONS.map(([from, to], i) => (
        <motion.line
          key={`glow-${i}`}
          x1={NODES[from].x}
          y1={NODES[from].y}
          x2={NODES[to].x}
          y2={NODES[to].y}
          stroke="rgba(114, 162, 240, 0.3)"
          strokeWidth="2"
          animate={{ opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 1 }}
        />
      ))}

      {NODES.map((node, i) => {
        const isActive = ACTIVE.includes(i);
        return (
          <g key={`node-${i}`}>
            {isActive && (
              <motion.circle
                cx={node.x}
                cy={node.y}
                r="16"
                fill="none"
                stroke="rgba(114, 162, 240, 0.2)"
                strokeWidth="1"
                animate={{ r: [16, 22, 16], opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
              />
            )}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="6"
              fill={isActive ? "white" : "rgba(255,255,255,0.15)"}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            />
          </g>
        );
      })}
    </svg>
  );
}
