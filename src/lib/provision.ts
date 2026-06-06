import { prisma } from "@/lib/db";

// Dados-padrão que todo usuário novo recebe ao logar pela 1ª vez.
// (Cada usuário tem a SUA cópia — multi-tenancy. A mesa/conta o usuário cria.)
const DEFAULT_INSTRUMENTS = [
  { symbol: "MNQ", name: "Micro E-mini Nasdaq-100", tickSize: 0.25, tickValue: 0.5, pointValue: 2.0 },
  { symbol: "MES", name: "Micro E-mini S&P 500", tickSize: 0.25, tickValue: 1.25, pointValue: 5.0 },
  { symbol: "MGC", name: "Micro Gold", tickSize: 0.1, tickValue: 1.0, pointValue: 10.0 },
];

const DEFAULT_SETUPS = [
  { nome: "Pullback tendência", descricao: "Entrada a favor da tendência após recuo." },
  { nome: "Rompimento", descricao: "Rompimento de range/estrutura." },
  { nome: "Reversão VWAP", descricao: "Reversão na VWAP." },
  { nome: "Renko 3-bar", descricao: "Padrão de 3 tijolos Renko." },
  { nome: "Range fade", descricao: "Operar contra os extremos do range." },
];

const DEFAULT_TAGS: { nome: string; tipo: "emocao" | "erro" }[] = [
  { nome: "Disciplinado", tipo: "emocao" },
  { nome: "Confiante", tipo: "emocao" },
  { nome: "Ansioso", tipo: "emocao" },
  { nome: "FOMO", tipo: "emocao" },
  { nome: "Entrada antecipada", tipo: "erro" },
  { nome: "Moveu o stop", tipo: "erro" },
  { nome: "Overtrading", tipo: "erro" },
  { nome: "Sem plano", tipo: "erro" },
];

// Provisiona os dados-padrão do usuário. Idempotente e barato no caso comum.
// Chamado no layout autenticado a cada acesso.
export async function ensureUserProvisioned(userId: string): Promise<void> {
  const instCount = await prisma.instrument.count({ where: { userId } });

  // Top-up de instrumentos: se faltar algum default (ex.: MGC adicionado depois),
  // faz upsert sem sobrescrever o que o usuário já tem. No caso comum (já tem todos)
  // é só o count acima — sem escrita.
  if (instCount < DEFAULT_INSTRUMENTS.length) {
    await prisma.$transaction(
      DEFAULT_INSTRUMENTS.map((i) =>
        prisma.instrument.upsert({
          where: { userId_symbol: { userId, symbol: i.symbol } },
          update: {}, // não mexe em customização do usuário
          create: { ...i, userId },
        }),
      ),
    );
  }

  // Setups/tags só na 1ª vez (usuário totalmente novo).
  if (instCount === 0) {
    await prisma.$transaction([
      prisma.setup.createMany({
        data: DEFAULT_SETUPS.map((s) => ({ ...s, userId })),
      }),
      prisma.tag.createMany({
        data: DEFAULT_TAGS.map((t) => ({ ...t, userId })),
      }),
    ]);
  }
}
