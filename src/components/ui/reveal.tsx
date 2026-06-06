"use client";

import { Children, isValidElement } from "react";
import { motion, useReducedMotion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

// Entrada suave (fade + slide-up) ao montar. Respeita prefers-reduced-motion.
export function Reveal({
  children,
  delay = 0,
  y = 12,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// Revela os filhos em cascata (stagger). Cada filho entra com um pequeno atraso.
export function Stagger({
  children,
  gap = 0.06,
  startDelay = 0,
  y = 12,
  className,
}: {
  children: React.ReactNode;
  gap?: number;
  startDelay?: number;
  y?: number;
  className?: string;
}) {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <div className={className}>
      {items.map((child, i) => (
        <Reveal key={i} delay={startDelay + i * gap} y={y}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
