"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const COLORS = ["#22c55e", "#4f7cff", "#7c5cff", "#f59e0b", "#fafafa"];

// Partículas (confete) só em MOMENTO ESPECIAL — ex.: bateu a meta da mesa.
// Leve: ~20 partículas, dispara quando `fire` vira true, some sozinho.
export function Celebrate({ fire }: { fire: boolean }) {
  const reduced = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (fire && !reduced) {
      setShow(true);
      const t = setTimeout(() => setShow(false), 1700);
      return () => clearTimeout(t);
    }
  }, [fire, reduced]);

  if (!show) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute left-1/2 top-28">
        {Array.from({ length: 20 }).map((_, i) => {
          const dir = Math.random() > 0.5 ? 1 : -1;
          const x = dir * (40 + Math.random() * 260);
          const y = -60 - Math.random() * 200;
          return (
            <motion.span
              key={i}
              className="absolute h-2 w-2 rounded-[1px]"
              style={{ background: COLORS[i % COLORS.length] }}
              initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
              animate={{ opacity: 0, x, y, rotate: Math.random() * 540, scale: 0.5 }}
              transition={{ duration: 1.3 + Math.random() * 0.4, ease: "easeOut" }}
            />
          );
        })}
      </div>
    </div>
  );
}
