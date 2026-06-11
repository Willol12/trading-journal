import { Reveal } from "@/components/ui/reveal";
import { CalculadoraTabs } from "@/components/calculadora/calculadora-tabs";
import { getAccounts, getMetricTrades, resolveAccount } from "@/lib/data";
import type { JournalData } from "@/components/calculadora/types";

export default async function CalculadoraPage({
  searchParams,
}: {
  searchParams: Promise<{ conta?: string }>;
}) {
  const sp = await searchParams;
  const accounts = await getAccounts();
  const account = resolveAccount(accounts, sp.conta);
  const trades = account ? await getMetricTrades(account.id) : [];

  const journal: JournalData = {
    outcomes: trades.map((t) => t.resultadoValor),
    wins: trades.filter((t) => t.resultado === "win").length,
    losses: trades.filter((t) => t.resultado === "loss").length,
    contaNome: account?.nome ?? null,
    mesaPrefill: account
      ? {
          saldoInicial: account.saldoInicial,
          metaProfit: account.metaProfit,
          maxDrawdown: account.maxDrawdown,
          tipoDrawdown: account.tipoDrawdown,
          limitePerdaDiario: account.limitePerdaDiario,
          consistenciaPct: account.consistenciaPct,
          minDiasTrade: account.minDiasTrade,
        }
      : null,
  };

  return (
    <div className="space-y-5">
      <Reveal>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">
            Calculadora
          </h1>
          <p className="mt-0.5 text-xs text-muted">
            Gerenciamento de risco e probabilidade de aprovação — simule antes de
            arriscar dinheiro de verdade.
          </p>
        </div>
      </Reveal>

      <CalculadoraTabs journal={journal} />
    </div>
  );
}
