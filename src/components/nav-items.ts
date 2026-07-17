// Itens de navegação compartilhados entre a sidebar (desktop), o drawer
// mobile e o título da topbar — fonte única, sem listas duplicadas.

import {
  LayoutDashboard,
  Table,
  BarChart3,
  Calculator,
  TrendingDown,
  BookOpen,
  Building2,
  Settings,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trades", label: "Trades", icon: Table },
  { href: "/analises", label: "Análises", icon: BarChart3 },
  { href: "/calculadora", label: "Calculadora", icon: Calculator },
  { href: "/tendencias", label: "Tendências", icon: TrendingDown },
  { href: "/diario", label: "Diário", icon: BookOpen },
  { href: "/contas", label: "Contas / Mesas", icon: Building2 },
  { href: "/config", label: "Configurações", icon: Settings },
  { href: "/mercadolivre", label: "Mercado Livre", icon: ShoppingCart },
];

/** Título da página atual a partir do pathname (usado na topbar). */
export function navTitle(pathname: string): string {
  const item = NAV.find((i) =>
    i.href === "/" ? pathname === "/" : pathname.startsWith(i.href),
  );
  return item?.label ?? "";
}
