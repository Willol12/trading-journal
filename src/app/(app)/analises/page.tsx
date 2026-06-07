import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Flame,
  Snowflake,
  Target,
  BarChart3,
  CalendarDays,
  Clock,
  Coins,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Reveal, Stagger } from "@/components/ui/reveal";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AnimatedMoney } from "@/components/money";
import { HBarPL, VBarPL, RDistChart } from "@/components/charts/analytics-charts";
import { getAccounts, getMetricTrades, resolveAccount } from "@/lib/data";
import {
  computeSummary,
  filterByPeriod,
  plByDayOfWeek,
  plByHour,
  plByInstrument,
  plBySetup,
  rMultipleDistribution,
  winLossSequence,
  type Periodo,
} from "@/lib/metrics";
import { fmtFactor, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";

const tone = (n: number): "profit" | "loss" | "neutral" =>
  n > 0 ? "profit" : n < 0 ? "loss" : "neutral";

export default async function AnalisesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; conta?: string }>;
}) {
  const sp = await searchParams;
  const periodo = (sp.periodo as Periodo) ?? "tudo";
  const accounts = await getAccounts();
  const account = resolveAccount(accounts, sp.conta);
  const all = account ? await getMetricTrades(account.id) : [];
  const trades = filterByPeriod(all, periodo);

  const summary = computeSummary(trades);
  const seq = winLossSequence(trades);
  const recentSeq = seq.slice(-80);

  return (
    <div className="space-y-5">
      <Reveal>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">
            Análises
          </h1>
          <p className="mt-0.5 text-xs text-muted">
            O que está funcionando — e o que está custando dinheiro.
          </p>
        </div>
      </Reveal>

      {/* KPIs */}
      <Stagger
        className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
        gap={0.05}
        startDelay={0.05}
      >
        <StatCard
          label="Resultado líquido"
          tone={tone(summary.netPL)}
          icon={<Wallet className="h-4 w-4" />}
          value={<AnimatedMoney usd={summary.netPL} signed />}
        />
        <StatCard
          label="Ganho médio"
          tone="profit"
          icon={<ArrowUpRight className="h-4 w-4" />}
          value={<AnimatedMoney usd={summary.avgWin} />}
        />
        <StatCard
          label="Perda média"
          tone="loss"
          icon={<ArrowDownRight className="h-4 w-4" />}
          value={<AnimatedMoney usd={-summary.avgLoss} signed />}
        />
        <StatCard
          label="Payoff"
          icon={<Scale className="h-4 w-4" />}
          value={fmtFactor(summary.payoff)}
          sub="ganho ÷ perda média"
        />
        <StatCard
          label="Maior seq. ganhos"
          tone="profit"
          icon={<Flame className="h-4 w-4" />}
          value={<AnimatedNumber value={summary.maxWinStreak} suffix="×" />}
        />
        <StatCard
          label="Maior seq. perdas"
          tone="loss"
          icon={<Snowflake className="h-4 w-4" />}
          value={<AnimatedNumber value={summary.maxLossStreak} suffix="×" />}
        />
      </Stagger>

      {/* Gráficos */}
      <Stagger className="grid gap-4 lg:grid-cols-2" gap={0.07} startDelay={0.12}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Target className="h-4 w-4 text-muted" /> P&amp;L por setup
            </CardTitle>
            <span className="ml-auto text-xs text-muted">Onde está seu edge</span>
          </CardHeader>
          <CardContent>
            <HBarPL data={plBySetup(trades)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-muted" /> Distribuição de R-múltiplos
            </CardTitle>
            <span className="ml-auto text-xs text-muted">Forma da expectância</span>
          </CardHeader>
          <CardContent>
            <RDistChart data={rMultipleDistribution(trades)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-muted" /> P&amp;L por dia da semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VBarPL data={plByDayOfWeek(trades)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted" /> P&amp;L por horário
            </CardTitle>
            <span className="ml-auto text-xs text-muted">Hora de abertura</span>
          </CardHeader>
          <CardContent>
            <VBarPL data={plByHour(trades)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-muted" /> P&amp;L por ativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HBarPL data={plByInstrument(trades)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-muted" /> Sequências win / loss
            </CardTitle>
            <span className="ml-auto text-xs text-muted">
              {summary.wins}V · {summary.losses}D · {fmtPct(summary.winRate)}
            </span>
          </CardHeader>
          <CardContent>
            {recentSeq.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {recentSeq.map((r, i) => (
                  <span
                    key={i}
                    title={r === "win" ? "Ganho" : r === "loss" ? "Perda" : "Breakeven"}
                    className={cn(
                      "h-4 w-4 rounded-[4px] ring-1 ring-inset ring-black/20 transition-transform hover:scale-110",
                      r === "win"
                        ? "bg-profit shadow-[0_0_8px_-2px_var(--color-profit)]"
                        : r === "loss"
                          ? "bg-loss shadow-[0_0_8px_-2px_var(--color-loss)]"
                          : "bg-muted/50",
                    )}
                  />
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-muted">
                Sem trades no período.
              </div>
            )}
            {seq.length > recentSeq.length && (
              <p className="mt-2 text-[11px] text-muted">
                mostrando os últimos {recentSeq.length} de {seq.length}
              </p>
            )}
          </CardContent>
        </Card>
      </Stagger>
    </div>
  );
}
