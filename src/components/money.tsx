"use client";

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
