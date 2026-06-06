"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { CHECKLIST_ITEMS } from "@/lib/journal";

export async function saveJournal(formData: FormData) {
  const userId = await getUserId();
  const accountId = (formData.get("accountId") as string) || null;
  const dataStr = String(formData.get("data") ?? "");
  if (!dataStr) throw new Error("Data obrigatória.");
  const data = new Date(`${dataStr}T12:00:00`);

  const planoPreMarket = (formData.get("planoPreMarket") as string) || null;
  const reviewPosMarket = (formData.get("reviewPosMarket") as string) || null;
  const notaRaw = formData.get("notaDisciplina");
  const notaDisciplina = notaRaw != null && notaRaw !== "" ? Number(notaRaw) : null;
  const checklist = CHECKLIST_ITEMS.map((_, i) => formData.get(`chk_${i}`) === "on");
  const checklistJson = JSON.stringify(checklist);

  const existing = await prisma.journalEntry.findFirst({
    where: { userId, data, accountId },
  });

  if (existing) {
    await prisma.journalEntry.update({
      where: { id: existing.id },
      data: { planoPreMarket, reviewPosMarket, notaDisciplina, checklistJson },
    });
  } else {
    await prisma.journalEntry.create({
      data: {
        userId,
        data,
        accountId,
        planoPreMarket,
        reviewPosMarket,
        notaDisciplina,
        checklistJson,
      },
    });
  }

  revalidatePath("/diario");
  redirect(`/diario?data=${dataStr}${accountId ? `&conta=${accountId}` : ""}`);
}
