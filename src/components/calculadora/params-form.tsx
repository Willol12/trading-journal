"use client";

import type { SimParams } from "@/lib/simulator";
import { Field, NumInput, inputCls, num } from "./fields";

export interface ParamsFormState {
  nRuns: string;
  maxDays: string;
  skipDayProb: string; // % de dias sem setup
  seedMode: "fixo" | "aleatorio";
}

export function paramsDefault(): ParamsFormState {
  return { nRuns: "10000", maxDays: "120", skipDayProb: "20", seedMode: "fixo" };
}

export function paramsToSimParams(p: ParamsFormState): SimParams {
  return {
    nRuns: Math.max(100, Math.floor(num(p.nRuns, 10_000))),
    maxDays: Math.max(1, Math.floor(num(p.maxDays, 120))),
    skipDayProb: num(p.skipDayProb) / 100,
    tradesPerDay: 1,
    seed: p.seedMode === "fixo" ? 1 : (Date.now() % 2_147_483_647) + 1,
  };
}

export function ParamsForm({
  value,
  onChange,
}: {
  value: ParamsFormState;
  onChange: (v: ParamsFormState) => void;
}) {
  const set = (patch: Partial<ParamsFormState>) => onChange({ ...value, ...patch });
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Field label="Simulações">
        <select
          value={value.nRuns}
          onChange={(e) => set({ nRuns: e.target.value })}
          className={inputCls}
        >
          <option value="1000">1.000 (rápido)</option>
          <option value="5000">5.000</option>
          <option value="10000">10.000</option>
          <option value="25000">25.000 (preciso)</option>
        </select>
      </Field>
      <Field label="Máx. de dias">
        <NumInput value={value.maxDays} onChange={(v) => set({ maxDays: v })} />
      </Field>
      <Field label="Dias sem setup (%)">
        <NumInput value={value.skipDayProb} onChange={(v) => set({ skipDayProb: v })} />
      </Field>
      <Field label="Seed">
        <select
          value={value.seedMode}
          onChange={(e) => set({ seedMode: e.target.value as "fixo" | "aleatorio" })}
          className={inputCls}
        >
          <option value="fixo">Fixa (reproduzível)</option>
          <option value="aleatorio">Aleatória</option>
        </select>
      </Field>
    </div>
  );
}
