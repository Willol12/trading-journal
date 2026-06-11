"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/components/currency-provider";
import { MobileNav } from "@/components/mobile-nav";
import { navTitle } from "@/components/nav-items";
import type { SidebarFooter } from "@/components/sidebar-content";

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

export function Topbar({
  accounts,
  footer,
}: {
  accounts: TopAccount[];
  footer?: SidebarFooter;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();
  const periodo = sp.get("periodo") ?? "mes";
  const conta = sp.get("conta") ?? "";
  const { moeda, setMoeda } = useCurrency();

  const title = navTitle(pathname);

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
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-border bg-bg/80 px-3 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-1.5">
        <MobileNav footer={footer} />
        <div className="min-w-0 truncate font-display text-base font-semibold tracking-tight text-fg">
          {title}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Filtro de período — segmentado no desktop, select no mobile */}
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
        <select
          value={periodo}
          onChange={(e) =>
            router.push(`${pathname}${buildQuery({ periodo: e.target.value })}`)
          }
          aria-label="Período"
          className="h-8 rounded-lg border border-border bg-surface px-1.5 text-xs text-fg outline-none focus:border-accent sm:hidden"
        >
          {PERIODOS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>

        {/* Seletor de conta */}
        {accounts.length > 0 && (
          <select
            value={conta || accounts[0]?.id}
            onChange={(e) =>
              router.push(`${pathname}${buildQuery({ conta: e.target.value })}`)
            }
            aria-label="Conta"
            className="h-8 max-w-28 rounded-lg border border-border bg-surface px-1.5 text-xs text-fg outline-none focus:border-accent sm:max-w-none sm:px-2"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        )}

        {/* Moeda US$ / R$ — no mobile fica dentro do menu */}
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
