"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as "dark" | "light") ?? "dark";
    setTheme(saved);
  }, []);

  function apply(t: "dark" | "light") {
    setTheme(t);
    localStorage.setItem("theme", t);
    document.documentElement.classList.toggle("light", t === "light");
  }

  return (
    <div className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
      {(["dark", "light"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => apply(t)}
          className={cn(
            "rounded-md px-3 py-1 text-xs transition-colors",
            theme === t ? "bg-surface text-fg shadow-sm" : "text-muted",
          )}
        >
          {t === "dark" ? "Escuro" : "Claro"}
        </button>
      ))}
    </div>
  );
}
