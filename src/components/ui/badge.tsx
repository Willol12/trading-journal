import { cn } from "@/lib/utils";

type Variant = "win" | "loss" | "be" | "neutral" | "accent" | "warn";

const styles: Record<Variant, string> = {
  win: "bg-profit/15 text-profit ring-1 ring-inset ring-profit/20",
  loss: "bg-loss/15 text-loss ring-1 ring-inset ring-loss/20",
  be: "bg-muted/15 text-muted ring-1 ring-inset ring-muted/20",
  neutral: "bg-surface-2 text-muted ring-1 ring-inset ring-border",
  accent: "bg-accent/15 text-accent ring-1 ring-inset ring-accent/25",
  warn: "bg-warn/15 text-warn ring-1 ring-inset ring-warn/20",
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
