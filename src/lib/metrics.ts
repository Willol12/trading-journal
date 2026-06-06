import { startOfDay, startOfWeek, startOfMonth, format } from "date-fns";

// Forma mínima de trade usada nos cálculos (serializável).
export interface MetricTrade {
  dataHora: Date;
  resultadoValor: number;
  resultado: string; // win | loss | be
  rrRealizado: number | null;
  setupNome: string | null;
  instrumentSymbol: string;
  direcao: string;
  contratos: number;
}

export type Periodo = "hoje" | "semana" | "mes" | "tudo";

const DOW_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function finite(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

export function filterByPeriod(
  trades: MetricTrade[],
  periodo: Periodo,
  ref: Date = new Date(),
): MetricTrade[] {
  if (periodo === "tudo") return trades;
  let start: Date;
  if (periodo === "hoje") start = startOfDay(ref);
  else if (periodo === "semana") start = startOfWeek(ref, { weekStartsOn: 1 });
  else start = startOfMonth(ref);
  return trades.filter((t) => t.dataHora >= start);
}

export interface Summary {
  total: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  netPL: number;
  grossProfit: number;
  grossLoss: number; // valor positivo
  profitFactor: number | null; // null = infinito (ganhos sem perdas)
  avgWin: number;
  avgLoss: number; // valor positivo
  expectancy: number;
  payoff: number | null; // null = infinito (ganhos sem perdas)
  bestTrade: number;
  worstTrade: number;
  maxWinStreak: number;
  maxLossStreak: number;
  avgR: number;
}

export function computeSummary(trades: MetricTrade[]): Summary {
  const total = trades.length;
  let wins = 0,
    losses = 0,
    breakeven = 0,
    grossProfit = 0,
    grossLoss = 0,
    netPL = 0,
    // -Infinity/+Infinity garantem que o 1º trade vira o extremo, mesmo quando
    // todos são do mesmo lado. Sem trades, o finite() no retorno devolve 0.
    bestTrade = -Infinity,
    worstTrade = Infinity,
    rSum = 0,
    rCount = 0,
    maxWinStreak = 0,
    maxLossStreak = 0,
    curWin = 0,
    curLoss = 0;

  for (const t of trades) {
    const v = t.resultadoValor;
    netPL += v;
    if (v > bestTrade) bestTrade = v;
    if (v < worstTrade) worstTrade = v;
    if (t.rrRealizado != null) {
      rSum += t.rrRealizado;
      rCount++;
    }
    if (t.resultado === "win" || v > 0) {
      wins++;
      grossProfit += v;
      curWin++;
      curLoss = 0;
      if (curWin > maxWinStreak) maxWinStreak = curWin;
    } else if (t.resultado === "loss" || v < 0) {
      losses++;
      grossLoss += Math.abs(v);
      curLoss++;
      curWin = 0;
      if (curLoss > maxLossStreak) maxLossStreak = curLoss;
    } else {
      breakeven++;
      curWin = 0;
      curLoss = 0;
    }
  }

  const winRate = total ? (wins / total) * 100 : 0;
  const avgWin = wins ? grossProfit / wins : 0;
  const avgLoss = losses ? grossLoss / losses : 0;
  // null representa fator infinito (ganhos sem nenhuma perda); 0 quando não há ganhos.
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? null : 0;
  const expectancy = total ? netPL / total : 0;
  const payoff = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? null : 0;
  const avgR = rCount ? rSum / rCount : 0;

  return {
    total,
    wins,
    losses,
    breakeven,
    winRate: finite(winRate),
    netPL: finite(netPL),
    grossProfit: finite(grossProfit),
    grossLoss: finite(grossLoss),
    profitFactor: profitFactor === null ? null : finite(profitFactor),
    avgWin: finite(avgWin),
    avgLoss: finite(avgLoss),
    expectancy: finite(expectancy),
    payoff: payoff === null ? null : finite(payoff),
    bestTrade: finite(bestTrade),
    worstTrade: finite(worstTrade),
    maxWinStreak,
    maxLossStreak,
    avgR: finite(avgR),
  };
}

export interface EquityPoint {
  i: number;
  date: string; // ISO
  value: number; // P&L acumulado
}

export function equityCurve(trades: MetricTrade[]): EquityPoint[] {
  const sorted = [...trades].sort(
    (a, b) => a.dataHora.getTime() - b.dataHora.getTime(),
  );
  let cum = 0;
  const points: EquityPoint[] = [{ i: 0, date: "", value: 0 }];
  sorted.forEach((t, idx) => {
    cum += t.resultadoValor;
    points.push({
      i: idx + 1,
      date: t.dataHora.toISOString(),
      value: Number(cum.toFixed(2)),
    });
  });
  return points;
}

export function maxDrawdown(trades: MetricTrade[]): number {
  const sorted = [...trades].sort(
    (a, b) => a.dataHora.getTime() - b.dataHora.getTime(),
  );
  let cum = 0,
    peak = 0,
    maxDD = 0;
  for (const t of sorted) {
    cum += t.resultadoValor;
    if (cum > peak) peak = cum;
    const dd = peak - cum;
    if (dd > maxDD) maxDD = dd;
  }
  return Number(maxDD.toFixed(2));
}

export interface DayPL {
  date: string; // yyyy-MM-dd
  pl: number;
  trades: number;
  contratos: number;
  wins: number;
  winRate: number; // 0..100
}

export function dailyPL(trades: MetricTrade[]): DayPL[] {
  const map = new Map<
    string,
    { pl: number; trades: number; contratos: number; wins: number }
  >();
  for (const t of trades) {
    const key = format(t.dataHora, "yyyy-MM-dd");
    const cur = map.get(key) ?? { pl: 0, trades: 0, contratos: 0, wins: 0 };
    cur.pl += t.resultadoValor;
    cur.trades += 1;
    cur.contratos += t.contratos;
    if (t.resultado === "win" || t.resultadoValor > 0) cur.wins += 1;
    map.set(key, cur);
  }
  return [...map.entries()]
    .map(([date, v]) => ({
      date,
      pl: Number(v.pl.toFixed(2)),
      trades: v.trades,
      contratos: v.contratos,
      wins: v.wins,
      winRate: v.trades ? Math.round((v.wins / v.trades) * 100) : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface GroupPL {
  label: string;
  pl: number;
  trades: number;
}

function groupBy(
  trades: MetricTrade[],
  keyFn: (t: MetricTrade) => string,
): GroupPL[] {
  const map = new Map<string, { pl: number; trades: number }>();
  for (const t of trades) {
    const key = keyFn(t);
    const cur = map.get(key) ?? { pl: 0, trades: 0 };
    cur.pl += t.resultadoValor;
    cur.trades += 1;
    map.set(key, cur);
  }
  return [...map.entries()].map(([label, v]) => ({
    label,
    pl: Number(v.pl.toFixed(2)),
    trades: v.trades,
  }));
}

export function plBySetup(trades: MetricTrade[]): GroupPL[] {
  return groupBy(trades, (t) => t.setupNome ?? "Sem setup").sort(
    (a, b) => b.pl - a.pl,
  );
}

export function plByInstrument(trades: MetricTrade[]): GroupPL[] {
  return groupBy(trades, (t) => t.instrumentSymbol).sort((a, b) => b.pl - a.pl);
}

export function plByDayOfWeek(trades: MetricTrade[]): GroupPL[] {
  const grouped = groupBy(trades, (t) => String(t.dataHora.getDay()));
  const order = [1, 2, 3, 4, 5]; // Seg..Sex
  return order.map((d) => {
    const g = grouped.find((x) => x.label === String(d));
    return { label: DOW_LABELS[d], pl: g?.pl ?? 0, trades: g?.trades ?? 0 };
  });
}

export function plByHour(trades: MetricTrade[]): GroupPL[] {
  const grouped = groupBy(trades, (t) => String(t.dataHora.getHours()));
  return grouped
    .map((g) => ({ ...g, label: `${g.label}h`, _h: Number(g.label) }))
    .sort((a, b) => (a as { _h: number })._h - (b as { _h: number })._h)
    .map(({ label, pl, trades }) => ({ label, pl, trades }));
}

export interface RBucket {
  label: string;
  count: number;
  isNegative: boolean;
}

export function rMultipleDistribution(trades: MetricTrade[]): RBucket[] {
  const buckets: { label: string; min: number; max: number; isNegative: boolean }[] = [
    { label: "≤-2R", min: -Infinity, max: -2, isNegative: true },
    { label: "-2R", min: -2, max: -1, isNegative: true },
    { label: "-1R", min: -1, max: 0, isNegative: true },
    { label: "+1R", min: 0, max: 1, isNegative: false },
    { label: "+2R", min: 1, max: 2, isNegative: false },
    { label: "+3R", min: 2, max: 3, isNegative: false },
    { label: "≥+4R", min: 3, max: Infinity, isNegative: false },
  ];
  const counts = buckets.map((b) => ({ label: b.label, count: 0, isNegative: b.isNegative }));
  for (const t of trades) {
    // Breakeven / R=0 não é perda nem ganho — não entra na distribuição
    // (senão R=0 cairia no balde "-1R" e apareceria como perda).
    if (t.rrRealizado == null || t.rrRealizado === 0 || t.resultado === "be") continue;
    const r = t.rrRealizado;
    const idx = buckets.findIndex((b) => r > b.min && r <= b.max);
    if (idx >= 0) counts[idx].count++;
  }
  return counts;
}

export function winLossSequence(trades: MetricTrade[]): ("win" | "loss" | "be")[] {
  return [...trades]
    .sort((a, b) => a.dataHora.getTime() - b.dataHora.getTime())
    .map((t) =>
      t.resultado === "win" || t.resultadoValor > 0
        ? "win"
        : t.resultado === "loss" || t.resultadoValor < 0
          ? "loss"
          : "be",
    );
}

// ---- Status da mesa / prop firm ----
export interface MesaInput {
  saldoInicial: number;
  metaProfit: number | null;
  limitePerdaDiario: number | null;
  maxDrawdown: number | null;
  tipoDrawdown: string;
}

export interface MesaStatus {
  currentProfit: number;
  currentEquity: number;
  peakEquity: number;
  metaProfit: number | null;
  progressoMeta: number; // 0..1
  faltaMeta: number;
  drawdownFloorEquity: number | null;
  folgaDrawdown: number | null; // distância até estourar
  maxDrawdown: number | null;
  plHoje: number;
  limitePerdaDiario: number | null;
  restanteHoje: number | null;
  dentroDasRegras: boolean;
}

export function mesaStatus(
  mesa: MesaInput,
  trades: MetricTrade[],
  ref: Date = new Date(),
): MesaStatus {
  const sorted = [...trades].sort(
    (a, b) => a.dataHora.getTime() - b.dataHora.getTime(),
  );
  let cum = 0;
  let peakIntraday = 0;
  const eodCum = new Map<string, number>(); // saldo no fim de cada dia
  for (const t of sorted) {
    cum += t.resultadoValor;
    if (cum > peakIntraday) peakIntraday = cum;
    eodCum.set(format(t.dataHora, "yyyy-MM-dd"), cum);
  }
  // Trailing EOD (ex.: Lucid): o pico segue o saldo de FIM DE DIA, não o intraday.
  const peakEod = Math.max(0, ...eodCum.values());
  const peak = mesa.tipoDrawdown === "eod" ? peakEod : peakIntraday;
  const currentProfit = Number(cum.toFixed(2));
  const peakEquity = mesa.saldoInicial + peak;
  const currentEquity = mesa.saldoInicial + currentProfit;

  let drawdownFloorEquity: number | null = null;
  let folgaDrawdown: number | null = null;
  if (mesa.maxDrawdown != null) {
    if (mesa.tipoDrawdown === "static") {
      drawdownFloorEquity = mesa.saldoInicial - mesa.maxDrawdown;
    } else {
      // trailing / eod: piso segue o pico, trava no saldo inicial
      const floor = peakEquity - mesa.maxDrawdown;
      drawdownFloorEquity = Math.min(
        Math.max(floor, mesa.saldoInicial - mesa.maxDrawdown),
        mesa.saldoInicial,
      );
    }
    folgaDrawdown = Number((currentEquity - drawdownFloorEquity).toFixed(2));
  }

  const todayStart = startOfDay(ref);
  const plHoje = Number(
    sorted
      .filter((t) => t.dataHora >= todayStart)
      .reduce((s, t) => s + t.resultadoValor, 0)
      .toFixed(2),
  );
  const restanteHoje =
    mesa.limitePerdaDiario != null
      ? Number((mesa.limitePerdaDiario + Math.min(plHoje, 0)).toFixed(2))
      : null;

  const progressoMeta = mesa.metaProfit
    ? Math.max(0, Math.min(1, currentProfit / mesa.metaProfit))
    : 0;
  const faltaMeta = mesa.metaProfit
    ? Number(Math.max(0, mesa.metaProfit - currentProfit).toFixed(2))
    : 0;

  const dentroDasRegras =
    (folgaDrawdown == null || folgaDrawdown > 0) &&
    (restanteHoje == null || restanteHoje > 0);

  return {
    currentProfit,
    currentEquity: Number(currentEquity.toFixed(2)),
    peakEquity: Number(peakEquity.toFixed(2)),
    metaProfit: mesa.metaProfit,
    progressoMeta,
    faltaMeta,
    drawdownFloorEquity:
      drawdownFloorEquity != null ? Number(drawdownFloorEquity.toFixed(2)) : null,
    folgaDrawdown,
    maxDrawdown: mesa.maxDrawdown,
    plHoje,
    limitePerdaDiario: mesa.limitePerdaDiario,
    restanteHoje,
    dentroDasRegras,
  };
}
