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

function parse(formData: FormData) {
  return {
    nome: String(formData.get("nome") ?? "").trim() || "Conta",
    firm: (formData.get("firm") as string) || null,
    tamanho: (formData.get("tamanho") as string) || null,
    tipo: String(formData.get("tipo") ?? "eval"),
    saldoInicial: num(formData.get("saldoInicial")) ?? 0,
    moeda: String(formData.get("moeda") ?? "USD"),
    metaProfit: num(formData.get("metaProfit")),
    limitePerdaDiario: num(formData.get("limitePerdaDiario")),
    maxDrawdown: num(formData.get("maxDrawdown")),
    tipoDrawdown: String(formData.get("tipoDrawdown") ?? "trailing"),
    consistenciaPct: num(formData.get("consistenciaPct")),
    minDiasTrade: num(formData.get("minDiasTrade")) ?? null,
    ativa: formData.get("ativa") === "on",
  };
}

export async function createAccount(formData: FormData) {
  const userId = await getUserId();
  const data = parse(formData);
  await prisma.account.create({
    data: { ...data, userId, minDiasTrade: data.minDiasTrade ?? undefined },
  });
  revalidatePath("/contas");
  revalidatePath("/");
  redirect("/contas");
}

export async function updateAccount(id: string, formData: FormData) {
  const userId = await getUserId();
  const data = parse(formData);
  // updateMany com userId garante que só atualiza conta do próprio usuário.
  const { count } = await prisma.account.updateMany({
    where: { id, userId },
    data: { ...data, minDiasTrade: data.minDiasTrade ?? null },
  });
  if (count === 0) throw new Error("Conta não encontrada.");
  revalidatePath("/contas");
  revalidatePath("/");
  redirect("/contas");
}

export async function deleteAccount(id: string) {
  const userId = await getUserId();
  await prisma.account.deleteMany({ where: { id, userId } });
  revalidatePath("/contas");
  revalidatePath("/");
  redirect("/contas");
}
