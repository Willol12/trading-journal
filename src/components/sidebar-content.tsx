"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtPct } from "@/lib/format";
import { signout } from "@/app/login/actions";
import { NAV } from "./nav-items";

export interface SidebarFooter {
  nome: string;
  progressoMeta: number;
  currentProfit: number;
  metaProfit: number | null;
}

// Conteúdo interno da navegação — usado pela sidebar (desktop) e pelo
// drawer mobile. `onNavigate` permite ao drawer se fechar ao clicar num link;
// `extraSection` entra entre a navegação e o rodapé (ex.: toggle de moeda).
export function SidebarContent({
  footer,
  onNavigate,
  extraSection,
}: {
  footer?: SidebarFooter;
  onNavigate?: () => void;
  extraSection?: React.ReactNode;
}) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const conta = sp.get("conta");
  const qs = conta ? `?conta=${conta}` : "";

  return (
    <>
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
              onClick={onNavigate}
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

      {extraSection}

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
    </>
  );
}
