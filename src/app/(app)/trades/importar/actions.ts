"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export interface ImportRow {
  dataHora?: string;
  symbol?: string;
  direcao?: string;
  contratos?: string;
  pontos?: string;
  pl?: string;
  risco?: string;
  rr?: string;
  resultado?: string;
  setup?: string;
  notas?: string;
}

function num(v?: string): number | null {
  if (v == null || v === "") return null;
  // aceita "1.234,56" e "1234.56"
  const cleaned = v.replace(/\s/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function normDirecao(v?: string): string {
  const s = (v ?? "").toLowerCase();
  if (s.startsWith("s") || s.includes("sell") || s.includes("short")) return "short";
  return "long";
}

export async function importTrades(payload: {
  accountId: string;
  rows: ImportRow[];
}): Promise<{ inserted: number; skipped: number }> {
  const { accountId, rows } = payload;
  if (!accountId) throw new Error("Conta obrigatória.");

  const userId = await getUserId();
  // Confirma que a conta de destino é do próprio usuário.
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
    select: { id: true },
  });
  if (!account) throw new Error("Conta inválida.");

  // cache de instrumentos e setups
  const instCache = new Map<string, { id: string; pointValue: number }>();
  const setupCache = new Map<string, string>();

  async function instrument(symbol: string) {
    const key = symbol.toUpperCase();
    if (instCache.has(key)) return instCache.get(key)!;
    let inst = await prisma.instrument.findFirst({ where: { symbol: key, userId } });
    if (!inst) {
      inst = await prisma.instrument.create({
        data: { userId, symbol: key, name: key, tickSize: 0.25, tickValue: 0.5, pointValue: 2 },
      });
    }
    const v = { id: inst.id, pointValue: inst.pointValue };
    instCache.set(key, v);
    return v;
  }

  async function setupId(nome?: string) {
    const n = (nome ?? "").trim();
    if (!n) return null;
    if (setupCache.has(n)) return setupCache.get(n)!;
    const s = await prisma.setup.upsert({
      where: { userId_nome: { userId, nome: n } },
      update: {},
      create: { userId, nome: n },
    });
    setupCache.set(n, s.id);
    return s.id;
  }

  let inserted = 0;
  let skipped = 0;

  for (const r of rows) {
    const symbol = (r.symbol ?? "").trim();
    if (!symbol) {
      skipped++;
      continue;
    }
    const inst = await instrument(symbol);
    const contratos = Math.max(1, Math.round(num(r.contratos) ?? 1));
    const pontos = num(r.pontos);
    const plProvided = num(r.pl);
    const resultadoValor =
      plProvided != null
        ? plProvided
        : pontos != null
          ? Number((pontos * inst.pointValue * contratos).toFixed(2))
          : 0;
    let resultado = (r.resultado ?? "").toLowerCase();
    if (!["win", "loss", "be"].includes(resultado)) {
      resultado = resultadoValor > 0 ? "win" : resultadoValor < 0 ? "loss" : "be";
    }
    const risco = num(r.risco);
    const dt = r.dataHora ? new Date(r.dataHora) : new Date();
    const dataHora = isNaN(dt.getTime()) ? new Date() : dt;

    await prisma.trade.create({
      data: {
        userId,
        accountId,
        instrumentId: inst.id,
        dataHora,
        direcao: normDirecao(r.direcao),
        contratos,
        resultadoPontos: pontos,
        resultadoValor,
        riscoValor: risco,
        rrRealizado:
          num(r.rr) ?? (risco && risco > 0 ? Number((resultadoValor / risco).toFixed(2)) : null),
        resultado,
        setupId: await setupId(r.setup),
        notas: r.notas || null,
      },
    });
    inserted++;
  }

  revalidatePath("/trades");
  revalidatePath("/");
  return { inserted, skipped };
}
