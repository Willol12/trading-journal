import Link from "next/link";
import { TrendingUp, Percent, BarChart3, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Reveal, Stagger } from "@/components/ui/reveal";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Celebrate } from "@/components/celebrate";
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
import { fmtFactor, fmtMoney } from "@/lib/format";
import { Money, AnimatedMoney } from "@/components/money";
import { LiveQuotes } from "@/components/live-quotes";

const sumPL = (ts: MetricTrade[]) => ts.reduce((s, t) => s + t.resultadoValor, 0);
const tone = (n: number): "profit" | "loss" | "neutral" =>
  n > 0 ? "profit" : n < 0 ? "loss" : "neutral";

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
      <Reveal className="mx-auto mt-10 max-w-md">
        <Card className="p-8 text-center">
          <h2 className="mb-2 font-display text-xl font-semibold text-fg">
            Bem-vindo 👋
          </h2>
          <p className="mb-5 text-sm text-muted">
            Crie sua primeira conta/mesa para começar a registrar trades.
          </p>
          <Button asChild>
            <Link href="/contas/nova">Criar conta</Link>
          </Button>
        </Card>
      </Reveal>
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
  const metaHit = account.metaProfit != null && mesa.progressoMeta >= 1;

  const ref = allTrades.length
    ? allTrades[allTrades.length - 1].dataHora
    : new Date();
  const lastRows = await getTradeRows(account.id, 6);

  return (
    <div className="space-y-4">
      <Celebrate fire={metaHit} />

      <Reveal>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">
          Bom dia, trader 👋
        </h1>
      </Reveal>

      {/* Cotações de mercado (atraso) */}
      <Reveal delay={0.03}>
        <LiveQuotes />
      </Reveal>

      {/* Painel da mesa (hero) */}
      <Reveal delay={0.05}>
        <MesaPanel nome={account.nome} tipo={account.tipo} status={mesa} />
      </Reveal>

      {/* KPIs — cascata + números contando */}
      <Stagger
        className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
        gap={0.05}
        startDelay={0.1}
      >
        <StatCard
          label="P&L Hoje"
          tone={tone(plHoje)}
          value={<AnimatedMoney usd={plHoje} signed />}
          sub={`${filterByPeriod(allTrades, "hoje").length} trades`}
        />
        <StatCard
          label="P&L Semana"
          tone={tone(plSemana)}
          value={<AnimatedMoney usd={plSemana} signed />}
        />
        <StatCard
          label="P&L Mês"
          tone={tone(plMes)}
          value={<AnimatedMoney usd={plMes} signed />}
        />
        <StatCard
          label="Win rate"
          icon={<Percent className="h-4 w-4" />}
          value={<AnimatedNumber value={summary.winRate} suffix="%" />}
          sub={`${summary.wins}V / ${summary.losses}D`}
        />
        <StatCard
          label="Profit factor"
          icon={<BarChart3 className="h-4 w-4" />}
          value={fmtFactor(summary.profitFactor)}
          sub={
            summary.payoff !== null
              ? `payoff ${fmtFactor(summary.payoff)}`
              : `expect. ${fmtMoney(summary.expectancy, { signed: true })}`
          }
        />
        <StatCard
          label="Drawdown"
          tone="loss"
          icon={<TrendingDown className="h-4 w-4" />}
          value={<AnimatedMoney usd={-dd} signed />}
        />
      </Stagger>

      {/* Curva + Últimos trades (esquerda) · Calendário (direita, ocupa a altura) */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Reveal delay={0.15}>
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-muted" /> Curva de capital
                  </CardTitle>
                  <p className="mt-0.5 text-xs text-muted">
                    {periodTrades.length} trades · DD máx <Money usd={dd} />
                  </p>
                </div>
                <span className={`tabular text-sm font-semibold ${tone(summary.netPL) === "profit" ? "text-profit" : tone(summary.netPL) === "loss" ? "text-loss" : "text-muted"}`}>
                  <Money usd={summary.netPL} signed />
                </span>
              </CardHeader>
              <CardContent>
                <EquityChart data={eq} />
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={0.2}>
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
          </Reveal>
        </div>

        <Reveal delay={0.18}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Calendário</CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarHeatmap
                days={days}
                year={ref.getFullYear()}
                month={ref.getMonth()}
              />
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
