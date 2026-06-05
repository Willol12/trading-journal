"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GroupPL, RBucket } from "@/lib/metrics";
import { formatMoney } from "@/lib/format";
import { useCurrency } from "@/components/currency-provider";

const GREEN = "#22c55e";
const RED = "#f43f5e";

const tooltipStyle = {
  background: "#131316",
  border: "1px solid #26262b",
  borderRadius: 8,
  color: "#fafafa",
  fontSize: 12,
};
const AXIS = "#8b8b94";
const CURSOR = "#1e1e22";

// Barras horizontais (P&L por setup, por ativo)
export function HBarPL({ data }: { data: GroupPL[] }) {
  const { moeda, rate } = useCurrency();
  const height = Math.max(120, data.length * 38);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={110}
          tick={{ fill: AXIS, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: CURSOR }}
          contentStyle={tooltipStyle}
          formatter={(v) => [formatMoney(Number(v), { moeda, rate, signed: true }), "P&L"]}
        />
        <Bar dataKey="pl" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.pl >= 0 ? GREEN : RED} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Barras verticais (P&L por dia da semana, por horário)
export function VBarPL({ data }: { data: GroupPL[] }) {
  const { moeda, rate } = useCurrency();
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <XAxis
          dataKey="label"
          tick={{ fill: AXIS, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip
          cursor={{ fill: CURSOR }}
          contentStyle={tooltipStyle}
          formatter={(v) => [formatMoney(Number(v), { moeda, rate, signed: true }), "P&L"]}
        />
        <Bar dataKey="pl" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.pl >= 0 ? GREEN : RED} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Distribuição de R-múltiplos
export function RDistChart({ data }: { data: RBucket[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <XAxis
          dataKey="label"
          tick={{ fill: AXIS, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip
          cursor={{ fill: CURSOR }}
          contentStyle={tooltipStyle}
          formatter={(v) => [v, "Trades"]}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.isNegative ? RED : GREEN} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
