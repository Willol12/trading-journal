// Templates de regras das prop firms (planos 25k/50k).
// Valores levantados em jun/2026 — tratar como SEMENTE editável.
// Regras variam por tipo de conta dentro de cada firm e mudam com frequência:
// sempre confirme no site oficial da mesa.

export type TipoDrawdown = "trailing" | "eod" | "static" | "intraday";

export interface MesaTemplate {
  tamanho: string; // ex.: "25k"
  saldoInicial: number;
  metaProfit: number | null;
  limitePerdaDiario: number | null;
  maxDrawdown: number | null; // em US$
  tipoDrawdown: TipoDrawdown;
  consistenciaPct: number | null;
  minDiasTrade: number | null;
  obs?: string;
}

export interface PropFirm {
  key: string;
  nome: string;
  planos: MesaTemplate[];
}

export const PROP_FIRMS: PropFirm[] = [
  {
    key: "lucid",
    nome: "Lucid Trading",
    planos: [
      {
        tamanho: "25k",
        saldoInicial: 25000,
        metaProfit: 1250,
        limitePerdaDiario: null,
        maxDrawdown: 1000,
        tipoDrawdown: "eod",
        consistenciaPct: 50,
        minDiasTrade: 2,
        obs: "LucidFlex: drawdown EOD, sem limite diário, mín. 2 dias.",
      },
      {
        tamanho: "50k",
        saldoInicial: 50000,
        metaProfit: 3000,
        limitePerdaDiario: null,
        maxDrawdown: 2000,
        tipoDrawdown: "eod",
        consistenciaPct: 50,
        minDiasTrade: 2,
        obs: "LucidFlex: drawdown EOD, sem limite diário, mín. 2 dias.",
      },
    ],
  },
  {
    key: "apex",
    nome: "Apex Trader Funding",
    planos: [
      {
        tamanho: "25k",
        saldoInicial: 25000,
        metaProfit: 1500,
        limitePerdaDiario: null,
        maxDrawdown: 1500,
        tipoDrawdown: "trailing",
        consistenciaPct: null,
        minDiasTrade: null,
        obs: "Intraday: sem limite diário. Variante EOD tem limite diário.",
      },
      {
        tamanho: "50k",
        saldoInicial: 50000,
        metaProfit: 3000,
        limitePerdaDiario: null,
        maxDrawdown: 2500,
        tipoDrawdown: "trailing",
        consistenciaPct: null,
        minDiasTrade: null,
        obs: "Intraday: sem limite diário. Variante EOD tem DLL ~US$1.000.",
      },
    ],
  },
  {
    key: "takeprofit",
    nome: "TakeProfit Trader",
    planos: [
      {
        tamanho: "25k",
        saldoInicial: 25000,
        metaProfit: 1500,
        limitePerdaDiario: null,
        maxDrawdown: 1500,
        tipoDrawdown: "eod",
        consistenciaPct: null,
        minDiasTrade: 5,
        obs: "Sem limite diário desde 2025. Mín. 5 dias de trade.",
      },
      {
        tamanho: "50k",
        saldoInicial: 50000,
        metaProfit: 3000,
        limitePerdaDiario: null,
        maxDrawdown: 2000,
        tipoDrawdown: "eod",
        consistenciaPct: null,
        minDiasTrade: 5,
        obs: "Sem limite diário desde 2025. Mín. 5 dias de trade.",
      },
    ],
  },
  {
    key: "topstep",
    nome: "Topstep",
    planos: [
      {
        tamanho: "50k",
        saldoInicial: 50000,
        metaProfit: 3000,
        limitePerdaDiario: 1000,
        maxDrawdown: 2000,
        tipoDrawdown: "eod",
        consistenciaPct: 50,
        minDiasTrade: null,
        obs: "Combine: trailing EOD; congela quando saldo EOD atinge +US$2.000.",
      },
    ],
  },
  {
    key: "tradeify",
    nome: "Tradeify",
    planos: [
      {
        tamanho: "25k",
        saldoInicial: 25000,
        metaProfit: 1500,
        limitePerdaDiario: 1000,
        maxDrawdown: 1500,
        tipoDrawdown: "eod",
        consistenciaPct: null,
        minDiasTrade: null,
        obs: "Valores variam por plano (Growth/Select/Lightning) e data — confirmar.",
      },
      {
        tamanho: "50k",
        saldoInicial: 50000,
        metaProfit: 3000,
        limitePerdaDiario: 2000,
        maxDrawdown: 2000,
        tipoDrawdown: "eod",
        consistenciaPct: null,
        minDiasTrade: null,
        obs: "Valores variam por plano (Growth/Select/Lightning) e data — confirmar.",
      },
    ],
  },
  {
    key: "holaprime",
    nome: "Hola Prime (Futuros)",
    planos: [
      {
        tamanho: "25k",
        saldoInicial: 25000,
        metaProfit: 1500, // 6%
        limitePerdaDiario: null,
        maxDrawdown: 1000, // 4% trailing
        tipoDrawdown: "trailing",
        consistenciaPct: null,
        minDiasTrade: 2,
        obs: "1-step: meta 6%, drawdown trailing 4%, sem limite diário (futuros).",
      },
      {
        tamanho: "50k",
        saldoInicial: 50000,
        metaProfit: 3000, // 6%
        limitePerdaDiario: null,
        maxDrawdown: 2000, // 4% trailing
        tipoDrawdown: "trailing",
        consistenciaPct: null,
        minDiasTrade: 2,
        obs: "1-step: meta 6%, drawdown trailing 4%, sem limite diário (futuros).",
      },
    ],
  },
];

export function getFirm(key: string): PropFirm | undefined {
  return PROP_FIRMS.find((f) => f.key === key);
}

export function getTemplate(
  firmKey: string,
  tamanho: string,
): MesaTemplate | undefined {
  return getFirm(firmKey)?.planos.find((p) => p.tamanho === tamanho);
}
