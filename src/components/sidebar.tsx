"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Table,
  BarChart3,
  BookOpen,
  Building2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtPct } from "@/lib/format";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trades", label: "Trades", icon: Table },
  { href: "/analises", label: "Análises", icon: BarChart3 },
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
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-fg">
          P
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-fg">Plano</div>
          <div className="text-xs text-muted">Trading Journal</div>
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
                  ? "bg-accent/15 text-accent"
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
    </aside>
  );
}
