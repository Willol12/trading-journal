"use client";

import { SidebarContent, type SidebarFooter } from "./sidebar-content";

export type { SidebarFooter };

// Sidebar fixa do desktop (>= md). No mobile a navegação vem do MobileNav
// (drawer aberto pelo hambúrguer na topbar) — mesmo conteúdo, via SidebarContent.
export function Sidebar({ footer }: { footer?: SidebarFooter }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <SidebarContent footer={footer} />
    </aside>
  );
}
