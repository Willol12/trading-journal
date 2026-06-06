import Link from "next/link";
import { Plus, Pencil, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { getAccounts } from "@/lib/data";
import { plColor } from "@/lib/format";
import { Money } from "@/components/money";

export const dynamic = "force-dynamic";

export default async function ContasPage() {
  const userId = await getUserId();
  const accounts = await getAccounts();
  const sums = await prisma.trade.groupBy({
    by: ["accountId"],
    where: { userId },
    _sum: { resultadoValor: true },
  });
  const plMap = new Map(
    sums.map((s) => [s.accountId, s._sum.resultadoValor ?? 0]),
  );

  const dd = (n: number | null) =>
    n == null ? "—" : <Money usd={n} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-fg">Contas / Mesas</h1>
          <p className="text-xs text-muted">
            Regras de cada conta — meta, limite diário e drawdown.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/contas/nova">
            <Plus className="h-4 w-4" /> Nova conta
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {accounts.map((a) => {
          const pl = plMap.get(a.id) ?? 0;
          return (
            <Card key={a.id} className="flex flex-col p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-muted">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-fg">{a.nome}</div>
                    <Badge variant="neutral" className="mt-0.5 uppercase">
                      {a.tipo}
                    </Badge>
                  </div>
                </div>
                <Badge variant={a.ativa ? "win" : "be"}>
                  {a.ativa ? "Ativa" : "Inativa"}
                </Badge>
              </div>

              <dl className="grid grid-cols-2 gap-y-2 text-xs">
                <Info label="Saldo inicial" value={<Money usd={a.saldoInicial} />} />
                <Info
                  label="P&L atual"
                  value={<Money usd={pl} signed />}
                  cls={plColor(pl)}
                />
                <Info label="Meta de profit" value={dd(a.metaProfit)} />
                <Info label="Limite diário" value={dd(a.limitePerdaDiario)} />
                <Info label="Max drawdown" value={dd(a.maxDrawdown)} />
                <Info
                  label="Tipo de DD"
                  value={a.tipoDrawdown}
                  cls="capitalize"
                />
              </dl>

              <div className="mt-4 border-t border-border pt-3">
                <Button asChild variant="secondary" size="sm" className="w-full">
                  <Link href={`/contas/${a.id}`}>
                    <Pencil className="h-3.5 w-3.5" /> Editar regras
                  </Link>
                </Button>
              </div>
            </Card>
          );
        })}

        {accounts.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted md:col-span-2 xl:col-span-3">
            Nenhuma conta ainda. Crie a primeira com{" "}
            <Link href="/contas/nova" className="text-accent">
              Nova conta
            </Link>
            .
          </Card>
        )}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  cls,
}: {
  label: string;
  value: React.ReactNode;
  cls?: string;
}) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className={`tabular text-fg ${cls ?? ""}`}>{value}</dd>
    </div>
  );
}
