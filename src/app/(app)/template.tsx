"use client";

import { motion, useReducedMotion } from "motion/react";

// Transição suave a cada navegação entre telas autenticadas.
// template.tsx (≠ layout.tsx) re-monta a cada rota, então a animação dispara na troca.
export default function Template({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
