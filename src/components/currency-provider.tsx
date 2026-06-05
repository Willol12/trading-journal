"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Moeda } from "@/lib/format";

interface CurrencyCtx {
  moeda: Moeda;
  rate: number; // USD -> BRL
  setMoeda: (m: Moeda) => void;
  setRate: (r: number) => void;
  refreshRate: () => Promise<number | null>;
}

const Ctx = createContext<CurrencyCtx>({
  moeda: "USD",
  rate: 5,
  setMoeda: () => {},
  setRate: () => {},
  refreshRate: async () => null,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [moeda, setMoedaState] = useState<Moeda>("USD");
  const [rate, setRateState] = useState<number>(5);

  useEffect(() => {
    const m = localStorage.getItem("moeda");
    const r = localStorage.getItem("usdbrl");
    if (m === "USD" || m === "BRL") setMoedaState(m);
    if (r && Number.isFinite(Number(r))) setRateState(Number(r));
  }, []);

  const setMoeda = useCallback((m: Moeda) => {
    setMoedaState(m);
    localStorage.setItem("moeda", m);
  }, []);

  const setRate = useCallback((r: number) => {
    setRateState(r);
    localStorage.setItem("usdbrl", String(r));
  }, []);

  const refreshRate = useCallback(async () => {
    try {
      const res = await fetch("/api/cotacao", { cache: "no-store" });
      const j = await res.json();
      if (j?.rate && Number.isFinite(Number(j.rate))) {
        setRate(Number(j.rate));
        return Number(j.rate);
      }
    } catch {}
    return null;
  }, [setRate]);

  return (
    <Ctx.Provider value={{ moeda, rate, setMoeda, setRate, refreshRate }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCurrency = () => useContext(Ctx);
