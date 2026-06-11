"use client";

import { ATM_PRESETS, MNQ, type TradeModel } from "@/lib/simulator";
import { fmtMoney, fmtNumber, fmtPct } from "@/lib/format";
import type { JournalData } from "./types";
import { Field, NumInput, Toggle, inputCls, num } from "./fields";

export interface ModelFormState {
  kind: "parametric" | "bootstrap";
  atmKey: string; // "1x3" | "1x2" | "1x1" | "custom"
  stopTicks: string;
  targetTicks: string;
  contratos: string;
  winRate: string; // %
  beRate: string; // %
  comissao: string;
  slippageOn: boolean;
  slippageProb: string; // %
  slippageTicks: string;
  bayesOn: boolean;
  bayesWins: string;
  bayesLosses: string;
  blockOn: boolean;
  scale: string;
}

export function modelDefault(atmKey = "1x3", winRate = "40"): ModelFormState {
  const atm = ATM_PRESETS.find((a) => a.key === atmKey) ?? ATM_PRESETS[0];
  return {
    kind: "parametric",
    atmKey: atm.key,
    stopTicks: String(atm.stopTicks),
    targetTicks: String(atm.targetTicks),
    contratos: "1",
    winRate,
    beRate: "0",
    comissao: "1.50",
    slippageOn: false,
    slippageProb: "10",
    slippageTicks: "8",
    bayesOn: false,
    bayesWins: "0",
    bayesLosses: "0",
    blockOn: false,
    scale: "1",
  };
}

export const MIN_BOOTSTRAP = 20;

/** Converte o form num TradeModel; null se inválido. */
export function modelToTradeModel(
  m: ModelFormState,
  journalOutcomes: number[],
): TradeModel | null {
  if (m.kind === "bootstrap") {
    if (journalOutcomes.length < MIN_BOOTSTRAP) return null;
    return {
      kind: "bootstrap",
      outcomes: journalOutcomes,
      blockSize: m.blockOn ? 5 : 1,
      scale: num(m.scale, 1) || 1,
    };
  }
  const contratos = Math.max(1, Math.floor(num(m.contratos, 1)));
  const stop = num(m.stopTicks);
  const target = num(m.targetTicks);
  if (stop <= 0 || target <= 0) return null;
  const wins = Math.max(0, Math.floor(num(m.bayesWins)));
  const losses = Math.max(0, Math.floor(num(m.bayesLosses)));
  return {
    kind: "parametric",
    winRate: num(m.winRate) / 100,
    beRate: num(m.beRate) / 100,
    riskUsd: stop * MNQ.tickValueUsd * contratos,
    targetUsd: target * MNQ.tickValueUsd * contratos,
    commissionUsd: num(m.comissao),
    slippage: m.slippageOn
      ? {
          prob: num(m.slippageProb) / 100,
          meanTicks: num(m.slippageTicks),
          tickValueUsd: MNQ.tickValueUsd * contratos,
        }
      : null,
    winRateUncertainty:
      m.bayesOn && wins + losses > 0
        ? { wins, losses, priorAlpha: 1, priorBeta: 1 }
        : null,
  };
}

