"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/components/currency-provider";
import { SidebarContent, type SidebarFooter } from "./sidebar-content";

// Menu hambúrguer + drawer de navegação para telas < md (a sidebar some lá).
export function MobileNav({ footer }: { footer?: SidebarFooter }) {
  const [open, setOpen] = useState(false);
  const { moeda, setMoeda } = useCurrency();

  // trava o scroll da página enquanto o drawer está aberto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // fecha com Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const moedaToggle = (
    <div className="border-t border-border px-4 py-3">
      <div className="mb-1.5 text-xs text-muted">Moeda</div>
      <div className="inline-flex items-center rounded-lg border border-border bg-surface p-0.5">
        {(["USD", "BRL"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMoeda(m)}
            className={cn(
              "rounded-md px-3 py-1 text-xs transition-colors",
              moeda === m ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
            )}
          >
            {m === "USD" ? "US$" : "R$"}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="-ml-1 rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-fg md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Portal no body: a topbar tem backdrop-blur, que viraria o containing
          block do `fixed` e prenderia o overlay à altura do header. Só renderiza
          com open=true (pós-clique), então é client-only e não afeta a hidratação. */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-border bg-surface"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="absolute right-2 top-3.5 rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent
                footer={footer}
                onNavigate={() => setOpen(false)}
                extraSection={moedaToggle}
              />
            </motion.div>
          </div>,
          document.body,
        )}
    </>
  );
}
