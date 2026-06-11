// Motor de simulação Monte Carlo de avaliações de mesa proprietária.
// Puro e determinístico (por seed) — sem React, sem dependências; roda no client.
// A semântica das regras de drawdown espelha mesaStatus() em ./metrics.ts:
// piso = min(saldoInicial, pico − maxDrawdown); no regime "eod" o pico só anda
// no fechamento do dia, mas TOCAR o piso vigente intraday elimina (folga > 0 = vivo).

import type { TipoDrawdown } from "./propFirms";
import { mulberry32, splitSeed, sampleBeta, sampleExp, type Rng } from "./rng";

// ---------------------------------------------------------------------------
// Constantes do MNQ e presets de ATM do usuário
// ---------------------------------------------------------------------------

export const MNQ = {
  tickSize: 0.25, // pontos por tick
  tickValueUsd: 0.5, // US$ por tick por contrato
  pointValueUsd: 2, // US$ por ponto por contrato
} as const;

export interface AtmPreset {
  key: string;
  nome: string;
  stopTicks: number;
  targetTicks: number;
}

export const ATM_PRESETS: AtmPreset[] = [
  { key: "1x3", nome: "1x3 — stop 100t / alvo 300t", stopTicks: 100, targetTicks: 300 },
  { key: "1x2", nome: "1x2 — stop 100t / alvo 200t", stopTicks: 100, targetTicks: 200 },
  { key: "1x1", nome: "1x1 — stop 200t / alvo 200t", stopTicks: 200, targetTicks: 200 },
];

// ---------------------------------------------------------------------------
// Modelo psicológico (tilt): emoção não entra na conta — comportamento entra.
// Máquina de estados por run: normal → tilt (perdas seguidas) → recupera com
// wins; opcionalmente normal → euforia (wins seguidos), onde uma perda derruba
// pro tilt com gatilho reduzido. Cada estado altera o COMPORTAMENTO do trade:
// acerto (entradas piores), tamanho da mão, trades extras (revenge) e quebra
// de regra (segurar a perda além do stop). Embasamento: prospect theory
// (perda dói ~2,25x o ganho) e evidência de risco maior pós-perda em traders
// reais (Coval & Shumway 2005).
// ---------------------------------------------------------------------------

export interface PsycheTiltEffects {
  /** Delta no win rate decisivo (ex.: -0.10 = entradas 10pp piores). */
  winRateDelta: number;
  /** Multiplicador do TAMANHO da posição (escala risco E alvo). */
  sizeMult: number;
  /** Trades extras por dia enquanto em tilt (revenge trading). */
  extraTrades: number;
  /** Prob. de quebrar regra numa perda (mover/segurar o stop). */
  ruleBreakProb: number;
  /** Multiplicador da perda quando a regra é quebrada. */
  ruleBreakMult: number;
}

export interface PsycheModel {
  /** Perdas seguidas que disparam o tilt. */
  tiltAfterLosses: number;
  tilt: PsycheTiltEffects;
  /** Wins seguidos que disparam euforia (null = sem euforia). */
  euphoriaAfterWins: number | null;
  /** Na euforia: excesso de confiança (mão maior, entradas piores). */
  euphoria: { winRateDelta: number; sizeMult: number } | null;
  /** Wins seguidos para sair do tilt. */
  recoveryWins: number;
  /** Disjuntor: após N perdas no MESMO dia, para de operar e esfria
   *  (encerra o dia e volta ao estado normal). */
  breaker: { maxLossesDia: number } | null;
}

export type PsycheProfileKey = "estavel" | "medio" | "instavel";

export const PSYCHE_PROFILES: Record<PsycheProfileKey, PsycheModel> = {
  estavel: {
    tiltAfterLosses: 4,
    tilt: { winRateDelta: -0.05, sizeMult: 1.25, extraTrades: 0, ruleBreakProb: 0.05, ruleBreakMult: 2 },
    euphoriaAfterWins: 5,
    euphoria: { winRateDelta: -0.03, sizeMult: 1.2 },
    recoveryWins: 1,
    breaker: null,
  },
  medio: {
    tiltAfterLosses: 3,
    tilt: { winRateDelta: -0.1, sizeMult: 1.5, extraTrades: 1, ruleBreakProb: 0.1, ruleBreakMult: 2 },
    euphoriaAfterWins: 4,
    euphoria: { winRateDelta: -0.05, sizeMult: 1.3 },
    recoveryWins: 2,
    breaker: null,
  },
  instavel: {
    tiltAfterLosses: 2,
    tilt: { winRateDelta: -0.15, sizeMult: 2, extraTrades: 2, ruleBreakProb: 0.2, ruleBreakMult: 2.5 },
    euphoriaAfterWins: 3,
    euphoria: { winRateDelta: -0.08, sizeMult: 1.5 },
    recoveryWins: 3,
    breaker: null,
  },
};

