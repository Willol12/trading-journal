import { cn } from "@/lib/utils";

// Placeholder de carregamento com brilho (shimmer via CSS).
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-md", className)} aria-hidden="true" />;
}
