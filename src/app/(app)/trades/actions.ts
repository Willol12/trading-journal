"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function num(v: FormDataEntryValue | null): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

async function buildData(formData: FormData, userId: string) {
  const accountId = String(formData.get("accountId") ?? "");
  const instrumentId = String(formData.get("instrumentId") ?? "");
  const direcao = String(formData.get("direcao") ?? "long");
  const contratos = Math.max(1, Math.round(num(formData.get("contratos")) ?? 1));
  const precoEntrada = num(formData.get("precoEntrada"));
  const precoStop = num(formData.get("precoStop"));
  const precoSaida = num(formData.get("precoSaida"));
  const setupId = (formData.get("setupId") as string) || null;
  const notas = (formData.get("notas") as string) || null;
  const dataHoraRaw = String(formData.get("dataHora") ?? "");
  const dataHora = dataHoraRaw ? new Date(dataHoraRaw) : new Date();

  // Garante que o instrumento é do próprio usuário.
  const instrument = await prisma.instrument.findFirst({
    where: { id: instrumentId, userId },
  });
  const pointValue = instrument?.pointValue ?? 1;

  // 1) Pontos do resultado: preços (entrada+saída) têm prioridade; senão campo manual.
  let resultadoPontos = num(formData.get("resultadoPontos"));
  const temPrecos = precoEntrada != null && precoSaida != null;
  if (temPrecos) {
    const diff = precoSaida! - precoEntrada!;
    resultadoPontos = Number((direcao === "short" ? -diff : diff).toFixed(4));
  }

  // 2) P&L US$: prioridade => preços > P&L digitado direto > pontos manuais.
  const plDireto = num(formData.get("resultadoValor")); // Net PNL digitado
  const resultadoValor = temPrecos
    ? Number((resultadoPontos! * pointValue * contratos).toFixed(2))
    : plDireto != null
      ? plDireto
      : resultadoPontos != null
        ? Number((resultadoPontos * pointValue * contratos).toFixed(2))
        : 0;

  // 3) Risco US$: campo "risco" (US$ ou pontos) > cálculo por entrada+stop.
  let riscoValor: number | null = null;
  const riscoInput = num(formData.get("risco"));
  const riscoUnidade = String(formData.get("riscoUnidade") ?? "usd");
  if (riscoInput != null) {
    riscoValor =
      riscoUnidade === "pontos"
        ? Number((riscoInput * pointValue * contratos).toFixed(2))
        : riscoInput;
  } else if (precoEntrada != null && precoStop != null) {
    riscoValor = Number((Math.abs(precoEntrada - precoStop) * pointValue * contratos).toFixed(2));
  }

  // 4) Resultado e R realizado.
  let resultado = String(formData.get("resultado") ?? "auto");
  if (resultado === "auto") {
    resultado = resultadoValor > 0 ? "win" : resultadoValor < 0 ? "loss" : "be";
  }
  const rrRealizado =
    riscoValor && riscoValor > 0
      ? Number((resultadoValor / riscoValor).toFixed(2))
      : null;

  return {
    accountId,
    instrumentId,
    dataHora,
    direcao,
    contratos,
    precoEntrada,
    precoStop,
    precoSaida,
    resultadoPontos,
    resultadoValor,
    comissoes: num(formData.get("comissoes")) ?? 0,
    riscoValor,
    rrPlanejado: num(formData.get("rrPlanejado")),
    rrRealizado,
    resultado,
    setupId,
    notas,
  };
}

async function syncTags(tradeId: string, formData: FormData, userId: string) {
  // Só aceita tags que pertencem ao usuário.
  const requested = formData.getAll("tagIds").map(String).filter(Boolean);
  const owned = requested.length
    ? await prisma.tag.findMany({
        where: { id: { in: requested }, userId },
        select: { id: true },
      })
    : [];
  await prisma.tradeTag.deleteMany({ where: { tradeId } });
  if (owned.length) {
    await prisma.tradeTag.createMany({
      data: owned.map((t) => ({ tradeId, tagId: t.id })),
    });
  }
}

export async function createTrade(formData: FormData) {
  const userId = await getUserId();
  const data = await buildData(formData, userId);
  if (!data.accountId || !data.instrumentId) {
    throw new Error("Conta e instrumento são obrigatórios.");
  }
  // Confirma que a conta é do usuário antes de criar o trade.
  const account = await prisma.account.findFirst({
    where: { id: data.accountId, userId },
    select: { id: true },
  });
  if (!account) throw new Error("Conta inválida.");

  const trade = await prisma.trade.create({ data: { ...data, userId } });
  await syncTags(trade.id, formData, userId);
  revalidatePath("/trades");
  revalidatePath("/");
  redirect(`/trades?conta=${data.accountId}`);
}

export async function updateTrade(id: string, formData: FormData) {
  const userId = await getUserId();
  const data = await buildData(formData, userId);
  // updateMany com userId garante que só atualiza se o trade for do usuário.
  const { count } = await prisma.trade.updateMany({
    where: { id, userId },
    data,
  });
  if (count === 0) throw new Error("Trade não encontrado.");
  await syncTags(id, formData, userId);
  revalidatePath("/trades");
  revalidatePath("/");
  redirect(`/trades?conta=${data.accountId}`);
}

export async function deleteTrade(id: string, accountId: string) {
  const userId = await getUserId();
  await prisma.trade.deleteMany({ where: { id, userId } });
  revalidatePath("/trades");
  revalidatePath("/");
  redirect(`/trades?conta=${accountId}`);
}
