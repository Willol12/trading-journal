"use client";

import {
  Area,
  Bar,
  BarChart,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SimResult, RunOutcome } from "@/lib/simulator";
import { formatMoney, fmtPct } from "@/lib/format";
import { useCurrency } from "@/components/currency-provider";

const GREEN = "#22c55e";
const RED = "#f43f5e";
const ACCENT = "#4f7cff";
const GRAY = "#8b8b94";

const tooltipStyle = {
  background: "#131316",
  border: "1px solid #26262b",
  borderRadius: 8,
  color: "#fafafa",
  fontSize: 12,
};
const AXIS = "#8b8b94";
const CURSOR = "rgba(255,255,255,0.04)";

function EmptyChart({ height = 200 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center text-xs text-muted"
      style={{ height }}
    >
      Rode uma simulação pra ver o gráfico.
    </div>
  );
}

const outcomeColor: Record<RunOutcome, string> = {
  pass: GREEN,
  bust: RED,
  timeout: GRAY,
};

// Banda de percentis da curva de equity (p10–p90 + mediana) com algumas
// trajetórias reais sobrepostas e linhas de meta / piso inicial.
export function EquityBandChart({
  result,
  saldoInicial,
  metaProfit,
  maxDrawdown,
}: {
  result: SimResult | null;
  saldoInicial: number;
  metaProfit: number;
  maxDrawdown: number | null;
}) {
  const { moeda, rate } = useCurrency();
  if (!result || result.band.length === 0) return <EmptyChart height={260} />;

  const fmt = (v: number) => formatMoney(v, { moeda, rate, decimals: 0 });
  const paths = result.samplePaths.slice(0, 5);
  const data = result.band.map((b) => {
    const row: Record<string, number | number[] | undefined> = {
      day: b.day,
      p50: b.p50,
      range: [b.p10, b.p90],
    };
    paths.forEach((p, i) => {
      row[`path${i}`] = b.day < p.path.length ? p.path[b.day] : undefined;
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ left: 8, right: 16, top: 8 }}>
        <XAxis
          dataKey="day"
          tick={{ fill: AXIS, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          label={{ value: "dias", position: "insideBottomRight", fill: AXIS, fontSize: 10, dy: 6 }}
        />
        <YAxis
          tick={{ fill: AXIS, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={70}
          domain={["auto", "auto"]}
          tickFormatter={(v) => fmt(Number(v))}
        />
        <Tooltip
          cursor={{ fill: CURSOR }}
          contentStyle={tooltipStyle}
          labelFormatter={(d) => `Dia ${d}`}
          formatter={(value, name) => {
            if (name === "range" && Array.isArray(value)) {
              return [`${fmt(value[0])} – ${fmt(value[1])}`, "p10–p90"];
            }
            if (name === "p50") return [fmt(Number(value)), "Mediana"];
            return [fmt(Number(value)), "Trajetória"];
          }}
        />
        <Area
          dataKey="range"
          stroke="none"
          fill={ACCENT}
          fillOpacity={0.14}
          isAnimationActive={false}
        />
        {paths.map((p, i) => (
          <Line
            key={i}
            dataKey={`path${i}`}
            stroke={outcomeColor[p.outcome]}
            strokeWidth={1}
            strokeOpacity={0.4}
            dot={false}
            isAnimationActive={false}
          />
        ))}
        <Line
          dataKey="p50"
          stroke={ACCENT}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <ReferenceLine
          y={saldoInicial + metaProfit}
          stroke={GREEN}
          strokeDasharray="4 4"
          label={{ value: "Meta", fill: GREEN, fontSize: 10, position: "insideTopRight" }}
        />
        {maxDrawdown != null && (
          <ReferenceLine
            y={saldoInicial - maxDrawdown}
            stroke={RED}
            strokeDasharray="4 4"
            label={{ value: "Piso inicial", fill: RED, fontSize: 10, position: "insideBottomRight" }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// Histograma do equity final dos runs.
export function EquityHistChart({
  result,
  saldoInicial,
}: {
  result: SimResult | null;
  saldoInicial: number;
}) {
  const { moeda, rate } = useCurrency();
  if (!result || result.finalEquityHist.length === 0) return <EmptyChart />;

  const fmt = (v: number) => formatMoney(v, { moeda, rate, decimals: 0 });
  const data = result.finalEquityHist.map((b) => ({
    mid: (b.x0 + b.x1) / 2,
    x0: b.x0,
    x1: b.x1,
    pct: (b.count / result.nRuns) * 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }} barCategoryGap="8%">
        <XAxis
          dataKey="mid"
          tick={{ fill: AXIS, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          tickFormatter={(v) => fmt(Number(v))}
        />
        <YAxis hide />
        <Tooltip
          cursor={{ fill: CURSOR }}
          contentStyle={tooltipStyle}
          labelFormatter={() => ""}
          formatter={(v, _n, item) => {
            const p = item?.payload as { x0: number; x1: number } | undefined;
            return [
              `${fmtPct(Number(v), 1)} dos runs`,
              p ? `${fmt(p.x0)} a ${fmt(p.x1)}` : "",
            ];
          }}
        />
        <Bar dataKey="pct" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.x1 >= saldoInicial ? GREEN : RED} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Distribuição da maior sequência de perdas por run.
export function StreakChart({ result }: { result: SimResult | null }) {
  if (!result || result.maxLossStreak.dist.length === 0) return <EmptyChart height={180} />;
  const data = result.maxLossStreak.dist.map((d) => ({
    len: d.len,
    pct: (d.count / result.nRuns) * 100,
  }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }} barCategoryGap="14%">
        <XAxis
          dataKey="len"
          tick={{ fill: AXIS, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip
          cursor={{ fill: CURSOR }}
          contentStyle={tooltipStyle}
          labelFormatter={(l) => `${l} perdas seguidas`}
          formatter={(v) => [`${fmtPct(Number(v), 1)} dos runs`, "Frequência"]}
        />
        <Bar dataKey="pct" radius={[3, 3, 0, 0]} fill={RED} fillOpacity={0.75} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Aprovação / eliminação / sem resolução por cenário (comparador).
export function PassBustChart({
  data,
}: {
  data: { nome: string; pass: number; bust: number; timeout: number }[];
}) {
  if (data.length === 0) return <EmptyChart height={140} />;
  const height = Math.max(120, data.length * 48);
  const rows = data.map((d) => ({
    nome: d.nome,
    Aprovou: d.pass * 100,
    Eliminado: d.bust * 100,
    "Sem resolução": d.timeout * 100,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ left: 8, right: 16 }}
        barCategoryGap="28%"
      >
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fill: AXIS, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="nome"
          width={110}
          tick={{ fill: AXIS, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: CURSOR }}
          contentStyle={tooltipStyle}
          formatter={(v, name) => [fmtPct(Number(v), 1), name]}
        />
        <Bar dataKey="Aprovou" stackId="pct" fill={GREEN} fillOpacity={0.85} />
        <Bar dataKey="Eliminado" stackId="pct" fill={RED} fillOpacity={0.85} />
        <Bar
          dataKey="Sem resolução"
          stackId="pct"
          fill={GRAY}
          fillOpacity={0.4}
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