// ---------------------------------------------------------------------------
// Tipos de entrada
// ---------------------------------------------------------------------------

export interface SimMesaRules {
  saldoInicial: number;
  metaProfit: number;
  maxDrawdown: number | null;
  tipoDrawdown: TipoDrawdown;
  limitePerdaDiario: number | null;
  /** true = estourar o limite diário reprova; false = só encerra o dia. */
  limiteDiarioElimina: boolean;
  /** Nenhum dia pode ter mais que X% do lucro total no momento da aprovação. */
  consistenciaPct: number | null;
  minDiasTrade: number | null;
  /** Taxa da avaliação (p/ custo esperado). */
  custoAvaliacaoUsd: number | null;
}

export interface ParametricModel {
  kind: "parametric";
  /** P(win | trade decisivo) — ou seja, excluindo breakevens. */
  winRate: number;
  /** P(breakeven) absoluta; perda = (1 − winRate) entre os decisivos. */
  beRate: number;
  /** Perda no stop cheio, em US$ (ticks × valor do tick × contratos). */
  riskUsd: number;
  /** Ganho no alvo, em US$. */
  targetUsd: number;
  /** Custo por trade (round-trip), sempre subtraído — inclusive no BE. */
  commissionUsd: number;
  /** Cauda gorda: perdas ocasionalmente piores que o stop. */
  slippage: {
    prob: number;
    meanTicks: number;
    /** US$ por tick JÁ multiplicado pelos contratos. */
    tickValueUsd: number;
  } | null;
  /** Incerteza bayesiana: sorteia o win rate "verdadeiro" de cada run
   *  de Beta(priorAlpha + wins, priorBeta + losses). */
  winRateUncertainty: {
    wins: number;
    losses: number;
    priorAlpha: number;
    priorBeta: number;
  } | null;
  /** Fator psicológico (tilt) — ver PSYCHE_PROFILES. Opcional. */
  psyche?: PsycheModel | null;
}

export interface BootstrapModel {
  kind: "bootstrap";
  /** P&L em US$ dos trades reais do diário. */
  outcomes: number[];
  /** 1 = sorteio independente; >1 = blocos contíguos (preserva sequências). */
  blockSize: number;
  /** Multiplicador de tamanho (ex.: 2 contratos vs histórico de 1). */
  scale: number;
}

/** Determinístico — cicla a lista. Usado em testes e replays. */
export interface FixedModel {
  kind: "fixed";
  outcomes: number[];
}

export type TradeModel = ParametricModel | BootstrapModel | FixedModel;

export interface SimParams {
  nRuns?: number;
  maxDays?: number;
  tradesPerDay?: number;
  /** Probabilidade de um dia passar sem setup (dia corre, não conta como operado). */
  skipDayProb?: number;
  seed?: number;
  /** Nº de runs cuja trajetória diária é gravada p/ bandas e amostras. */
  pathSampleSize?: number;
}

const DEFAULT_PARAMS: Required<SimParams> = {
  nRuns: 10_000,
  maxDays: 120,
  tradesPerDay: 1,
  skipDayProb: 0,
  seed: 1,
  pathSampleSize: 400,
};

// ---------------------------------------------------------------------------
// Tipos de saída
// ---------------------------------------------------------------------------

export type RunOutcome = "pass" | "bust" | "timeout";

