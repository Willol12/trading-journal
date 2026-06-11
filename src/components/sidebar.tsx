"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Table,
  BarChart3,
  Calculator,
  TrendingDown,
  BookOpen,
  Building2,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtPct } from "@/lib/format";
import { signout } from "@/app/login/actions";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trades", label: "Trades", icon: Table },
  { href: "/analises", label: "Análises", icon: BarChart3 },
  { href: "/calculadora", label: "Calculadora", icon: Calculator },
  { href: "/tendencias", label: "Tendências", icon: TrendingDown },
  { href: "/diario", label: "Diário", icon: BookOpen },
  { href: "/contas", label: "Contas / Mesas", icon: Building2 },
  { href: "/config", label: "Configurações", icon: Settings },
];

export interface SidebarFooter {
  nome: string;
  progressoMeta: number;
  currentProfit: number;
  metaProfit: number | null;
}

export function Sidebar({ footer }: { footer?: SidebarFooter }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const conta = sp.get("conta");
  const qs = conta ? `?conta=${conta}` : "";

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-accent to-accent-2 font-display text-base font-bold text-white shadow-[var(--glow-accent)]">
          T
        </div>
        <div className="leading-tight">
          <div className="font-display text-sm font-semibold tracking-tight text-fg">
            Trading Journal
          </div>
          <div className="text-xs text-muted">Diário &amp; performance</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-2">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={`${item.href}${qs}`}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent/12 text-accent ring-1 ring-inset ring-accent/20"
                  : "text-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {footer && (
        <div className="border-t border-border p-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="truncate font-medium text-fg">{footer.nome}</span>
            <span className="text-accent">{fmtPct(footer.progressoMeta * 100)}</span>
          </div>
          <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.min(100, footer.progressoMeta * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Meta</span>
            <span className="tabular text-profit">
              {fmtMoney(footer.currentProfit, { signed: true })}
            </span>
          </div>
        </div>
      )}

      <div className="border-t border-border p-2">
        <form action={signout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
