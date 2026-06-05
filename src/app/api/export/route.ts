import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conta = searchParams.get("conta");

  const trades = await prisma.trade.findMany({
    where: conta ? { accountId: conta } : undefined,
    include: { instrument: true, setup: true, account: true },
    orderBy: { dataHora: "asc" },
  });

  const headers = [
    "data_hora",
    "conta",
    "ativo",
    "direcao",
    "contratos",
    "preco_entrada",
    "preco_saida",
    "pontos",
    "pl_usd",
    "comissoes",
    "risco_usd",
    "rr",
    "resultado",
    "setup",
    "notas",
  ];

  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const rows = trades.map((t) =>
    [
      t.dataHora.toISOString(),
      t.account?.nome ?? "",
      t.instrument.symbol,
      t.direcao,
      t.contratos,
      t.precoEntrada ?? "",
      t.precoSaida ?? "",
      t.resultadoPontos ?? "",
      t.resultadoValor,
      t.comissoes,
      t.riscoValor ?? "",
      t.rrRealizado ?? "",
      t.resultado,
      t.setup?.nome ?? "",
      t.notas ?? "",
    ]
      .map(esc)
      .join(","),
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="trades-${Date.now()}.csv"`,
    },
  });
}