export function ModelForm({
  value,
  onChange,
  journal,
  compact = false,
}: {
  value: ModelFormState;
  onChange: (v: ModelFormState) => void;
  journal: JournalData;
  compact?: boolean;
}) {
  const set = (patch: Partial<ModelFormState>) => onChange({ ...value, ...patch });
  const nReal = journal.outcomes.length;
  const bootstrapOk = nReal >= MIN_BOOTSTRAP;

  const contratos = Math.max(1, Math.floor(num(value.contratos, 1)));
  const riskUsd = num(value.stopTicks) * MNQ.tickValueUsd * contratos;
  const targetUsd = num(value.targetTicks) * MNQ.tickValueUsd * contratos;
  const payoffR = riskUsd > 0 ? targetUsd / riskUsd : 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <KindButton
          active={value.kind === "parametric"}
          onClick={() => set({ kind: "parametric" })}
        >
          Paramétrico
        </KindButton>
        <KindButton
          active={value.kind === "bootstrap"}
          onClick={() => bootstrapOk && set({ kind: "bootstrap" })}
          disabled={!bootstrapOk}
          title={
            bootstrapOk
              ? undefined
              : `Precisa de pelo menos ${MIN_BOOTSTRAP} trades no diário (você tem ${nReal}).`
          }
        >
          Meus trades reais ({nReal})
        </KindButton>
      </div>

      {value.kind === "parametric" ? (
        <>
          <div className={`grid gap-3 ${compact ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-6"}`}>
            <Field label="ATM">
              <select
                value={value.atmKey}
                onChange={(e) => {
                  const atm = ATM_PRESETS.find((a) => a.key === e.target.value);
                  if (atm) {
                    set({
                      atmKey: atm.key,
                      stopTicks: String(atm.stopTicks),
                      targetTicks: String(atm.targetTicks),
                    });
                  } else {
                    set({ atmKey: "custom" });
                  }
                }}
                className={inputCls}
              >
                {ATM_PRESETS.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.key}
                  </option>
                ))}
                <option value="custom">Custom</option>
              </select>
            </Field>
            <Field label="Stop (ticks)">
              <NumInput
                value={value.stopTicks}
                onChange={(v) => set({ stopTicks: v, atmKey: "custom" })}
              />
            </Field>
            <Field label="Alvo (ticks)">
              <NumInput
                value={value.targetTicks}
                onChange={(v) => set({ targetTicks: v, atmKey: "custom" })}
              />
            </Field>
            <Field label="Contratos">
              <NumInput value={value.contratos} onChange={(v) => set({ contratos: v })} />
            </Field>
            <Field label="Win rate (%)">
              <NumInput value={value.winRate} onChange={(v) => set({ winRate: v })} />
            </Field>
            <Field label="Breakeven (%)">
              <NumInput value={value.beRate} onChange={(v) => set({ beRate: v })} />
            </Field>
            {!compact && (
              <Field label="Comissão (US$/trade)">
                <NumInput value={value.comissao} onChange={(v) => set({ comissao: v })} />
              </Field>
            )}
          </div>

          <p className="text-xs text-muted">
            Risco <strong className="text-fg">{fmtMoney(riskUsd)}</strong> · Alvo{" "}
            <strong className="text-fg">{fmtMoney(targetUsd)}</strong> ·{" "}
            <strong className="text-fg">{fmtNumber(payoffR, 2)}R</strong>
            {value.beRate !== "0" && value.beRate.trim() !== "" && (
              <> · BE em {fmtPct(num(value.beRate), 0)} dos trades</>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Toggle
              checked={value.slippageOn}
              onChange={(v) => set({ slippageOn: v })}
              label="Slippage nas perdas (cauda gorda)"
            />
            {value.slippageOn && (
              <div className="flex items-center gap-2 text-xs text-muted">
                prob.
                <span className="w-16">
                  <NumInput value={value.slippageProb} onChange={(v) => set({ slippageProb: v })} suffix="%" />
                </span>
                média
                <span className="w-16">
                  <NumInput value={value.slippageTicks} onChange={(v) => set({ slippageTicks: v })} suffix="t" />
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Toggle
              checked={value.bayesOn}
              onChange={(v) =>
                set({
                  bayesOn: v,
                  // pré-preenche com a amostra real do diário na 1ª ativação
                  bayesWins:
                    v && value.bayesWins === "0" && journal.wins > 0
                      ? String(journal.wins)
                      : value.bayesWins,
                  bayesLosses:
                    v && value.bayesLosses === "0" && journal.losses > 0
                      ? String(journal.losses)
                      : value.bayesLosses,
                })
              }
              label="Incerteza no win rate (Bayes)"
            />
            {value.bayesOn && (
              <div className="flex items-center gap-2 text-xs text-muted">
                medido em
                <span className="w-16">
                  <NumInput value={value.bayesWins} onChange={(v) => set({ bayesWins: v })} suffix="W" />
                </span>
                <span className="w-16">
                  <NumInput value={value.bayesLosses} onChange={(v) => set({ bayesLosses: v })} suffix="L" />
                </span>
                trades
              </div>
            )}
          </div>
          {value.bayesOn && (
            <p className="text-xs text-muted">
              Com amostra pequena, seu win rate verdadeiro é incerto — cada run
              sorteia um WR plausível dado o que você já mediu (o % digitado
              acima é ignorado).
            </p>
          )}
        </>
      ) : (
        <>
          <p className="text-xs text-muted">
            Sorteia trades do seu histórico real ({nReal} trades da conta
            selecionada{journal.contaNome ? ` — ${journal.contaNome}` : ""}):{" "}
            {journal.wins}V / {journal.losses}D.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Toggle
              checked={value.blockOn}
              onChange={(v) => set({ blockOn: v })}
              label="Preservar sequências (blocos de 5)"
            />
            <div className="flex items-center gap-2 text-xs text-muted">
              multiplicador de tamanho
              <span className="w-16">
                <NumInput value={value.scale} onChange={(v) => set({ scale: v })} suffix="×" />
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KindButton({
  active,
  onClick,
  disabled,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-accent/12 text-accent ring-1 ring-inset ring-accent/20"
          : disabled
            ? "cursor-not-allowed text-muted/50"
            : "text-muted hover:bg-white/4 hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}
