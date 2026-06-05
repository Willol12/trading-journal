import { cn } from "@/lib/utils";

type Variant = "win" | "loss" | "be" | "neutral" | "accent" | "warn";

const styles: Record<Variant, string> = {
  win: "bg-profit/15 text-profit",
  loss: "bg-loss/15 text-loss",
  be: "bg-muted/15 text-muted",
  neutral: "bg-surface-2 text-muted",
  accent: "bg-accent/15 text-accent",
  warn: "bg-warn/15 text-warn",
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
