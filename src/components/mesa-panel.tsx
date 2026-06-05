import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, TriangleAlert, Target, TrendingDown, CalendarClock } from "lucide-react";
import type { MesaStatus } from "@/lib/metrics";
import { fmtPct } from "@/lib/format";
import { Money } from "@/components/money";

export function MesaPanel({
  nome,
  tipo,
  status,
}: {
  nome: string;
  tipo: string;
  status: MesaStatus;
}) {
  return (
    <Card
      className="overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, color-mix(in oklab, var(--color-accent) 7%, var(--color-surface)), var(--color-surface))",
      }}
    >
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-fg">{nome}</span>
          <Badge variant="accent" className="uppercase">{tipo}</Badge>
          <span className="text-xs text-muted">
            Saldo{" "}
            <Money usd={status.currentEquity} className="tabular text-fg" />
            {" · "}pico{" "}
            <Money usd={status.peakEquity} className="tabular text-fg" />
          </span>
        </div>
        {status.dentroDasRegras ? (
          <Badge variant="win">
            <ShieldCheck className="h-3.5 w-3.5" /> Dentro das regras
          </Badge>
        ) : (
          <Badge variant="loss">
            <TriangleAlert className="h-3.5 w-3.5" /> Atenção às regras
          </Badge>
        )}
      </div>

      {/* Três medidores */}
      <div className="grid sm:grid-cols-3">
        {/* Meta */}
        <div className="p-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs text-muted">
            <Target className="h-3.5 w-3.5" /> Meta do profit
          </div>
          <div className="tabular text-xl font-semibold text-profit">
            <Money usd={status.currentProfit} signed />
          </div>
          <div className="my-2 h-2 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-profit"
              style={{ width: `${Math.min(100, status.progressoMeta * 100)}%` }}
            />
          </div>
          {status.metaProfit != null && (
            <div className="text-xs text-muted">
              {fmtPct(status.progressoMeta * 100)} de{" "}
              <Money usd={status.metaProfit} /> ·{" "}
              <span className="text-fg">
                Faltam <Money usd={status.faltaMeta} />
              </span>
            </div>
          )}
        </div>

        {/* Trailing drawdown */}
        <div className="p-4 sm:border-l sm:border-border">
          <div className="mb-1 flex items-center gap-1.5 text-xs text-muted">
            <TrendingDown className="h-3.5 w-3.5" /> Trailing drawdown
          </div>
          {status.folgaDrawdown != null ? (
            <>
              <div className="tabular text-xl font-semibold text-fg">
                <Money usd={status.folgaDrawdown} />
              </div>
              <div className="mt-1 text-xs text-muted">folga até o limite</div>
              {status.drawdownFloorEquity != null && (
                <div className="mt-2 text-xs text-muted">
                  Limite em{" "}
                  <Money usd={status.drawdownFloorEquity} className="tabular text-fg" />
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-muted">—</div>
          )}
        </div>

        {/* Limite diário */}
        <div className="p-4 sm:border-l sm:border-border">
          <div className="mb-1 flex items-center gap-1.5 text-xs text-muted">
            <CalendarClock className="h-3.5 w-3.5" /> Limite diário
          </div>
          {status.restanteHoje != null ? (
            <>
              <div className="tabular text-xl font-semibold text-fg">
                <Money usd={status.restanteHoje} />
              </div>
              <div className="mt-1 text-xs text-muted">restante hoje</div>
              <div className="mt-2 text-xs text-muted">
                P&L hoje{" "}
                <Money
                  usd={status.plHoje}
                  signed
                  className={`tabular ${status.plHoje < 0 ? "text-loss" : "text-profit"}`}
                />{" "}
                · limite <Money usd={status.limitePerdaDiario ?? 0} />
              </div>
            </>
          ) : (
            <div className="text-sm text-muted">Sem limite diário</div>
          )}
        </div>
      </div>
    </Card>
  );
}
