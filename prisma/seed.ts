import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getTemplate } from "../src/lib/propFirms";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const INSTRUMENTS = [
  { symbol: "MNQ", name: "Micro E-mini Nasdaq-100", tickSize: 0.25, tickValue: 0.5, pointValue: 2.0 },
  { symbol: "MES", name: "Micro E-mini S&P 500", tickSize: 0.25, tickValue: 1.25, pointValue: 5.0 },
];

const SETUPS = [
  { nome: "Pullback tendência", descricao: "Entrada a favor da tendência após recuo." },
  { nome: "Rompimento", descricao: "Rompimento de range/estrutura." },
  { nome: "Reversão VWAP", descricao: "Reversão na VWAP." },
  { nome: "Renko 3-bar", descricao: "Padrão de 3 tijolos Renko." },
  { nome: "Range fade", descricao: "Operar contra os extremos do range." },
];

const TAGS: { nome: string; tipo: "emocao" | "erro" }[] = [
  { nome: "Disciplinado", tipo: "emocao" },
  { nome: "Confiante", tipo: "emocao" },
  { nome: "Ansioso", tipo: "emocao" },
  { nome: "FOMO", tipo: "emocao" },
  { nome: "Entrada antecipada", tipo: "erro" },
  { nome: "Moveu o stop", tipo: "erro" },
  { nome: "Overtrading", tipo: "erro" },
  { nome: "Sem plano", tipo: "erro" },
];

const DEMO_ACCOUNT_ID = "demo-lucid-25k";

async function main() {
  // Instrumentos
  for (const inst of INSTRUMENTS) {
    await prisma.instrument.upsert({
      where: { symbol: inst.symbol },
      update: inst,
      create: inst,
    });
  }

  // Setups
  for (const s of SETUPS) {
    await prisma.setup.upsert({
      where: { nome: s.nome },
      update: { descricao: s.descricao },
      create: s,
    });
  }

  // Tags
  for (const t of TAGS) {
    await prisma.tag.upsert({
      where: { nome_tipo: { nome: t.nome, tipo: t.tipo } },
      update: {},
      create: t,
    });
  }

  // Conta demo (Lucid 25k Eval) a partir do template
  const tpl = getTemplate("lucid", "25k");
  await prisma.account.upsert({
    where: { id: DEMO_ACCOUNT_ID },
    update: {},
    create: {
      id: DEMO_ACCOUNT_ID,
      nome: "Lucid 25k Eval",
      firm: "lucid",
      tamanho: "25k",
      tipo: "eval",
      saldoInicial: tpl?.saldoInicial ?? 25000,
      metaProfit: tpl?.metaProfit ?? 1250,
      limitePerdaDiario: tpl?.limitePerdaDiario ?? null,
      maxDrawdown: tpl?.maxDrawdown ?? 1500,
      tipoDrawdown: tpl?.tipoDrawdown ?? "eod",
      consistenciaPct: tpl?.consistenciaPct ?? 50,
      minDiasTrade: tpl?.minDiasTrade ?? 2,
      ativa: true,
    },
  });

  // Dados de exemplo (opcional): SEED_SAMPLE=1
  if (process.env.SEED_SAMPLE === "1") {
    await seedSampleTrades();
  }

  console.log("Seed concluído.");
}

async function seedSampleTrades() {
  const existing = await prisma.trade.count({ where: { accountId: DEMO_ACCOUNT_ID } });
  if (existing > 0) {
    console.log("Trades de exemplo já existem — pulando.");
    return;
  }

  const mnq = await prisma.instrument.findUnique({ where: { symbol: "MNQ" } });
  const mes = await prisma.instrument.findUnique({ where: { symbol: "MES" } });
  const setups = await prisma.setup.findMany();
  if (!mnq || !mes) return;

  // Gerador determinístico simples
  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const trades = [];
  // ~3 semanas de junho/2026, dias úteis, 1-4 trades/dia
  for (let day = 1; day <= 26; day++) {
    const date = new Date(2026, 5, day, 9, 30, 0);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue; // pula fim de semana
    const nTrades = 1 + Math.floor(rand() * 4);
    for (let i = 0; i < nTrades; i++) {
      const inst = rand() > 0.3 ? mnq : mes;
      const contratos = 1 + Math.floor(rand() * 3);
      const isWin = rand() > 0.36; // ~64% win rate
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
        accountId: DEMO_ACCOUNT_ID,
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
