import Link from "next/link";
import { Upload, Download, Plus, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TradesTable } from "@/components/trades-table";
import {
  getAccounts,
  getInstruments,
  getSetups,
  getTradeRows,
  resolveAccount,
  type TradeRowView,
} from "@/lib/data";
import {
  computeSummary,
  filterByPeriod,
  type MetricTrade,
  type Periodo,
} from "@/lib/metrics";
import { fmtFactor, fmtPct, plColor } from "@/lib/format";
import { Money } from "@/components/money";

function rowToMetric(r: TradeRowView): MetricTrade {
  return {
    dataHora: r.dataHora,
    resultadoValor: r.resultadoValor,
    resultado: r.resultado,
    rrRealizado: r.rrRealizado,
    setupNome: r.setupNome,
    instrumentSymbol: r.instrumentSymbol,
    direcao: r.direcao,
    contratos: r.contratos,
  };
}

const selectCls =
  "h-9 rounded-lg border border-border bg-surface px-2 text-xs text-fg outline-none focus:border-accent";

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{
    periodo?: string;
    conta?: string;
    ativo?: string;
    setup?: string;
    resultado?: string;
    direcao?: string;
    q?: string;
  }>;
}) {
  const sp = await searchParams;
  const periodo = (sp.periodo as Periodo) ?? "tudo";
  const accounts = await getAccounts();
  const account = resolveAccount(accounts, sp.conta);

  const [instruments, setups] = await Promise.all([
    getInstruments(),
    getSetups(),
  ]);

  let rows = account ? await getTradeRows(account.id) : [];
  // período
  const metricFiltered = filterByPeriod(rows.map(rowToMetric), periodo);
  const minTime = new Set(metricFiltered.map((m) => m.dataHora.getTime()));
  rows = rows.filter((r) => minTime.has(r.dataHora.getTime()));
  // filtros
  if (sp.ativo) rows = rows.filter((r) => r.instrumentSymbol === sp.ativo);
  if (sp.setup) rows = rows.filter((r) => r.setupNome === sp.setup);
  if (sp.resultado) rows = rows.filter((r) => r.resultado === sp.resultado);
  if (sp.direcao) rows = rows.filter((r) => r.direcao === sp.direcao);
  if (sp.q) {
    const q = sp.q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.instrumentSymbol.toLowerCase().includes(q) ||
        (r.setupNome ?? "").toLowerCase().includes(q),
    );
  }

  const summary = computeSummary(rows.map(rowToMetric));
  const contaQ = account ? account.id : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-fg">Trades</h1>
          <p className="text-xs text-muted">{rows.length} operações</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary" size="sm">
            <a href={`/api/export?conta=${contaQ}`}>
              <Download className="h-4 w-4" /> Exportar CSV
            </a>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href={`/trades/importar?conta=${contaQ}`}>
              <Upload className="h-4 w-4" /> Importar CSV
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/trades/novo?conta=${contaQ}`}>
              <Plus className="h-4 w-4" /> Novo trade
            </Link>
          </Button>
        </div>
      </div>

      {/* Resumo do recorte */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-muted">P&L do recorte</div>
          <div className={`tabular text-xl font-semibold ${plColor(summary.netPL)}`}>
            <Money usd={summary.netPL} signed />
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted">Win rate</div>
          <div className="tabular text-xl font-semibold text-fg">
            {fmtPct(summary.winRate)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted">Profit factor</div>
          <div className="tabular text-xl font-semibold text-fg">
            {fmtFactor(summary.profitFactor)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted">Expectancy / trade</div>
          <div className={`tabular text-xl font-semibold ${plColor(summary.expectancy)}`}>
            <Money usd={summary.expectancy} signed />
          </div>
        </Card>
      </div>

      {/* Filtros (GET) */}
      <Card>
        <CardContent className="pt-4">
          <form method="get" className="flex flex-wrap items-center gap-2">
            {account && <input type="hidden" name="conta" value={account.id} />}
            <input type="hidden" name="periodo" value={periodo} />
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                name="q"
                defaultValue={sp.q ?? ""}
                placeholder="Buscar setup, ativo..."
                className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-xs text-fg outline-none focus:border-accent"
              />
            </div>
            <select name="ativo" defaultValue={sp.ativo ?? ""} className={selectCls}>
              <option value="">Todos ativos</option>
              {instruments.map((i) => (
                <option key={i.id} value={i.symbol}>
                  {i.symbol}
                </option>
              ))}
            </select>
            <select name="setup" defaultValue={sp.setup ?? ""} className={selectCls}>
              <option value="">Todos setups</option>
              {setups.map((s) => (
                <option key={s.id} value={s.nome}>
                  {s.nome}
                </option>
              ))}
            </select>
            <select name="resultado" defaultValue={sp.resultado ?? ""} className={selectCls}>
              <option value="">Resultado</option>
              <option value="win">Win</option>
              <option value="loss">Loss</option>
              <option value="be">Breakeven</option>
            </select>
            <select name="direcao" defaultValue={sp.direcao ?? ""} className={selectCls}>
              <option value="">Direção</option>
              <option value="long">Long</option>
              <option value="short">Short</option>
            </select>
            <Button type="submit" size="sm" variant="secondary">
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-2">
          {account ? (
            <TradesTable rows={rows} />
          ) : (
            <div className="py-10 text-center text-sm text-muted">
              Crie uma conta primeiro em{" "}
              <Link href="/contas" className="text-accent">
                Contas / Mesas
              </Link>
              .
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
