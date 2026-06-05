import { prisma } from "./db";
import type { MetricTrade } from "./metrics";

export async function getAccounts() {
  return prisma.account.findMany({
    orderBy: [{ ativa: "desc" }, { createdAt: "asc" }],
  });
}

export async function getAccount(id: string) {
  return prisma.account.findUnique({ where: { id } });
}

export type AccountRow = Awaited<ReturnType<typeof getAccounts>>[number];

// Resolve a conta selecionada a partir do ?conta=. Default: primeira ativa.
export function resolveAccount(
  accounts: AccountRow[],
  contaParam?: string,
): AccountRow | null {
  if (contaParam && contaParam !== "all") {
    const found = accounts.find((a) => a.id === contaParam);
    if (found) return found;
  }
  return accounts.find((a) => a.ativa) ?? accounts[0] ?? null;
}

export async function getMetricTrades(accountId?: string): Promise<MetricTrade[]> {
  const rows = await prisma.trade.findMany({
    where: accountId && accountId !== "all" ? { accountId } : undefined,
    include: { setup: true, instrument: true },
    orderBy: { dataHora: "asc" },
  });
  return rows.map((r) => ({
    dataHora: r.dataHora,
    resultadoValor: r.resultadoValor,
    resultado: r.resultado,
    rrRealizado: r.rrRealizado,
    setupNome: r.setup?.nome ?? null,
    instrumentSymbol: r.instrument.symbol,
    direcao: r.direcao,
    contratos: r.contratos,
  }));
}

export interface TradeRowView {
  id: string;
  dataHora: Date;
  instrumentSymbol: string;
  direcao: string;
  contratos: number;
  setupNome: string | null;
  resultado: string;
  rrRealizado: number | null;
  resultadoPontos: number | null;
  resultadoValor: number;
}

export async function getTradeRows(
  accountId?: string,
  limit?: number,
): Promise<TradeRowView[]> {
  const rows = await prisma.trade.findMany({
    where: accountId && accountId !== "all" ? { accountId } : undefined,
    include: { setup: true, instrument: true },
    orderBy: { dataHora: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    dataHora: r.dataHora,
    instrumentSymbol: r.instrument.symbol,
    direcao: r.direcao,
    contratos: r.contratos,
    setupNome: r.setup?.nome ?? null,
    resultado: r.resultado,
    rrRealizado: r.rrRealizado,
    resultadoPontos: r.resultadoPontos,
    resultadoValor: r.resultadoValor,
  }));
}

export async function getInstruments() {
  return prisma.instrument.findMany({ orderBy: { symbol: "asc" } });
}

export async function getSetups() {
  return prisma.setup.findMany({ orderBy: { nome: "asc" } });
}

export async function getTags() {
  return prisma.tag.findMany({ orderBy: { nome: "asc" } });
}