export interface SimResult {
  nRuns: number;
  passProb: number;
  bustProb: number;
  timeoutProb: number;
  /** Dias corridos até aprovar (só runs aprovados); null se ninguém passou. */
  daysToPass: { p25: number | null; p50: number | null; p75: number | null };
  /** 1/passProb (geométrica); null se passProb = 0. */
  expectedAttempts: number | null;
  expectedCostUsd: number | null;
  maxLossStreak: { dist: { len: number; count: number }[]; p95: number };
  finalEquityHist: { x0: number; x1: number; count: number }[];
  /** Equity por dia (percentis sobre o subsample; runs encerrados seguram o valor final). */
  band: { day: number; p10: number; p50: number; p90: number }[];
  /** Trajetórias representativas (pass rápido/mediano/lento, bust, timeout). */
  samplePaths: { outcome: RunOutcome; path: number[] }[];
  /** Estatísticas de tilt — null quando o fator psicológico está desligado.
   *  plTiltMedio = P&L médio dos trades feitos EM tilt, por run que tiltou. */
  tiltStats: { runsComTilt: number; plTiltMedio: number } | null;
  elapsedMs: number;
}

// ---------------------------------------------------------------------------
// Amostrador de trades (estado por run)
// ---------------------------------------------------------------------------

interface TradeOutcome {
  pnl: number;
  kind: "win" | "loss" | "be";
}

/** Modificadores de comportamento do estado psicológico vigente. */
interface SampleMods {
  winRateDelta: number;
  sizeMult: number;
  ruleBreakProb: number;
  ruleBreakMult: number;
}

type Sampler = (mods?: SampleMods) => TradeOutcome;

function makeSampler(model: TradeModel, rng: Rng): Sampler {
  if (model.kind === "fixed") {
    const n = model.outcomes.length;
    if (n === 0) throw new Error("FixedModel exige outcomes não-vazio");
    let i = 0;
    return () => {
      const pnl = model.outcomes[i % n];
      i++;
      return { pnl, kind: pnl > 0 ? "win" : pnl < 0 ? "loss" : "be" };
    };
  }

  if (model.kind === "bootstrap") {
    const n = model.outcomes.length;
    if (n === 0) throw new Error("BootstrapModel exige outcomes não-vazio");
    const block = Math.max(1, Math.floor(model.blockSize));
    let start = 0;
    let offset = block; // força sorteio de bloco na 1ª chamada
    return () => {
      if (offset >= block) {
        start = Math.floor(rng() * n);
        offset = 0;
      }
      const pnl = model.outcomes[(start + offset) % n] * model.scale;
      offset++;
      return { pnl, kind: pnl > 0 ? "win" : pnl < 0 ? "loss" : "be" };
    };
  }

  // parametric — se houver incerteza, o WR "verdadeiro" do run é sorteado aqui.
  let p = clamp01(model.winRate);
  if (model.winRateUncertainty) {
    const u = model.winRateUncertainty;
    p = sampleBeta(rng, u.priorAlpha + u.wins, u.priorBeta + u.losses);
  }
  const beRate = clamp01(model.beRate);
  return (mods) => {
    if (beRate > 0 && rng() < beRate) {
      return { pnl: -model.commissionUsd, kind: "be" };
    }
    const pEff = mods ? clamp01(p + mods.winRateDelta) : p;
    const size = mods?.sizeMult ?? 1;
    if (rng() < pEff) {
      return { pnl: model.targetUsd * size - model.commissionUsd, kind: "win" };
    }
    let loss = model.riskUsd * size;
    if (mods && mods.ruleBreakProb > 0 && rng() < mods.ruleBreakProb) {
      loss *= mods.ruleBreakMult; // segurou a perda além do stop
    }
    let pnl = -loss - model.commissionUsd;
    if (model.slippage && model.slippage.prob > 0 && rng() < model.slippage.prob) {
      pnl -= sampleExp(rng, model.slippage.meanTicks) * model.slippage.tickValueUsd;
    }
    return { pnl, kind: "loss" };
  };
}

// ---------------------------------------------------------------------------
// Um run = uma tentativa de avaliação
// ---------------------------------------------------------------------------

interface RunResult {
  outcome: RunOutcome;
  days: number;
  finalEquity: number;
  maxLossStreak: number;
  path: number[] | null;
  tilted: boolean;
  plTilt: number;
}

