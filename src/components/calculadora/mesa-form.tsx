"use client";

import { Button } from "@/components/ui/button";
import { PROP_FIRMS, type MesaTemplate, type TipoDrawdown } from "@/lib/propFirms";
import type { SimMesaRules } from "@/lib/simulator";
import type { MesaPrefill } from "./types";
import { Field, NumInput, Toggle, inputCls, num } from "./fields";

export interface MesaFormState {
  presetId: string; // "firmKey:tamanho" | "conta" | "custom"
  saldoInicial: string;
  metaProfit: string;
  maxDrawdown: string;
  tipoDrawdown: string;
  limitePerdaDiario: string; // "" = sem limite
  limiteDiarioElimina: boolean;
  consistenciaPct: string; // "" = sem regra
  minDiasTrade: string;
  custoAvaliacaoUsd: string;
}

const s = (n: number | null | undefined) => (n == null ? "" : String(n));

interface PresetOption {
  id: string;
  label: string;
  tpl: MesaTemplate;
}

const PRESETS: PresetOption[] = PROP_FIRMS.flatMap((f) =>
  f.planos.map((p) => ({
    id: `${f.key}:${p.tamanho}`,
    label: `${f.nome} · ${p.tamanho}`,
    tpl: p,
  })),
);

function fromTemplate(presetId: string, t: MesaTemplate): MesaFormState {
  return {
    presetId,
    saldoInicial: s(t.saldoInicial),
    metaProfit: s(t.metaProfit),
    maxDrawdown: s(t.maxDrawdown),
    tipoDrawdown: t.tipoDrawdown,
    limitePerdaDiario: s(t.limitePerdaDiario),
    limiteDiarioElimina: true,
    consistenciaPct: s(t.consistenciaPct),
    minDiasTrade: s(t.minDiasTrade),
    custoAvaliacaoUsd: "",
  };
}

export function mesaDefault(prefill?: MesaPrefill | null): MesaFormState {
  if (prefill && prefill.saldoInicial > 0 && prefill.metaProfit) {
    return {
      presetId: "conta",
      saldoInicial: s(prefill.saldoInicial),
      metaProfit: s(prefill.metaProfit),
      maxDrawdown: s(prefill.maxDrawdown),
      tipoDrawdown: prefill.tipoDrawdown,
      limitePerdaDiario: s(prefill.limitePerdaDiario),
      limiteDiarioElimina: true,
      consistenciaPct: s(prefill.consistenciaPct),
      minDiasTrade: s(prefill.minDiasTrade),
      custoAvaliacaoUsd: "",
    };
  }
  const lucid25 = PRESETS.find((p) => p.id === "lucid:25k") ?? PRESETS[0];
  return fromTemplate(lucid25.id, lucid25.tpl);
}

/** Converte o form em regras do simulador; null se inválido. */
export function mesaToRules(m: MesaFormState): SimMesaRules | null {
  const saldo = num(m.saldoInicial);
  const meta = num(m.metaProfit);
  if (saldo <= 0 || meta <= 0) return null;
  const opt = (v: string) => (v.trim() === "" ? null : num(v));
  return {
    saldoInicial: saldo,
    metaProfit: meta,
    maxDrawdown: opt(m.maxDrawdown),
    tipoDrawdown: (m.tipoDrawdown || "eod") as TipoDrawdown,
    limitePerdaDiario: opt(m.limitePerdaDiario),
    limiteDiarioElimina: m.limiteDiarioElimina,
    consistenciaPct: opt(m.consistenciaPct),
    minDiasTrade:
      m.minDiasTrade.trim() === "" ? null : Math.floor(num(m.minDiasTrade)),
    custoAvaliacaoUsd: opt(m.custoAvaliacaoUsd),
  };
}

export function MesaForm({
  value,
  onChange,
  prefill,
  contaNome,
}: {
  value: MesaFormState;
  onChange: (v: MesaFormState) => void;
  prefill?: MesaPrefill | null;
  contaNome?: string | null;
}) {
  const set = (patch: Partial<MesaFormState>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Mesa / plano" className="min-w-52 flex-1">
          <select
            value={value.presetId}
            onChange={(e) => {
              const id = e.target.value;
              const preset = PRESETS.find((p) => p.id === id);
              if (preset) onChange(fromTemplate(id, preset.tpl));
              else set({ presetId: id });
            }}
            className={inputCls}
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
            <option value="custom">Personalizada</option>
            {value.presetId === "conta" && (
              <option value="conta">Minha conta{contaNome ? ` (${contaNome})` : ""}</option>
            )}
          </select>
        </Field>
        {prefill && prefill.metaProfit != null && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onChange(mesaDefault(prefill))}
          >
            Usar minha conta{contaNome ? ` (${contaNome})` : ""}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Saldo inicial (US$)">
          <NumInput value={value.saldoInicial} onChange={(v) => set({ saldoInicial: v, presetId: "custom" })} />
        </Field>
        <Field label="Meta de lucro (US$)">
          <NumInput value={value.metaProfit} onChange={(v) => set({ metaProfit: v, presetId: "custom" })} />
        </Field>
        <Field label="Max drawdown (US$)">
          <NumInput value={value.maxDrawdown} onChange={(v) => set({ maxDrawdown: v, presetId: "custom" })} placeholder="vazio = sem" />
        </Field>
        <Field label="Tipo de drawdown">
          <select
            value={value.tipoDrawdown}
            onChange={(e) => set({ tipoDrawdown: e.target.value, presetId: "custom" })}
            className={inputCls}
          >
            <option value="eod">Trailing EOD (fim do dia)</option>
            <option value="trailing">Trailing intradiário</option>
            <option value="intraday">Intraday</option>
            <option value="static">Estático</option>
          </select>
        </Field>
        <Field label="Limite de perda diário (US$)">
          <NumInput value={value.limitePerdaDiario} onChange={(v) => set({ limitePerdaDiario: v, presetId: "custom" })} placeholder="vazio = sem" />
        </Field>
        <Field label="Consistência (%)">
          <NumInput value={value.consistenciaPct} onChange={(v) => set({ consistenciaPct: v, presetId: "custom" })} placeholder="vazio = sem" />
        </Field>
        <Field label="Mín. dias de trade">
          <NumInput value={value.minDiasTrade} onChange={(v) => set({ minDiasTrade: v, presetId: "custom" })} placeholder="vazio = sem" />
        </Field>
        <Field label="Custo da avaliação (US$)">
          <NumInput value={value.custoAvaliacaoUsd} onChange={(v) => set({ custoAvaliacaoUsd: v })} placeholder="opcional" />
        </Field>
      </div>

      {value.limitePerdaDiario.trim() !== "" && (
        <Toggle
          checked={value.limiteDiarioElimina}
          onChange={(v) => set({ limiteDiarioElimina: v })}
          label="Estourar o limite diário REPROVA (desmarcado: só encerra o dia)"
        />
      )}
    </div>
  );
}
