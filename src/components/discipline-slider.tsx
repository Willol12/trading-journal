"use client";

import { useState } from "react";

export function DisciplineSlider({ initial }: { initial: number | null }) {
  const [val, setVal] = useState(initial ?? 5);
  return (
    <div>
      <div className="mb-1 flex items-baseline gap-1">
        <span className="tabular text-2xl font-semibold text-accent">{val}</span>
        <span className="text-xs text-muted">/10</span>
      </div>
      <input
        type="range"
        name="notaDisciplina"
        min={0}
        max={10}
        value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        className="w-full accent-[var(--color-accent)]"
      />
    </div>
  );
}