function runOnce(
  rules: SimMesaRules,
  model: TradeModel,
  params: Required<SimParams>,
  rng: Rng,
  recordPath: boolean,
): RunResult {
  const sample = makeSampler(model, rng);
  const psyche = model.kind === "parametric" ? (model.psyche ?? null) : null;
  const start = rules.saldoInicial;
  const maxDD = rules.maxDrawdown;
  const isStatic = rules.tipoDrawdown === "static";
  const isEod = rules.tipoDrawdown === "eod";

  let equity = start;
  let peak = start;
  let floor = maxDD == null ? -Infinity : start - maxDD;
  let diasOperados = 0;
  let maiorDia = 0;
  let lossStreak = 0;
  let maxLossStreak = 0;
  // estado psicológico (só usado com psyche ligado)
  let psyState: "normal" | "tilt" | "euforia" = "normal";
  let psyLossStreak = 0;
  let psyWinStreak = 0;
  let tilted = false;
  let plTilt = 0;

  const path: number[] | null = recordPath ? [start] : null;
  let outcome: RunOutcome = "timeout";
  let days = params.maxDays;

  outer: for (let day = 1; day <= params.maxDays; day++) {
    if (params.skipDayProb > 0 && rng() < params.skipDayProb) {
      path?.push(equity);
      continue;
    }
    diasOperados++;
    let dayPL = 0;
    let lossesHoje = 0;

    // while com teto dinâmico: em tilt entram trades extras (revenge)
    let t = 0;
    while (
      t <
      params.tradesPerDay +
        (psyche && psyState === "tilt" ? psyche.tilt.extraTrades : 0)
    ) {
      t++;
      const emTilt = psyche != null && psyState === "tilt";
      const mods: SampleMods | undefined = !psyche
        ? undefined
        : psyState === "tilt"
          ? {
              winRateDelta: psyche.tilt.winRateDelta,
              sizeMult: psyche.tilt.sizeMult,
              ruleBreakProb: psyche.tilt.ruleBreakProb,
              ruleBreakMult: psyche.tilt.ruleBreakMult,
            }
          : psyState === "euforia" && psyche.euphoria
            ? {
                winRateDelta: psyche.euphoria.winRateDelta,
                sizeMult: psyche.euphoria.sizeMult,
                ruleBreakProb: 0,
                ruleBreakMult: 1,
              }
            : undefined;

      const { pnl, kind } = sample(mods);
      if (emTilt) plTilt += pnl;
      equity += pnl;
      dayPL += pnl;

      if (kind === "loss") {
        lossStreak++;
        if (lossStreak > maxLossStreak) maxLossStreak = lossStreak;
      } else if (kind === "win") {
        lossStreak = 0;
      }

      // transições do estado psicológico
      if (psyche) {
        if (kind === "loss") {
          psyLossStreak++;
          psyWinStreak = 0;
          lossesHoje++;
          if (psyState === "euforia") {
            // a queda da euforia: o tilt dispara com metade do gatilho
            psyState =
              psyLossStreak >=
              Math.max(1, Math.ceil(psyche.tiltAfterLosses / 2))
                ? "tilt"
                : "normal";
          } else if (
            psyState === "normal" &&
            psyLossStreak >= psyche.tiltAfterLosses
          ) {
            psyState = "tilt";
          }
          if (psyState === "tilt") tilted = true;
        } else if (kind === "win") {
          psyWinStreak++;
          psyLossStreak = 0;
          if (psyState === "tilt") {
            if (psyWinStreak >= psyche.recoveryWins) psyState = "normal";
          } else if (
            psyState === "normal" &&
            psyche.euphoriaAfterWins != null &&
            psyche.euphoria != null &&
            psyWinStreak >= psyche.euphoriaAfterWins
          ) {
            psyState = "euforia";
          }
        }
      }

      // trailing/intraday: o pico (e o piso) andam a cada trade
      if (!isStatic && !isEod && maxDD != null && equity > peak) {
        peak = equity;
        floor = Math.min(start, peak - maxDD);
      }

      // eliminação: tocar o piso vigente (mesmo intraday no regime EOD)
      if (equity <= floor) {
        outcome = "bust";
        days = day;
        path?.push(equity);
        break outer;
      }

      // limite de perda diário
      if (rules.limitePerdaDiario != null && dayPL <= -rules.limitePerdaDiario) {
        if (rules.limiteDiarioElimina) {
          outcome = "bust";
          days = day;
          path?.push(equity);
          break outer;
        }
        break; // encerra o dia, o run continua amanhã
      }

      // disjuntor psicológico: N perdas no dia → para de operar e esfria
      if (psyche?.breaker && lossesHoje >= psyche.breaker.maxLossesDia) {
        psyState = "normal";
        psyLossStreak = 0;
        break;
      }
    }

    // fim do dia: no regime EOD o pico só anda aqui
    if (isEod && maxDD != null && equity > peak) {
      peak = equity;
      floor = Math.min(start, peak - maxDD);
    }
    if (dayPL > maiorDia) maiorDia = dayPL;
    path?.push(equity);

    // aprovação (checada no fechamento)
    const profit = equity - start;
    if (
      profit >= rules.metaProfit &&
      diasOperados >= (rules.minDiasTrade ?? 0) &&
      (rules.consistenciaPct == null ||
        maiorDia <= (rules.consistenciaPct / 100) * profit)
    ) {
      outcome = "pass";
      days = day;
      break;
    }
  }

  return { outcome, days, finalEquity: equity, maxLossStreak, path, tilted, plTilt };
}

