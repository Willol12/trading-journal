import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Zera os dados de ATIVIDADE (trades, tags de trade, diário).
// Mantém: contas/mesas, instrumentos, setups e tags.
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const t = await prisma.tradeTag.deleteMany({});
  const tr = await prisma.trade.deleteMany({});
  const j = await prisma.journalEntry.deleteMany({});
  console.log(
    `Zerado: ${tr.count} trades, ${t.count} vínculos de tag, ${j.count} entradas de diário.`,
  );
  console.log("Mantidos: contas, instrumentos, setups e tags.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
