"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function num(v: FormDataEntryValue | null, fallback = 0): number {
  if (v == null || v === "") return fallback;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

export async function addInstrument(formData: FormData) {
  const userId = await getUserId();
  const symbol = String(formData.get("symbol") ?? "").trim().toUpperCase();
  if (!symbol) return;
  const fields = {
    name: String(formData.get("name") ?? symbol),
    tickSize: num(formData.get("tickSize"), 0.25),
    tickValue: num(formData.get("tickValue"), 0.5),
    pointValue: num(formData.get("pointValue"), 2),
  };
  await prisma.instrument.upsert({
    where: { userId_symbol: { userId, symbol } },
    update: fields,
    create: { userId, symbol, ...fields },
  });
  revalidatePath("/config");
}

export async function addSetup(formData: FormData) {
  const userId = await getUserId();
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;
  await prisma.setup.upsert({
    where: { userId_nome: { userId, nome } },
    update: {},
    create: { userId, nome },
  });
  revalidatePath("/config");
}

export async function addTag(formData: FormData) {
  const userId = await getUserId();
  const nome = String(formData.get("nome") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "emocao");
  if (!nome) return;
  await prisma.tag.upsert({
    where: { userId_nome_tipo: { userId, nome, tipo } },
    update: {},
    create: { userId, nome, tipo },
  });
  revalidatePath("/config");
}
