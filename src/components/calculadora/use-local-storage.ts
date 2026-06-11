"use client";

import { useEffect, useRef, useState } from "react";

const PREFIX = "tj:calculadora:v1:";

/**
 * useState persistido em localStorage. Hydration-safe: o 1º render usa o
 * default (igual ao SSR) e o valor salvo só entra num useEffect pós-mount.
 * Escrita debounced (300 ms).
 */
export function usePersistedState<T>(key: string, initial: T | (() => T)) {
  const [value, setValue] = useState<T>(initial);
  const loaded = useRef(false);

  useEffect(() => {
    // setState dentro de um timeout (não no corpo do effect) — evita cascata
    // de render síncrona e mantém o 1º paint igual ao SSR.
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        if (raw != null) setValue(JSON.parse(raw) as T);
      } catch {
        // valor antigo/corrompido — segue com o default
      }
      loaded.current = true;
    }, 0);
    return () => clearTimeout(t);
  }, [key]);

  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
      } catch {
        // storage cheio/indisponível — sem persistência, sem quebrar
      }
    }, 300);
    return () => clearTimeout(t);
  }, [key, value]);

  return [value, setValue] as const;
}
