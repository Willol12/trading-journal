"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { useCurrency } from "@/components/currency-provider";
import { formatMoney } from "@/lib/format";

export function Money({
  usd,
  signed,
  decimals,
  compact,
  className,
}: {
  usd: number;
  signed?: boolean;
  decimals?: number;
  compact?: boolean;
  className?: string;
}) {
  const { moeda, rate } = useCurrency();
  const text = formatMoney(usd, { moeda, rate, signed, decimals, compact });
  return <span className={className}>{text}</span>;
}

// Versão que "conta" do valor anterior até o novo (count-up), respeitando a moeda.
// Usada nos KPIs do dashboard. GPU-light; respeita prefers-reduced-motion.
export function AnimatedMoney({
  usd,
  signed,
  decimals,
  compact,
  className,
  duration = 0.9,
}: {
  usd: number;
  signed?: boolean;
  decimals?: number;
  compact?: boolean;
  className?: string;
  duration?: number;
}) {
  const { moeda, rate } = useCurrency();
  const reduced = useReducedMotion();
  const [v, setV] = useState(usd);
  const prev = useRef(usd);

  useEffect(() => {
    if (reduced) {
      setV(usd);
      prev.current = usd;
      return;
    }
    const controls = animate(prev.current, usd, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: setV,
    });
    prev.current = usd;
    return () => controls.stop();
  }, [usd, reduced, duration]);

  return (
    <span className={className}>
      {formatMoney(v, { moeda, rate, signed, decimals, compact })}
    </span>
  );
}
