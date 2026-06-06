import { cn } from "@/lib/utils";

type Tone = "neutral" | "profit" | "loss" | "accent";

const toneText: Record<Tone, string> = {
  neutral: "text-fg",
  profit: "text-profit",
  loss: "text-loss",
  accent: "text-accent",
};

// Card de métrica (KPI). Evolui o antigo kpi-card: profundidade, hover com elevação,
// e cor do valor por tom. O `value` é ReactNode (pode receber <AnimatedNumber/> ou <Money/>).
export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "neutral",
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "surface-card rounded-[var(--radius)] border border-border p-4",
        "transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]",
        className,
      )}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        {icon && <span className="text-muted/70">{icon}</span>}
      </div>
      <div className={cn("tabular text-2xl font-semibold tracking-tight", toneText[tone])}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}
