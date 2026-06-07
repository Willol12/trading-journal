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
const CURSOR = "rgba(255,255,255,0.04)";

// Defs de gradiente reutilizáveis (deixa as barras com profundidade).
function BarGradients() {
  return (
    <defs>
      {/* horizontais: mais brilho à direita */}
      <linearGradient id="hbarGreen" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={GREEN} stopOpacity={0.45} />
        <stop offset="100%" stopColor={GREEN} stopOpacity={1} />
      </linearGradient>
      <linearGradient id="hbarRed" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={RED} stopOpacity={0.45} />
        <stop offset="100%" stopColor={RED} stopOpacity={1} />
      </linearGradient>
      {/* verticais: mais brilho em cima */}
      <linearGradient id="vbarGreen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={GREEN} stopOpacity={1} />
        <stop offset="100%" stopColor={GREEN} stopOpacity={0.4} />
      </linearGradient>
      <linearGradient id="vbarRed" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={RED} stopOpacity={1} />
        <stop offset="100%" stopColor={RED} stopOpacity={0.4} />
      </linearGradient>
    </defs>
  );
}

function EmptyChart({ height = 200 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center text-xs text-muted"
      style={{ height }}
    >
      Sem dados no período.
    </div>
  );
}

// Barras horizontais (P&L por setup, por ativo)
export function HBarPL({ data }: { data: GroupPL[] }) {
  const { moeda, rate } = useCurrency();
  if (!data.length) return <EmptyChart height={140} />;
  const height = Math.max(120, data.length * 40);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }} barCategoryGap="22%">
        <BarGradients />
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
        <Bar dataKey="pl" radius={[0, 5, 5, 0]} isAnimationActive>
          {data.map((d, i) => (
            <Cell key={i} fill={d.pl >= 0 ? "url(#hbarGreen)" : "url(#hbarRed)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Barras verticais (P&L por dia da semana, por horário)
export function VBarPL({ data }: { data: GroupPL[] }) {
  const { moeda, rate } = useCurrency();
  if (!data.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }} barCategoryGap="22%">
        <BarGradients />
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
        <Bar dataKey="pl" radius={[5, 5, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.pl >= 0 ? "url(#vbarGreen)" : "url(#vbarRed)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Distribuição de R-múltiplos
export function RDistChart({ data }: { data: RBucket[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }} barCategoryGap="18%">
        <BarGradients />
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
        <Bar dataKey="count" radius={[5, 5, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.isNegative ? "url(#vbarRed)" : "url(#vbarGreen)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
