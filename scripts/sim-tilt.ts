// Script descartável: números de referência do fator psicológico p/ o Guia.
// Rodar: npx tsx scripts/sim-tilt.ts
import {
  simulate,
  PSYCHE_PROFILES,
  type SimMesaRules,
  type ParametricModel,
  type PsycheModel,
} from "../src/lib/simulator";

const lucid: SimMesaRules = {
  saldoInicial: 25000,
  metaProfit: 1250,
  maxDrawdown: 1000,
  tipoDrawdown: "eod",
  limitePerdaDiario: null,
  limiteDiarioElimina: false,
  consistenciaPct: 50,
  minDiasTrade: 2,
  custoAvaliacaoUsd: null,
};

function par(wr: number, psyche: PsycheModel | null): ParametricModel {
  return {
    kind: "parametric",
    winRate: wr,
    beRate: 0,
    riskUsd: 50,
    targetUsd: 150,
    commissionUsd: 1.5,
    slippage: null,
    winRateUncertainty: null,
    psyche,
  };
}

const P = { nRuns: 10000, maxDays: 120, seed: 1 };

for (const wr of [0.35, 0.4]) {
  console.log(`\n=== 1x3, WR ${wr * 100}% ===`);
  const base = simulate(lucid, par(wr, null), P);
  console.log(`disciplinado: pass ${(base.passProb * 100).toFixed(1)}%`);
  for (const key of ["estavel", "medio", "instavel"] as const) {
    const r = simulate(lucid, par(wr, PSYCHE_PROFILES[key]), P);
    const rb = simulate(
      lucid,
      par(wr, { ...PSYCHE_PROFILES[key], breaker: { maxLossesDia: 2 } }),
      P,
    );
    console.log(
      `${key.padEnd(9)} pass ${(r.passProb * 100).toFixed(1).padStart(5)}%  (tiltou ${(r.tiltStats!.runsComTilt * 100).toFixed(0)}% dos runs, P&L médio em tilt $${r.tiltStats!.plTiltMedio.toFixed(0)})  | com disjuntor: ${(rb.passProb * 100).toFixed(1)}%`,
    );
  }
}
