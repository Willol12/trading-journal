import { cache } from "react";
import { prisma } from "./db";
import { getUserId } from "./auth";
import type { MetricTrade } from "./metrics";

// Todas as leituras são envolvidas em cache() do React: o layout e a página
// chamam as mesmas funções no mesmo request — cache() deduplica (1 query, não 2).

export const getAccounts = cache(async () => {
  const userId = await getUserId();
  return prisma.account.findMany({
    where: { userId },
    orderBy: [{ ativa: "desc" }, { createdAt: "asc" }],
  });
});

export const getAccount = cache(async (id: string) => {
  const userId = await getUserId();
  // findFirst (não findUnique) para poder exigir o userId — garante que a conta é do usuário.
  return prisma.account.findFirst({ where: { id, userId } });
});

export type AccountRow = Awaited<ReturnType<typeof getAccounts>>[number];

// Resolve a conta selecionada a partir do ?conta=. Default: primeira ativa. (puro)
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

export const getMetricTrades = cache(
  async (accountId?: string): Promise<MetricTrade[]> => {
    const userId = await getUserId();
    const rows = await prisma.trade.findMany({
      where: {
        userId,
        ...(accountId && accountId !== "all" ? { accountId } : {}),
      },
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
  },
);

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

export const getTradeRows = cache(
  async (accountId?: string, limit?: number): Promise<TradeRowView[]> => {
    const userId = await getUserId();
    const rows = await prisma.trade.findMany({
      where: {
        userId,
        ...(accountId && accountId !== "all" ? { accountId } : {}),
      },
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
  },
);

export const getInstruments = cache(async () => {
  const userId = await getUserId();
  return prisma.instrument.findMany({
    where: { userId },
    orderBy: { symbol: "asc" },
  });
});

export const getSetups = cache(async () => {
  const userId = await getUserId();
  return prisma.setup.findMany({
    where: { userId },
    orderBy: { nome: "asc" },
  });
});

export const getTags = cache(async () => {
  const userId = await getUserId();
  return prisma.tag.findMany({
    where: { userId },
    orderBy: { nome: "asc" },
  });
});
