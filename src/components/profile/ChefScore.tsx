"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface ChefScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

function scoreColor(s: number) {
  if (s >= 90) return "#27AE60";
  if (s >= 75) return "#E67E22";
  if (s >= 60) return "#F39C12";
  return "#95A5A6";
}

function scoreLabel(s: number) {
  if (s >= 90) return "Master Chef";
  if (s >= 75) return "Expert";
  if (s >= 60) return "Skilled";
  return "Rising";
}

export default function ChefScore({ score, size = "md", showLabel = true }: ChefScoreProps) {
  const r = size === "lg" ? 36 : size === "md" ? 26 : 18;
  const stroke = size === "lg" ? 5 : 4;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);
  const svgSize = (r + stroke) * 2 + 4;
  const c = svgSize / 2;

  return (
    <motion.div whileHover={{ scale: 1.08 }} className="flex flex-col items-center gap-1">
      <div
        className="relative flex items-center justify-center"
        style={{ width: svgSize, height: svgSize }}
      >
        <svg
          width={svgSize} height={svgSize}
          className="absolute inset-0 -rotate-90"
          viewBox={`0 0 ${svgSize} ${svgSize}`}
        >
          <circle cx={c} cy={c} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
          <motion.circle
            cx={c} cy={c} r={r} fill="none" stroke={color}
            strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
        <div className="relative z-10 flex flex-col items-center">
          {size !== "sm" && <Flame size={size === "lg" ? 14 : 10} className="mb-0.5" style={{ color }} />}
          <span
            className={`font-bold leading-none ${size === "lg" ? "text-2xl" : size === "md" ? "text-base" : "text-xs"}`}
            style={{ color }}
          >
            {score}
          </span>
        </div>
      </div>
      {showLabel && (
        <div className="text-center">
          <p className="text-xs font-semibold" style={{ color }}>{scoreLabel(score)}</p>
          {size !== "sm" && <p className="text-xs text-muted">Chef Score</p>}
        </div>
      )}
    </motion.div>
  );
}
