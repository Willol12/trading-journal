import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const [instruments, accounts, setups, tags, trades, tradeTags, journal] =
    await Promise.all([
      prisma.instrument.findMany({ where: { userId } }),
      prisma.account.findMany({ where: { userId } }),
      prisma.setup.findMany({ where: { userId } }),
      prisma.tag.findMany({ where: { userId } }),
      prisma.trade.findMany({ where: { userId } }),
      // TradeTag herda o dono via trade — filtra pelo trade do usuário.
      prisma.tradeTag.findMany({ where: { trade: { userId } } }),
      prisma.journalEntry.findMany({ where: { userId } }),
    ]);

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { instruments, accounts, setups, tags, trades, tradeTags, journal },
  };

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="backup-${Date.now()}.json"`,
    },
  });
}
