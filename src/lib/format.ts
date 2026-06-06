// Helpers de formatação PT-BR

export type Moeda = "USD" | "BRL";

// Formata valor (sempre armazenado em USD) na moeda escolhida.
export function formatMoney(
  n: number,
  opts: {
    moeda?: Moeda;
    rate?: number; // USD -> BRL
    signed?: boolean;
    decimals?: number;
    compact?: boolean; // símbolo curto e sem espaço (ex.: +$194 / +R$1.046)
  } = {},
): string {
  const { moeda = "USD", rate = 1, signed = false, decimals = 2, compact = false } = opts;
  const v = moeda === "BRL" ? n * rate : n;
  const sym = moeda === "BRL" ? "R$" : compact ? "$" : "US$";
  const lead = signed ? (v > 0 ? "+" : v < 0 ? "-" : "") : v < 0 ? "-" : "";
  const abs = Math.abs(v).toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return compact ? `${lead}${sym}${abs}` : `${lead}${sym} ${abs}`;
}

export function fmtMoney(
  n: number,
  opts: { signed?: boolean; decimals?: number } = {},
): string {
  const { signed = false, decimals = 2 } = opts;
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  const abs = Math.abs(n).toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${signed ? sign : n < 0 ? "-" : ""}US$ ${abs}`;
}

export function fmtNumber(n: number, decimals = 2): string {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtPoints(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${fmtNumber(n, 2)}`;
}

export function fmtPct(n: number, decimals = 0): string {
  return `${fmtNumber(n, decimals)}%`;
}

export function fmtR(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${fmtNumber(n, 1)}R`;
}

export function fmtFactor(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "∞";
  return fmtNumber(n, 2);
}

export function plColor(n: number): string {
  if (n > 0) return "text-profit";
  if (n < 0) return "text-loss";
  return "text-muted";
}
