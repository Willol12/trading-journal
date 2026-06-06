import { TradeForm } from "@/components/trade-form";
import { createTrade } from "../actions";
import {
  getAccounts,
  getInstruments,
  getSetups,
  getTags,
} from "@/lib/data";

export default async function NovoTradePage({
  searchParams,
}: {
  searchParams: Promise<{ conta?: string }>;
}) {
  const sp = await searchParams;
  const [accounts, instruments, setups, tags] = await Promise.all([
    getAccounts(),
    getInstruments(),
    getSetups(),
    getTags(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="font-display text-xl font-semibold tracking-tight text-fg">Novo trade</h1>
      <TradeForm
        action={createTrade}
        accounts={accounts.map((a) => ({ id: a.id, nome: a.nome }))}
        instruments={instruments.map((i) => ({
          id: i.id,
          symbol: i.symbol,
          pointValue: i.pointValue,
        }))}
        setups={setups.map((s) => ({ id: s.id, nome: s.nome }))}
        tags={tags.map((t) => ({ id: t.id, nome: t.nome, tipo: t.tipo }))}
        defaultAccountId={sp.conta}
      />
    </div>
  );
}
