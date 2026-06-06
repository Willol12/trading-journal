"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/components/currency-provider";

const PERIODOS = [
  { key: "hoje", label: "Hoje" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mês" },
  { key: "tudo", label: "Tudo" },
];

export interface TopAccount {
  id: string;
  nome: string;
}

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/trades": "Trades",
  "/analises": "Análises",
  "/diario": "Diário",
  "/contas": "Contas / Mesas",
  "/config": "Configurações",
};

export function Topbar({ accounts }: { accounts: TopAccount[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();
  const periodo = sp.get("periodo") ?? "mes";
  const conta = sp.get("conta") ?? "";
  const { moeda, setMoeda } = useCurrency();

  const title =
    Object.entries(TITLES).find(([href]) =>
      href === "/" ? pathname === "/" : pathname.startsWith(href),
    )?.[1] ?? "";

  function buildQuery(next: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    const s = params.toString();
    return s ? `?${s}` : "";
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border bg-bg/80 px-4 backdrop-blur md:px-6">
      <div className="min-w-0 truncate font-display text-base font-semibold tracking-tight text-fg">
        {title}
      </div>

      <div className="flex items-center gap-2">
        {/* Filtro de período */}
        <div className="hidden items-center rounded-lg border border-border bg-surface p-0.5 sm:flex">
          {PERIODOS.map((p) => (
            <Link
              key={p.key}
              href={`${pathname}${buildQuery({ periodo: p.key })}`}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs transition-colors",
                periodo === p.key
                  ? "bg-surface-2 text-fg"
                  : "text-muted hover:text-fg",
              )}
            >
              {p.label}
            </Link>
          ))}
        </div>

        {/* Seletor de conta */}
        {accounts.length > 0 && (
          <select
            value={conta || accounts[0]?.id}
            onChange={(e) =>
              router.push(`${pathname}${buildQuery({ conta: e.target.value })}`)
            }
            className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-fg outline-none focus:border-accent"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        )}

        {/* Moeda US$ / R$ */}
        <div className="hidden items-center rounded-lg border border-border bg-surface p-0.5 sm:flex">
          {(["USD", "BRL"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMoeda(m)}
              className={cn(
                "rounded-md px-2 py-1 text-xs transition-colors",
                moeda === m ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
              )}
            >
              {m === "USD" ? "US$" : "R$"}
            </button>
          ))}
        </div>

        <Button asChild size="sm">
          <Link href={`/trades/novo${conta ? `?conta=${conta}` : ""}`}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo trade</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
