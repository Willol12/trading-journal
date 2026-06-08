import { AlertTriangle, Brain, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal, Stagger } from "@/components/ui/reveal";
import { Money } from "@/components/money";
import { getAccounts, getTaggedTrades, resolveAccount } from "@/lib/data";
import { tendencyStats, type TendencyStat } from "@/lib/metrics";
import { fmtPct, fmtR, plColor } from "@/lib/format";
import { cn } from "@/lib/utils";

function TendencyRow({ s }: { s: TendencyStat }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-2/40 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-fg">{s.nome}</div>
        <div className="text-[11px] text-muted">
          {s.count}× · win {fmtPct(s.winRate)} · {fmtR(s.avgR)} méd
        </div>
      </div>
      <div className={cn("tabular text-sm font-semibold", plColor(s.netPL))}>
        <Money usd={s.netPL} signed />
      </div>
    </div>
  );
}

function TendencyList({
  stats,
  empty,
}: {
  stats: TendencyStat[];
  empty: string;
}) {
  if (stats.length === 0) {
    return <div className="py-6 text-center text-sm text-muted">{empty}</div>;
  }
  return (
    <div className="space-y-2">
      {stats.map((s) => (
        <TendencyRow key={`${s.tipo}-${s.nome}`} s={s} />
      ))}
    </div>
  );
}

export default async function TendenciasPage({
  searchParams,
}: {
  searchParams: Promise<{ conta?: string }>;
}) {
  const sp = await searchParams;
  const accounts = await getAccounts();
  const account = resolveAccount(accounts, sp.conta);
  const trades = account ? await getTaggedTrades(account.id) : [];

  const stats = tendencyStats(trades);
  const erros = stats.filter((s) => s.tipo === "erro");
  const emocoes = stats.filter((s) => s.tipo === "emocao");
  // Os 3 erros que mais custaram dinheiro (P&L negativo), do pior pro menos pior.
  const piores = erros.filter((s) => s.netPL < 0).slice(0, 3);

  return (
    <div className="space-y-5">
      <Reveal>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">
            Tendências
          </h1>
          <p className="mt-0.5 text-xs text-muted">
            Os padrões que se repetem nos seus trades — quanto cada erro custa, e
            qual emoção aparece quando.
          </p>
        </div>
      </Reveal>

      {piores.length > 0 && (
        <Reveal>
          <Card className="border-loss/30 bg-loss/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-loss">
                <TrendingDown className="h-4 w-4" /> Seus traps mais caros
              </CardTitle>
              <span className="ml-auto text-xs text-muted">Foque nestes</span>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {piores.map((s) => (
                  <div
                    key={`${s.tipo}-${s.nome}`}
                    className="rounded-lg border border-loss/20 bg-surface px-3 py-3"
                  >
                    <div className="truncate text-sm font-medium text-fg">
                      {s.nome}
                    </div>
                    <div className={cn("mt-1 tabular text-lg font-semibold", plColor(s.netPL))}>
                      <Money usd={s.netPL} signed />
                    </div>
                    <div className="text-[11px] text-muted">
                      em {s.count} trade{s.count > 1 ? "s" : ""}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Reveal>
      )}

      <Stagger className="grid gap-4 lg:grid-cols-2" gap={0.07} startDelay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-muted" /> Erros
            </CardTitle>
            <span className="ml-auto text-xs text-muted">
              ordenado por custo
            </span>
          </CardHeader>
          <CardContent>
            <TendencyList
              stats={erros}
              empty="Nenhum trade marcado com tag de erro ainda. Marque erros nos seus trades para vê-los aqui."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Brain className="h-4 w-4 text-muted" /> Emoções
            </CardTitle>
            <span className="ml-auto text-xs text-muted">
              quanto cada estado rende
            </span>
          </CardHeader>
          <CardContent>
            <TendencyList
              stats={emocoes}
              empty="Nenhum trade marcado com tag de emoção ainda."
            />
          </CardContent>
        </Card>
      </Stagger>
    </div>
  );
}
