"use client";

// Campos de formulário compartilhados pelas abas da Calculadora.
// Estados numéricos são guardados como STRING (permite digitar livremente)
// e convertidos com num() na hora de calcular.

export const labelCls = "mb-1 block text-xs text-muted";
export const inputCls =
  "h-9 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-fg outline-none focus:border-accent";

/** Converte string de input em número (aceita vírgula); fallback se inválido. */
export function num(v: string, fallback = 0): number {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

export function NumInput({
  value,
  onChange,
  placeholder,
  suffix,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        placeholder={placeholder}
        className={inputCls}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted">
          {suffix}
        </span>
      )}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 accent-[var(--color-accent)]"
      />
      {label}
    </label>
  );
}

/** Linha de resultado "rótulo → valor" usada nos cards de cálculo. */
export function ResultRow({
  label,
  value,
  tone = "fg",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "fg" | "profit" | "loss" | "accent";
}) {
  const toneCls =
    tone === "profit"
      ? "text-profit"
      : tone === "loss"
        ? "text-loss"
        : tone === "accent"
          ? "text-accent"
          : "text-fg";
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/40 py-1.5 last:border-0">
      <span className="text-xs text-muted">{label}</span>
      <span className={`font-mono text-sm font-medium ${toneCls}`}>{value}</span>
    </div>
  );
}
