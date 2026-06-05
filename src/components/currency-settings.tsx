"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/components/currency-provider";
import { cn } from "@/lib/utils";

export function CurrencySettings() {
  const { moeda, rate, setMoeda, setRate, refreshRate } = useCurrency();
  const [val, setVal] = useState(String(rate));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setVal(String(rate));
  }, [rate]);

  async function atualizar() {
    setBusy(true);
    setMsg(null);
    const r = await refreshRate();
    setBusy(false);
    if (r) setMsg(`Cotação atualizada: 1 US$ = R$ ${r.toFixed(2)}`);
    else setMsg("Não consegui buscar a cotação (verifique a internet).");
  }

  return (
    <div className="space-y-4">
      {/* Moeda de exibição */}
      <div>
        <div className="mb-1.5 text-xs text-muted">Moeda de exibição</div>
        <div className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
          {(["USD", "BRL"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMoeda(m)}
              className={cn(
                "rounded-md px-3 py-1 text-xs transition-colors",
                moeda === m ? "bg-surface text-fg shadow-sm" : "text-muted",
              )}
            >
              {m === "USD" ? "Dólar (US$)" : "Real (R$)"}
            </button>
          ))}
        </div>
      </div>

      {/* Cotação */}
      <div>
        <div className="mb-1.5 text-xs text-muted">
          Cotação do dólar (1 US$ em R$)
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            inputMode="decimal"
            className="h-9 w-28 rounded-lg border border-border bg-surface-2 px-3 text-sm text-fg outline-none focus:border-accent"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              const n = Number(val.replace(",", "."));
              if (Number.isFinite(n) && n > 0) {
                setRate(n);
                setMsg("Cotação salva.");
              }
            }}
          >
            Salvar
          </Button>
          <Button type="button" size="sm" onClick={atualizar} disabled={busy}>
            <RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} />
            {busy ? "Buscando..." : "Buscar cotação atual"}
          </Button>
        </div>
        {msg && <p className="mt-2 text-xs text-muted">{msg}</p>}
        <p className="mt-1 text-xs text-muted">
          Os trades são guardados em US$; o app converte só na exibição.
        </p>
      </div>
    </div>
  );
}
