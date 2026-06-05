import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { fmtFactor, fmtPct, plColor } from "@/lib/format";
import { Money } from "@/components/money";
import { cn } from "@/lib/utils";

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

  const miniCards = [
    { label: "Resultado líquido", value: <Money usd={summary.netPL} signed />, cls: plColor(summary.netPL) },
    { label: "Ganho médio", value: <Money usd={summary.avgWin} />, cls: "text-profit" },
    { label: "Perda média", value: <Money usd={-summary.avgLoss} signed />, cls: "text-loss" },
    { label: "Payoff", value: fmtFactor(summary.payoff), cls: "text-fg" },
    { label: "Maior seq. ganhos", value: `${summary.maxWinStreak}×`, cls: "text-profit" },
    { label: "Maior seq. perdas", value: `${summary.maxLossStreak}×`, cls: "text-loss" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-fg">Análises</h1>
        <p className="text-xs text-muted">
          O que está funcionando — e o que está custando dinheiro.
        </p>
      </div>

      {/* Mini cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {miniCards.map((c) => (
          <Card key={c.label} className="p-4">
            <div className="text-xs text-muted">{c.label}</div>
            <div className={cn("tabular text-lg font-semibold", c.cls)}>
              {c.value}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>P&L por setup</CardTitle>
            <span className="ml-auto text-xs text-muted">Onde está seu edge</span>
          </CardHeader>
          <CardContent>
            <HBarPL data={plBySetup(trades)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de R-múltiplos</CardTitle>
            <span className="ml-auto text-xs text-muted">Forma da expectância</span>
          </CardHeader>
          <CardContent>
            <RDistChart data={rMultipleDistribution(trades)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>P&L por dia da semana</CardTitle>
          </CardHeader>
          <CardContent>
            <VBarPL data={plByDayOfWeek(trades)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>P&L por horário</CardTitle>
            <span className="ml-auto text-xs text-muted">Hora de abertura</span>
          </CardHeader>
          <CardContent>
            <VBarPL data={plByHour(trades)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>P&L por ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <HBarPL data={plByInstrument(trades)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sequências win / loss</CardTitle>
            <span className="ml-auto text-xs text-muted">
              {summary.wins}V · {summary.losses}D · {fmtPct(summary.winRate)}
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {seq.map((r, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-3.5 w-3.5 rounded-sm",
                    r === "win"
                      ? "bg-profit"
                      : r === "loss"
                        ? "bg-loss"
                        : "bg-muted",
                  )}
                />
              ))}
              {seq.length === 0 && (
                <span className="text-sm text-muted">Sem trades no período.</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
