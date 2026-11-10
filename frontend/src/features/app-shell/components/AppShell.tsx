"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { IconButton } from "@/components/atoms/IconButton";
import { BrandLogo } from "@/components/molecules/BrandLogo";
import { Sidebar } from "@/features/app-shell/components/Sidebar";

/** Fixed sidebar on desktop; a top bar with a slide-out drawer below `lg`. */
export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 overflow-y-auto border-r border-line lg:block">
        <Sidebar />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
        <Link href="/dashboard" aria-label="Dashboard">
          <BrandLogo size="sm" />
        </Link>
        <IconButton label="Open navigation" size="lg" variant="outline" onClick={() => setDrawerOpen(true)}>
          <Menu />
        </IconButton>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-ink/40" onClick={closeDrawer} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto border-r border-ink shadow-hard">
            <IconButton label="Close navigation" className="absolute top-5 right-3 z-10" onClick={closeDrawer}>
              <X />
            </IconButton>
            <Sidebar onNavigate={closeDrawer} />
          </aside>
        </div>
      )}

      <main className="bg-dots min-h-screen lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
