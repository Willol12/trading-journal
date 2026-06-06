import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getTemplate } from "../src/lib/propFirms";

// Ferramenta de DEV: popula dados de EXEMPLO para um usuário específico.
// Multi-tenancy: os dados-padrão (instrumentos/setups/tags) o app cria sozinho
// quando o usuário loga (ver src/lib/provision.ts). Este script adiciona uma
// conta demo + trades de exemplo para você visualizar o dashboard preenchido.
//
// Uso:  SEED_USER_ID=<id> SEED_SAMPLE=1 npm run seed
// O id é o auth.users.id (claim sub). Faça login no app pelo menos 1x antes.

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const userId = process.env.SEED_USER_ID ?? "";

const INSTRUMENTS = [
  { symbol: "MNQ", name: "Micro E-mini Nasdaq-100", tickSize: 0.25, tickValue: 0.5, pointValue: 2.0 },
  { symbol: "MES", name: "Micro E-mini S&P 500", tickSize: 0.25, tickValue: 1.25, pointValue: 5.0 },
];

async function ensureDefaults() {
  for (const inst of INSTRUMENTS) {
    await prisma.instrument.upsert({
      where: { userId_symbol: { userId, symbol: inst.symbol } },
      update: {},
      create: { ...inst, userId },
    });
  }
}

async function main() {
  if (!userId) {
    console.error(
      "Defina SEED_USER_ID com o id do usuário (auth.users.id).\n" +
        "Faça login no app primeiro — o onboarding cria os defaults automaticamente.",
    );
    process.exit(1);
  }

  await ensureDefaults();

  const tpl = getTemplate("lucid", "25k");
  const account = await prisma.account.upsert({
    where: { id: `demo-${userId}` },
    update: {},
    create: {
      id: `demo-${userId}`,
      userId,
      nome: "Lucid 25k Eval",
      firm: "lucid",
      tamanho: "25k",
      tipo: "eval",
      saldoInicial: tpl?.saldoInicial ?? 25000,
      metaProfit: tpl?.metaProfit ?? 1250,
      limitePerdaDiario: tpl?.limitePerdaDiario ?? null,
      maxDrawdown: tpl?.maxDrawdown ?? 1000,
      tipoDrawdown: tpl?.tipoDrawdown ?? "eod",
      consistenciaPct: tpl?.consistenciaPct ?? 50,
      minDiasTrade: tpl?.minDiasTrade ?? 2,
      ativa: true,
    },
  });

  if (process.env.SEED_SAMPLE === "1") {
    await seedSampleTrades(account.id);
  }

  console.log("Seed concluído para o usuário", userId);
}

async function seedSampleTrades(accountId: string) {
  const existing = await prisma.trade.count({ where: { accountId } });
  if (existing > 0) {
    console.log("Trades de exemplo já existem — pulando.");
    return;
  }

  const mnq = await prisma.instrument.findFirst({ where: { userId, symbol: "MNQ" } });
  const mes = await prisma.instrument.findFirst({ where: { userId, symbol: "MES" } });
  const setups = await prisma.setup.findMany({ where: { userId } });
  if (!mnq || !mes) return;

  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const trades = [];
  for (let day = 1; day <= 26; day++) {
    const date = new Date(2026, 5, day, 9, 30, 0);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;
    const nTrades = 1 + Math.floor(rand() * 4);
    for (let i = 0; i < nTrades; i++) {
      const inst = rand() > 0.3 ? mnq : mes;
      const contratos = 1 + Math.floor(rand() * 3);
      const isWin = rand() > 0.36;
      const direcao = rand() > 0.5 ? "long" : "short";
      const setup = setups[Math.floor(rand() * setups.length)];
      const riscoPontos = 6 + rand() * 6;
      const rMult = isWin ? 0.8 + rand() * 2.2 : -(0.4 + rand() * 0.8);
      const pontos = Number((rMult * riscoPontos).toFixed(2));
      const resultadoValor = Number((pontos * inst.pointValue * contratos).toFixed(2));
      const riscoValor = Number((riscoPontos * inst.pointValue * contratos).toFixed(2));
      const hora = 9 + Math.floor(rand() * 6);
      const minuto = Math.floor(rand() * 60);
      trades.push({
        userId,
        accountId,
        dataHora: new Date(2026, 5, day, hora, minuto, 0),
        instrumentId: inst.id,
        direcao,
        contratos,
        resultadoPontos: pontos,
        resultadoValor,
        comissoes: Number((0.7 * contratos).toFixed(2)),
        riscoValor,
        rrPlanejado: 2,
        rrRealizado: Number(rMult.toFixed(2)),
        resultado: isWin ? "win" : "loss",
        setupId: setup?.id ?? null,
      });
    }
  }

  await prisma.trade.createMany({ data: trades });
  console.log(`Criados ${trades.length} trades de exemplo.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
