"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EquityPoint } from "@/lib/metrics";
import { formatMoney } from "@/lib/format";
import { useCurrency } from "@/components/currency-provider";

export function EquityChart({ data }: { data: EquityPoint[] }) {
  const { moeda, rate } = useCurrency();
  const last = data.length ? data[data.length - 1].value : 0;
  const color = last >= 0 ? "#22c55e" : "#f43f5e";

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="i" hide />
        <YAxis
          width={56}
          tickFormatter={(v) => formatMoney(Number(v), { moeda, rate, compact: true })}
          tick={{ fill: "#8b8b94", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ stroke: "#26262b" }}
          contentStyle={{
            background: "#131316",
            border: "1px solid #26262b",
            borderRadius: 8,
            color: "#fafafa",
            fontSize: 12,
          }}
          formatter={(v) => [formatMoney(Number(v), { moeda, rate, signed: true }), "Acumulado"]}
          labelFormatter={() => ""}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill="url(#eq)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
