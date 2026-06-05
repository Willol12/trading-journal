import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUp, ArrowDown, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TradeRowView } from "@/lib/data";
import { fmtPoints, fmtR, plColor } from "@/lib/format";
import { Money } from "@/components/money";
import { cn } from "@/lib/utils";

function ResultadoBadge({ r }: { r: string }) {
  if (r === "win") return <Badge variant="win">Win</Badge>;
  if (r === "loss") return <Badge variant="loss">Loss</Badge>;
  return <Badge variant="be">BE</Badge>;
}

export function TradesTable({
  rows,
  compact = false,
}: {
  rows: TradeRowView[];
  compact?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted">
        Nenhum trade registrado ainda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th className="px-3 py-2 font-medium">Data/Hora</th>
            <th className="px-3 py-2 font-medium">Ativo</th>
            <th className="px-3 py-2 font-medium">Direção</th>
            {!compact && <th className="px-3 py-2 font-medium">Contr.</th>}
            <th className="px-3 py-2 font-medium">Setup</th>
            <th className="px-3 py-2 font-medium">Result.</th>
            {!compact && <th className="px-3 py-2 text-right font-medium">R</th>}
            <th className="px-3 py-2 text-right font-medium">Pontos</th>
            <th className="px-3 py-2 text-right font-medium">P&L</th>
            {!compact && <th className="px-3 py-2" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr
              key={t.id}
              className="border-b border-border/50 transition-colors hover:bg-surface-2/50"
            >
              <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                {format(t.dataHora, "dd 'de' MMM HH:mm", { locale: ptBR })}
              </td>
              <td className="px-3 py-2.5 font-medium text-fg">
                {t.instrumentSymbol}
              </td>
              <td className="px-3 py-2.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs",
                    t.direcao === "long" ? "text-profit" : "text-loss",
                  )}
                >
                  {t.direcao === "long" ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {t.direcao === "long" ? "Long" : "Short"}
                </span>
              </td>
              {!compact && (
                <td className="px-3 py-2.5 tabular text-muted">{t.contratos}</td>
              )}
              <td className="px-3 py-2.5 text-muted">{t.setupNome ?? "—"}</td>
              <td className="px-3 py-2.5">
                <ResultadoBadge r={t.resultado} />
              </td>
              {!compact && (
                <td
                  className={cn(
                    "px-3 py-2.5 text-right tabular",
                    plColor(t.rrRealizado ?? 0),
                  )}
                >
                  {t.rrRealizado != null ? fmtR(t.rrRealizado) : "—"}
                </td>
              )}
              <td
                className={cn(
                  "px-3 py-2.5 text-right tabular",
                  plColor(t.resultadoPontos ?? 0),
                )}
              >
                {t.resultadoPontos != null ? fmtPoints(t.resultadoPontos) : "—"}
              </td>
              <td
                className={cn(
                  "px-3 py-2.5 text-right tabular font-medium",
                  plColor(t.resultadoValor),
                )}
              >
                <Money usd={t.resultadoValor} signed />
              </td>
              {!compact && (
                <td className="px-3 py-2.5 text-right">
                  <Link
                    href={`/trades/${t.id}`}
                    className="text-muted hover:text-fg"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