// ---------------------------------------------------------------------------
// simulate(): agrega nRuns tentativas
// ---------------------------------------------------------------------------

export function simulate(
  rules: SimMesaRules,
  model: TradeModel,
  params: SimParams = {},
): SimResult {
  const t0 = now();
  const p: Required<SimParams> = { ...DEFAULT_PARAMS, ...params };
  p.nRuns = Math.max(100, Math.min(200_000, Math.floor(p.nRuns)));
  p.maxDays = Math.max(1, Math.min(1_000, Math.floor(p.maxDays)));
  p.tradesPerDay = Math.max(1, Math.floor(p.tradesPerDay));
  p.skipDayProb = clamp01(p.skipDayProb);

  const stride = Math.max(1, Math.floor(p.nRuns / Math.max(1, p.pathSampleSize)));

  let passCount = 0;
  let bustCount = 0;
  let tiltedCount = 0;
  let plTiltSum = 0;
  const passDays: number[] = [];
  const streaks: number[] = [];
  const finals: number[] = [];
  const recorded: RunResult[] = [];

  for (let i = 0; i < p.nRuns; i++) {
    const rng = mulberry32(splitSeed(p.seed, i));
    const r = runOnce(rules, model, p, rng, i % stride === 0);
    if (r.outcome === "pass") {
      passCount++;
      passDays.push(r.days);
    } else if (r.outcome === "bust") {
      bustCount++;
    }
    if (r.tilted) {
      tiltedCount++;
      plTiltSum += r.plTilt;
    }
    streaks.push(r.maxLossStreak);
    finals.push(r.finalEquity);
    if (r.path) recorded.push(r);
  }

  const passProb = passCount / p.nRuns;
  const bustProb = bustCount / p.nRuns;
  passDays.sort((a, b) => a - b);
  streaks.sort((a, b) => a - b);

  const expectedAttempts = passProb > 0 ? 1 / passProb : null;
  const expectedCostUsd =
    expectedAttempts != null && rules.custoAvaliacaoUsd != null
      ? rules.custoAvaliacaoUsd * expectedAttempts
      : null;

  return {
    nRuns: p.nRuns,
    passProb,
    bustProb,
    timeoutProb: 1 - passProb - bustProb,
    daysToPass: {
      p25: percentileSorted(passDays, 0.25),
      p50: percentileSorted(passDays, 0.5),
      p75: percentileSorted(passDays, 0.75),
    },
    expectedAttempts,
    expectedCostUsd,
    maxLossStreak: {
      dist: streakDist(streaks),
      p95: percentileSorted(streaks, 0.95) ?? 0,
    },
    finalEquityHist: histogram(finals, 30),
    band: buildBand(recorded, p.maxDays),
    samplePaths: pickSamplePaths(recorded),
    tiltStats:
      model.kind === "parametric" && model.psyche != null
        ? {
            runsComTilt: tiltedCount / p.nRuns,
            plTiltMedio: tiltedCount > 0 ? plTiltSum / tiltedCount : 0,
          }
        : null,
    elapsedMs: now() - t0,
  };
}

