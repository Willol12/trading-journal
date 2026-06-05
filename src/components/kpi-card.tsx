import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  sub,
  valueClass,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  valueClass?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-muted">{label}</span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <div className={cn("tabular text-2xl font-semibold text-fg", valueClass)}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </Card>
  );
}
