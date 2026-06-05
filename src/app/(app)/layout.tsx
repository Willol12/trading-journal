import { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { CurrencyProvider } from "@/components/currency-provider";
import { getAccounts, getMetricTrades } from "@/lib/data";
import { mesaStatus } from "@/lib/metrics";

// Layout das telas AUTENTICADAS (route group (app)).
// O middleware já garante que só usuário logado chega aqui.
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const accounts = await getAccounts();
  const ativa = accounts.find((a) => a.ativa) ?? accounts[0];

  let footer;
  if (ativa) {
    const trades = await getMetricTrades(ativa.id);
    const st = mesaStatus(
      {
        saldoInicial: ativa.saldoInicial,
        metaProfit: ativa.metaProfit,
        limitePerdaDiario: ativa.limitePerdaDiario,
        maxDrawdown: ativa.maxDrawdown,
        tipoDrawdown: ativa.tipoDrawdown,
      },
      trades,
    );
    footer = {
      nome: ativa.nome,
      progressoMeta: st.progressoMeta,
      currentProfit: st.currentProfit,
      metaProfit: ativa.metaProfit,
    };
  }

  const topAccounts = accounts.map((a) => ({ id: a.id, nome: a.nome }));

  return (
    <CurrencyProvider>
      <div className="flex min-h-screen">
        <Suspense>
          <Sidebar footer={footer} />
        </Suspense>
        <div className="flex min-w-0 flex-1 flex-col">
          <Suspense>
            <Topbar accounts={topAccounts} />
          </Suspense>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </CurrencyProvider>
  );
}
