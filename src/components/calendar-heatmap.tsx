"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DayPL } from "@/lib/metrics";
import { Money } from "@/components/money";

const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"]; // Seg..Dom
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function CalendarHeatmap({
  days,
  year: initialYear,
  month: initialMonth, // 0-based
}: {
  days: DayPL[];
  year: number;
  month: number;
}) {
  const [cur, setCur] = useState({ y: initialYear, m: initialMonth });
  const { y: year, m: month } = cur;

  function shift(delta: number) {
    setCur((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  const byDate = new Map(days.map((d) => [d.date, d]));
  const maxAbs = Math.max(1, ...days.map((d) => Math.abs(d.pl)));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const startOffset = (firstDow + 6) % 7; // semana começa segunda

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function cellStyle(pl: number): React.CSSProperties {
    const intensity = 0.18 + 0.6 * Math.min(1, Math.abs(pl) / maxAbs);
    if (pl > 0) return { backgroundColor: `rgba(34,197,94,${intensity})` };
    if (pl < 0) return { backgroundColor: `rgba(244,63,94,${intensity})` };
    return {};
  }

  const navBtn =
    "flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface-2 text-muted transition-colors hover:border-accent hover:text-fg";

  return (
    <div>
      {/* Navegação de mês */}
      <div className="mb-3 flex items-center justify-between">
        <button type="button" aria-label="Mês anterior" onClick={() => shift(-1)} className={navBtn}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-fg">
          {MESES[month]} {year}
        </span>
        <button type="button" aria-label="Próximo mês" onClick={() => shift(1)} className={navBtn}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1.5 text-center text-[10px] text-muted">
        {WEEKDAYS.map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, idx) => {
          if (day === null) return <div key={idx} />;
          const key = `${year}-${pad(month + 1)}-${pad(day)}`;
          const entry = byDate.get(key);
          const pl = entry?.pl ?? 0;
          return (
            <div
              key={idx}
              className="relative flex aspect-square items-center justify-center rounded-md border border-border/60 bg-surface-2 p-1"
              style={entry ? cellStyle(pl) : undefined}
              title={
                entry
                  ? `${key}: ${pl >= 0 ? "+" : ""}US$ ${pl.toLocaleString("pt-BR")} · ${entry.trades} ${entry.trades === 1 ? "trade" : "trades"} · ${entry.contratos} contratos · ${entry.winRate}% win`
                  : key
              }
            >
              <span
                className={`absolute left-1 top-1 text-[10px] ${entry ? "font-medium text-white/75" : "text-muted"}`}
              >
                {day}
              </span>
              {entry && (
                <div className="flex flex-col items-center gap-0.5 leading-none">
                  <Money
                    usd={pl}
                    signed
                    compact
                    className="tabular text-xs font-semibold text-white"
                  />
                  <span className="tabular text-[9px] text-white/70">
                    {entry.winRate}% · {entry.contratos}c
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-muted">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-loss" /> Perda
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-surface-2 border border-border" /> Sem trade
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-profit" /> Ganho
        </span>
      </div>
    </div>
  );
}
