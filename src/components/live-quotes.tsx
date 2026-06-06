"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------- Tipos ----------

interface QuoteItem {
  key: string;
  label: string;
  price: number;
  changePct: number;
}

interface QuotesResponse {
  quotes: QuoteItem[];
  atualizadoEm: string;
}

// ---------- Formatação ----------

const fmtPrice = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const fmtPct = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  signDisplay: "always",
});

// ---------- Sub-componentes ----------

function QuoteSkeleton() {
  return (
    <div className="flex min-w-[110px] flex-col gap-1.5 rounded-xl border border-border bg-surface-2 p-3">
      <div className="shimmer h-2.5 w-14 rounded-sm" />
      <div className="shimmer h-4 w-20 rounded-sm" />
      <div className="shimmer h-2.5 w-10 rounded-sm" />
    </div>
  );
}

function QuoteCard({ quote, animate }: { quote: QuoteItem; animate: boolean }) {
  const up = quote.changePct > 0.005;
  const down = quote.changePct < -0.005;

  return (
    <div
      className={cn(
        "flex min-w-[110px] flex-col gap-0.5 rounded-xl border p-3 transition-all duration-500",
        "surface-card",
        up && "border-profit/30",
        down && "border-loss/30",
        !up && !down && "border-border",
        animate && "hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]",
      )}
    >
      {/* Símbolo */}
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {quote.key}
      </span>

      {/* Preço */}
      <span className="tabular text-base font-semibold leading-tight text-fg">
        {fmtPrice.format(quote.price)}
      </span>

      {/* Variação */}
      <span
        className={cn(
          "flex items-center gap-0.5 text-[11px] font-medium tabular",
          up && "text-profit",
          down && "text-loss",
          !up && !down && "text-muted",
        )}
      >
        {up ? (
          <TrendingUp className="h-3 w-3 shrink-0" />
        ) : down ? (
          <TrendingDown className="h-3 w-3 shrink-0" />
        ) : (
          <Minus className="h-3 w-3 shrink-0" />
        )}
        {fmtPct.format(quote.changePct)}%
      </span>
    </div>
  );
}

// ---------- Componente principal ----------

export function LiveQuotes() {
  const [data, setData] = useState<QuotesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const reduced = useReducedMotion();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/quotes", { cache: "no-store" });
      if (!res.ok) throw new Error("http-error");
      const json: QuotesResponse = await res.json();
      setData(json);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 60_000);
    return () => {
      if (intervalRef.current != null) clearInterval(intervalRef.current);
    };
  }, []);

  // Sem dados e sem erro — estado de loading inicial
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <QuoteSkeleton key={i} />
          ))}
        </div>
        <p className="text-[10px] text-muted">Dados com atraso · referência</p>
      </div>
    );
  }

  // Erro completo (todos falharam ou rota indisponível)
  if (error || !data || data.quotes.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
        <RefreshCw className="h-3 w-3 shrink-0" />
        Cotações indisponíveis no momento
      </div>
    );
  }

  const hora = new Date(data.atualizadoEm).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {data.quotes.map((q) => (
          <QuoteCard key={q.key} quote={q} animate={!reduced} />
        ))}
      </div>
      <p className="text-[10px] text-muted">
        Dados com atraso · referência · atualizado {hora}
      </p>
    </div>
  );
}
