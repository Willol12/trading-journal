import { prisma } from "@/lib/db";

export async function GET() {
  const [instruments, accounts, setups, tags, trades, tradeTags, journal] =
    await Promise.all([
      prisma.instrument.findMany(),
      prisma.account.findMany(),
      prisma.setup.findMany(),
      prisma.tag.findMany(),
      prisma.trade.findMany(),
      prisma.tradeTag.findMany(),
      prisma.journalEntry.findMany(),
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