// ---------------------------------------------------------------------------
// Comparador de cenários
// ---------------------------------------------------------------------------

export interface ScenarioInput {
  nome: string;
  model: TradeModel;
}

export interface ScenarioResult extends SimResult {
  nome: string;
}

export function compareScenarios(
  rules: SimMesaRules,
  scenarios: ScenarioInput[],
  params: SimParams = {},
): ScenarioResult[] {
  const seed = params.seed ?? DEFAULT_PARAMS.seed;
  const results = scenarios.map((s, i) => ({
    nome: s.nome,
    ...simulate(rules, s.model, { ...params, seed: splitSeed(seed, i * 7919) }),
  }));
  return results.sort((a, b) => {
    if (b.passProb !== a.passProb) return b.passProb - a.passProb;
    const ca = a.expectedCostUsd ?? Infinity;
    const cb = b.expectedCostUsd ?? Infinity;
    if (ca !== cb) return ca - cb;
    return a.nome.localeCompare(b.nome);
  });
}

// ---------------------------------------------------------------------------
// Fórmulas analíticas (sanity-checks e calculadoras rápidas)
// ---------------------------------------------------------------------------

/** Win rate de breakeven (sem custos): 1/(1+R). */
export function breakevenWinRate(payoffR: number): number {
  if (payoffR <= 0) return 1;
  return 1 / (1 + payoffR);
}

/** Win rate de breakeven em US$, com comissão por trade. */
export function breakevenWinRateUsd(
  riskUsd: number,
  targetUsd: number,
  commissionUsd = 0,
): number {
  const den = riskUsd + targetUsd;
  if (den <= 0) return 1;
  return Math.min(1, (riskUsd + commissionUsd) / den);
}

/**
 * Risco de ruína clássico (gambler's ruin com payoff assimétrico, DD estático,
 * sem meta, horizonte infinito): menor raiz z* ∈ (0,1) de p·z^(R+1) − z + q = 0,
 * RoR = z*^vidas. Para R=1 reduz à fórmula fechada (q/p)^vidas.
 * É um teto teórico de referência — com piso trailing + meta, o Monte Carlo
 * é a fonte da verdade.
 */
export function riskOfRuin(winRate: number, payoffR: number, ruinUnits: number): number {
  const p = clamp01(winRate);
  if (p === 0) return 1;
  if (p === 1) return 0;
  if (p <= breakevenWinRate(payoffR)) return 1; // sem edge → ruína certa
  const q = 1 - p;
  const f = (z: number) => p * Math.pow(z, payoffR + 1) - z + q;
  // f(0) = q > 0 e, com edge positivo, f cruza pra negativo antes de z=1.
  let lo = 0;
  let hi = 1 - 1e-12;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid;
    else hi = mid;
  }
  const z = (lo + hi) / 2;
  return Math.min(1, Math.pow(z, ruinUnits));
}

/**
 * Win rate necessário p/ atingir `targetPassProb` de aprovação, por busca
 * binária sobre o Monte Carlo (seed fixa = common random numbers).
 * Ignora winRateUncertainty (a pergunta é sobre o WR verdadeiro).
 * Retorna null se nem WR = 0.99 alcança o alvo.
 */
export function requiredWinRate(
  rules: SimMesaRules,
  base: ParametricModel,
  targetPassProb: number,
  params: SimParams = {},
): number | null {
  const simParams: SimParams = { nRuns: 2_500, seed: 1, pathSampleSize: 1, ...params };
  const probAt = (wr: number) =>
    simulate(rules, { ...base, winRate: wr, winRateUncertainty: null }, simParams)
      .passProb;
  let lo = 0.01;
  let hi = 0.99;
  if (probAt(hi) < targetPassProb) return null;
  if (probAt(lo) >= targetPassProb) return lo;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    if (probAt(mid) >= targetPassProb) hi = mid;
    else lo = mid;
  }
  return Math.round(hi * 1000) / 1000;
}

/** Contratos que cabem num risco em US$ dado o stop em ticks. */
export function contractsForRisk(
  riskUsd: number,
  stopTicks: number,
  tickValueUsd: number = MNQ.tickValueUsd,
): { contratos: number; riscoReal: number } {
  const porContrato = stopTicks * tickValueUsd;
  if (porContrato <= 0) return { contratos: 0, riscoReal: 0 };
  const contratos = Math.max(0, Math.floor(riskUsd / porContrato));
  return { contratos, riscoReal: contratos * porContrato };
}

