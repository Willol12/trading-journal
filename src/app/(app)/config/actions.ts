"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

function num(v: FormDataEntryValue | null, fallback = 0): number {
  if (v == null || v === "") return fallback;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

export async function addInstrument(formData: FormData) {
  const symbol = String(formData.get("symbol") ?? "").trim().toUpperCase();
  if (!symbol) return;
  await prisma.instrument.upsert({
    where: { symbol },
    update: {
      name: String(formData.get("name") ?? symbol),
      tickSize: num(formData.get("tickSize"), 0.25),
      tickValue: num(formData.get("tickValue"), 0.5),
      pointValue: num(formData.get("pointValue"), 2),
    },
    create: {
      symbol,
      name: String(formData.get("name") ?? symbol),
      tickSize: num(formData.get("tickSize"), 0.25),
      tickValue: num(formData.get("tickValue"), 0.5),
      pointValue: num(formData.get("pointValue"), 2),
    },
  });
  revalidatePath("/config");
}

export async function addSetup(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;
  await prisma.setup.upsert({
    where: { nome },
    update: {},
    create: { nome },
  });
  revalidatePath("/config");
}

export async function addTag(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "emocao");
  if (!nome) return;
  await prisma.tag.upsert({
    where: { nome_tipo: { nome, tipo } },
    update: {},
    create: { nome, tipo },
  });
  revalidatePath("/config");
}
