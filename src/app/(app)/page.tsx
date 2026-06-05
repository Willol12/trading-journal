import Link from "next/link";
import { TrendingUp, Percent, BarChart3, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi-card";
import { MesaPanel } from "@/components/mesa-panel";
import { EquityChart } from "@/components/charts/equity-chart";
import { CalendarHeatmap } from "@/components/calendar-heatmap";
import { TradesTable } from "@/components/trades-table";
import {
  getAccounts,
  getMetricTrades,
  getTradeRows,
  resolveAccount,
} from "@/lib/data";
import {
  computeSummary,
  dailyPL,
  equityCurve,
  filterByPeriod,
  maxDrawdown,
  mesaStatus,
  type MetricTrade,
  type Periodo,
} from "@/lib/metrics";
import { fmtFactor, fmtPct, plColor } from "@/lib/format";
import { Money } from "@/components/money";

const sumPL = (ts: MetricTrade[]) => ts.reduce((s, t) => s + t.resultadoValor, 0);

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; conta?: string }>;
}) {
  const sp = await searchParams;
  const periodo = (sp.periodo as Periodo) ?? "mes";
  const accounts = await getAccounts();
  const account = resolveAccount(accounts, sp.conta);

  if (!account) {
    return (
      <Card className="mx-auto mt-10 max-w-md p-8 text-center">
        <h2 className="mb-2 text-lg font-semibold text-fg">Bem-vindo 👋</h2>
        <p className="mb-4 text-sm text-muted">
          Crie sua primeira conta/mesa para começar a registrar trades.
        </p>
        <Button asChild>
          <Link href="/contas">Criar conta</Link>
        </Button>
      </Card>
    );
  }

  const allTrades = await getMetricTrades(account.id);
  const periodTrades = filterByPeriod(allTrades, periodo);
  const summary = computeSummary(periodTrades);

  const plHoje = sumPL(filterByPeriod(allTrades, "hoje"));
  const plSemana = sumPL(filterByPeriod(allTrades, "semana"));
  const plMes = sumPL(filterByPeriod(allTrades, "mes"));

  const eq = equityCurve(periodTrades);
  const dd = maxDrawdown(periodTrades);
  const days = dailyPL(allTrades);
  const mesa = mesaStatus(
    {
      saldoInicial: account.saldoInicial,
      metaProfit: account.metaProfit,
      limitePerdaDiario: account.limitePerdaDiario,
      maxDrawdown: account.maxDrawdown,
      tipoDrawdown: account.tipoDrawdown,
    },
    allTrades,
  );

  const ref = allTrades.length
    ? allTrades[allTrades.length - 1].dataHora
    : new Date();
  const lastRows = await getTradeRows(account.id, 6);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-fg">Bom dia, trader 👋</h1>

      {/* Painel da mesa (hero) */}
      <MesaPanel nome={account.nome} tipo={account.tipo} status={mesa} />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="P&L Hoje"
          value={<Money usd={plHoje} signed />}
          valueClass={plColor(plHoje)}
          sub={`${filterByPeriod(allTrades, "hoje").length} trades`}
        />
        <KpiCard
          label="P&L Semana"
          value={<Money usd={plSemana} signed />}
          valueClass={plColor(plSemana)}
        />
        <KpiCard
          label="P&L Mês"
          value={<Money usd={plMes} signed />}
          valueClass={plColor(plMes)}
        />
        <KpiCard
          label="Win rate"
          value={fmtPct(summary.winRate)}
          icon={<Percent className="h-4 w-4" />}
          sub={`${summary.wins}V / ${summary.losses}D`}
        />
        <KpiCard
          label="Profit factor"
          value={fmtFactor(summary.profitFactor)}
          icon={<BarChart3 className="h-4 w-4" />}
          sub={`payoff ${fmtFactor(summary.payoff)}`}
        />
        <KpiCard
          label="Drawdown"
          value={<Money usd={-dd} signed />}
          valueClass="text-loss"
          icon={<TrendingDown className="h-4 w-4" />}
        />
      </div>

      {/* Curva + Calendário */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-muted" /> Curva de capital
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted">
                {periodTrades.length} trades · DD máx <Money usd={dd} />
              </p>
            </div>
            <span
              className={`tabular text-sm font-semibold ${plColor(summary.netPL)}`}
            >
              <Money usd={summary.netPL} signed />
            </span>
          </CardHeader>
          <CardContent>
            <EquityChart data={eq} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
            <span className="ml-auto text-xs capitalize text-muted">
              {ref.toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </CardHeader>
          <CardContent>
            <CalendarHeatmap
              days={days}
              year={ref.getFullYear()}
              month={ref.getMonth()}
            />
          </CardContent>
        </Card>
      </div>

      {/* Últimos trades */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Últimos trades</CardTitle>
          <Link
            href={`/trades${sp.conta ? `?conta=${sp.conta}` : ""}`}
            className="text-xs text-accent hover:underline"
          >
            Ver todos →
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          <TradesTable rows={lastRows} compact />
        </CardContent>
      </Card>
    </div>
  );
}
