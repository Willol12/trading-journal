import { notFound } from "next/navigation";
import { TradeForm } from "@/components/trade-form";
import { updateTrade, deleteTrade } from "../actions";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { createClient as createSupabaseServer } from "@/lib/supabase/server";
import { getAccounts, getInstruments, getSetups, getTags } from "@/lib/data";

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditTradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getUserId();
  // findFirst com userId: usuário só edita trade que é dele.
  const trade = await prisma.trade.findFirst({
    where: { id, userId },
    include: { tags: true },
  });
  if (!trade) notFound();

  // URL assinada do print (bucket é privado).
  let screenshotUrl: string | null = null;
  if (trade.screenshotPath) {
    const sb = await createSupabaseServer();
    const { data } = await sb.storage
      .from("trade-screenshots")
      .createSignedUrl(trade.screenshotPath, 3600);
    screenshotUrl = data?.signedUrl ?? null;
  }

  const [accounts, instruments, setups, tags] = await Promise.all([
    getAccounts(),
    getInstruments(),
    getSetups(),
    getTags(),
  ]);

  const update = updateTrade.bind(null, id);
  const del = deleteTrade.bind(null, id, trade.accountId);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="font-display text-xl font-semibold tracking-tight text-fg">Editar trade</h1>
      <TradeForm
        action={update}
        onDelete={del}
        tradeId={id}
        userId={userId}
        screenshotInitialPath={trade.screenshotPath}
        screenshotInitialUrl={screenshotUrl}
        accounts={accounts.map((a) => ({ id: a.id, nome: a.nome }))}
        instruments={instruments.map((i) => ({
          id: i.id,
          symbol: i.symbol,
          pointValue: i.pointValue,
        }))}
        setups={setups.map((s) => ({ id: s.id, nome: s.nome }))}
        tags={tags.map((t) => ({ id: t.id, nome: t.nome, tipo: t.tipo }))}
        initial={{
          accountId: trade.accountId,
          instrumentId: trade.instrumentId,
          dataHora: toLocalInput(trade.dataHora),
          direcao: trade.direcao,
          contratos: trade.contratos,
          precoEntrada: trade.precoEntrada,
          precoStop: trade.precoStop,
          precoSaida: trade.precoSaida,
          resultadoPontos: trade.resultadoPontos,
          resultadoValor: trade.resultadoValor,
          riscoValor: trade.riscoValor,
          rrPlanejado: trade.rrPlanejado,
          comissoes: trade.comissoes,
          resultado: trade.resultado,
          setupId: trade.setupId,
          notas: trade.notas,
          tagIds: trade.tags.map((t) => t.tagId),
        }}
      />
    </div>
  );
}
