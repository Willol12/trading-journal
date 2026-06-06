"use client";

import { motion, useReducedMotion } from "motion/react";

// Detalhe decorativo: uma curva de capital que se "desenha" ao carregar.
// Leve (SVG + Motion pathLength). Usado no painel de marca do login.
export function EquityCurveDeco({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const d =
    "M0,150 C50,142 80,118 130,126 C180,134 205,92 255,86 C305,80 335,44 400,18";

  return (
    <svg
      viewBox="0 0 400 170"
      className={className}
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="eqfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-profit)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--color-profit)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={`${d} L400,170 L0,170 Z`}
        fill="url(#eqfill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.7 }}
      />
      <motion.path
        d={d}
        stroke="var(--color-profit)"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
      />
    </svg>
  );
}
