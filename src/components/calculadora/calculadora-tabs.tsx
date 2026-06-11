"use client";

import {
  GitCompareArrows,
  FlaskConical,
  SquareDivide,
  BookOpenText,
} from "lucide-react";
import { usePersistedState } from "./use-local-storage";
import { cn } from "@/lib/utils";
import { Comparador } from "./comparador";
import { Simulador } from "./simulador";
import { CalculadorasRapidas } from "./calculadoras-rapidas";
import { Guia } from "./guia";
import type { JournalData } from "./types";

const TABS = [
  { id: "comparar", label: "Comparar gerenciamentos", icon: GitCompareArrows },
  { id: "simulador", label: "Simulador", icon: FlaskConical },
  { id: "rapidas", label: "Calculadoras rápidas", icon: SquareDivide },
  { id: "guia", label: "Guia", icon: BookOpenText },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function CalculadoraTabs({ journal }: { journal: JournalData }) {
  const [tab, setTab] = usePersistedState<TabId>("tab", "comparar");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              tab === id
                ? "bg-accent/12 text-accent ring-1 ring-inset ring-accent/20"
                : "text-muted hover:bg-white/4 hover:text-fg",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* As abas ficam montadas (hidden) p/ não perder resultados ao alternar. */}
      <div className={cn(tab !== "comparar" && "hidden")}>
        <Comparador journal={journal} />
      </div>
      <div className={cn(tab !== "simulador" && "hidden")}>
        <Simulador journal={journal} />
      </div>
      <div className={cn(tab !== "rapidas" && "hidden")}>
        <CalculadorasRapidas />
      </div>
      <div className={cn(tab !== "guia" && "hidden")}>
        <Guia />
      </div>
    </div>
  );
}
