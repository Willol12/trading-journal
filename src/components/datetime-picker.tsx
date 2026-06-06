"use client";

import { useState } from "react";

const MESES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const pad = (n: number) => String(n).padStart(2, "0");

function parseInitial(s?: string): Date {
  if (s) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

// Seletor de data/hora prático: Dia / Mês / Ano separados + hora.
// Escreve num input hidden no formato "YYYY-MM-DDTHH:mm" (o mesmo do datetime-local).
export function DateTimePicker({
  name,
  initial,
}: {
  name: string;
  initial?: string;
}) {
  const init = parseInitial(initial);
  const [dia, setDia] = useState(init.getDate());
  const [mes, setMes] = useState(init.getMonth()); // 0-11
  const [ano, setAno] = useState(init.getFullYear());
  const [hora, setHora] = useState(`${pad(init.getHours())}:${pad(init.getMinutes())}`);

  const anoAtual = new Date().getFullYear();
  const anos = [anoAtual - 2, anoAtual - 1, anoAtual, anoAtual + 1];

  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const diaClamped = Math.min(dia, diasNoMes);
  const [hh = "00", mm = "00"] = hora.split(":");
  const value = `${ano}-${pad(mes + 1)}-${pad(diaClamped)}T${hh}:${mm}`;

  const selCls =
    "h-9 min-w-0 rounded-lg border border-border bg-surface-2 px-2 text-sm text-fg outline-none focus:border-accent";

  return (
    <div className="flex gap-2">
      <select
        aria-label="Dia"
        value={diaClamped}
        onChange={(e) => setDia(Number(e.target.value))}
        className={`${selCls} flex-1`}
      >
        {Array.from({ length: diasNoMes }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <select
        aria-label="Mês"
        value={mes}
        onChange={(e) => setMes(Number(e.target.value))}
        className={`${selCls} flex-[1.3]`}
      >
        {MESES.map((m, i) => (
          <option key={i} value={i}>{m}</option>
        ))}
      </select>
      <select
        aria-label="Ano"
        value={ano}
        onChange={(e) => setAno(Number(e.target.value))}
        className={`${selCls} flex-[1.1]`}
      >
        {anos.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
      <input
        aria-label="Horário"
        type="time"
        value={hora}
        onChange={(e) => setHora(e.target.value)}
        className={`${selCls} flex-1`}
      />
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
