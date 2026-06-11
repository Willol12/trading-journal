// Script descartável: gera os números de referência do Guia da Calculadora.
// Rodar: npx tsx scripts/sim-guia.ts
import {
  simulate,
  requiredWinRate,
  type SimMesaRules,
  type ParametricModel,
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

const atms = [
  { nome: "1x3", riskUsd: 50, targetUsd: 150 },
  { nome: "1x2", riskUsd: 50, targetUsd: 100 },
  { nome: "1x1", riskUsd: 100, targetUsd: 100 },
];

function par(a: (typeof atms)[number], wr: number): ParametricModel {
  return {
    kind: "parametric",
    winRate: wr,
    beRate: 0,
    riskUsd: a.riskUsd,
    targetUsd: a.targetUsd,
    commissionUsd: 1.5,
    slippage: null,
    winRateUncertainty: null,
  };
}

const WRS = [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7];

for (const a of atms) {
  console.log(`\n=== ${a.nome} (risco $${a.riskUsd} / alvo $${a.targetUsd}) ===`);
  for (const wr of WRS) {
    const r = simulate(lucid, par(a, wr), { nRuns: 10000, maxDays: 120, seed: 1 });
    console.log(
      `WR ${(wr * 100).toFixed(0).padStart(2)}%  pass ${(r.passProb * 100).toFixed(1).padStart(5)}%  bust ${(r.bustProb * 100).toFixed(1).padStart(5)}%  d50 ${String(r.daysToPass.p50 ?? "—").padStart(4)}  streak95 ${r.maxLossStreak.p95}`,
    );
  }
  for (const alvo of [0.5, 0.8, 0.9]) {
    const wr = requiredWinRate(lucid, par(a, 0.5), alvo, { nRuns: 4000, seed: 1 });
    console.log(
      `WR necessário p/ ${(alvo * 100).toFixed(0)}% de aprovação: ${wr == null ? "inalcançável" : (wr * 100).toFixed(1) + "%"}`,
    );
  }
}