/**
 * Expectativa por trade e nº esperado de trades/dias até a meta.
 * Retorna null se a expectativa for ≤ 0 (meta inalcançável em média).
 */
export function expectedTradesToTarget(
  metaUsd: number,
  winRate: number,
  riskUsd: number,
  targetUsd: number,
  commissionUsd = 0,
  tradesPerDay = 1,
  skipDayProb = 0,
): { evPorTrade: number; trades: number; dias: number } | null {
  const p = clamp01(winRate);
  const ev = p * (targetUsd - commissionUsd) - (1 - p) * (riskUsd + commissionUsd);
  if (ev <= 0) return null;
  const trades = metaUsd / ev;
  const porDia = Math.max(1e-9, tradesPerDay * (1 - clamp01(skipDayProb)));
  return { evPorTrade: ev, trades, dias: trades / porDia };
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

/** Percentil com interpolação linear sobre array JÁ ordenado. */
function percentileSorted(sorted: number[], q: number): number | null {
  if (sorted.length === 0) return null;
  const idx = (sorted.length - 1) * q;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function streakDist(sortedStreaks: number[]): { len: number; count: number }[] {
  const map = new Map<number, number>();
  for (const s of sortedStreaks) map.set(s, (map.get(s) ?? 0) + 1);
  return [...map.entries()]
    .map(([len, count]) => ({ len, count }))
    .sort((a, b) => a.len - b.len);
}

function histogram(values: number[], nBuckets: number): { x0: number; x1: number; count: number }[] {
  if (values.length === 0) return [];
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === max) return [{ x0: min, x1: max, count: values.length }];
  const width = (max - min) / nBuckets;
  const counts = new Array<number>(nBuckets).fill(0);
  for (const v of values) {
    const b = Math.min(nBuckets - 1, Math.floor((v - min) / width));
    counts[b]++;
  }
  return counts.map((count, i) => ({
    x0: min + i * width,
    x1: min + (i + 1) * width,
    count,
  }));
}

function buildBand(
  recorded: RunResult[],
  maxDays: number,
): { day: number; p10: number; p50: number; p90: number }[] {
  if (recorded.length === 0) return [];
  const days = recorded.map((r) => r.days).sort((a, b) => a - b);
  const horizon = Math.min(
    maxDays,
    Math.max(10, Math.ceil(percentileSorted(days, 0.95) ?? maxDays)),
  );
  const band: { day: number; p10: number; p50: number; p90: number }[] = [];
  for (let d = 0; d <= horizon; d++) {
    const vals = recorded
      .map((r) => {
        const path = r.path!;
        return path[Math.min(d, path.length - 1)];
      })
      .sort((a, b) => a - b);
    band.push({
      day: d,
      p10: percentileSorted(vals, 0.1)!,
      p50: percentileSorted(vals, 0.5)!,
      p90: percentileSorted(vals, 0.9)!,
    });
  }
  return band;
}

function pickSamplePaths(
  recorded: RunResult[],
): { outcome: RunOutcome; path: number[] }[] {
  const passes = recorded
    .filter((r) => r.outcome === "pass")
    .sort((a, b) => a.days - b.days);
  const firstBust = recorded.find((r) => r.outcome === "bust");
  const firstTimeout = recorded.find((r) => r.outcome === "timeout");
  const picks: RunResult[] = [];
  if (passes.length > 0) {
    picks.push(passes[0]);
    if (passes.length > 2) picks.push(passes[Math.floor(passes.length / 2)]);
    if (passes.length > 1) picks.push(passes[passes.length - 1]);
  }
  if (firstBust) picks.push(firstBust);
  if (firstTimeout) picks.push(firstTimeout);
  const seen = new Set<RunResult>();
  const out: { outcome: RunOutcome; path: number[] }[] = [];
  for (const r of picks) {
    if (seen.has(r)) continue;
    seen.add(r);
    out.push({ outcome: r.outcome, path: r.path! });
    if (out.length >= 5) break;
  }
  return out;
}
