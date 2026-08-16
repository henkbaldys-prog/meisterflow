"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import MeisterFlowLogo from "@/components/MeisterFlowLogo";
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Settings,
  // Versteckt im Fokus-Modus (Code behalten):
  // Receipt, CalendarDays, Megaphone, HardHat,
} from "lucide-react";
import { useState } from "react";
import { SHOW } from "@/lib/feature-flags";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/angebote", label: "Angebote", icon: FileText },
  { href: "/kunden", label: "Kunden", icon: Users },
  // Fokus: Rechnungen/Termine/Team/Marketing ausgeblendet
  // { href: "/rechnungen", label: "Rechnungen", icon: Receipt, show: SHOW.sidebarRechnungen },
  // { href: "/termine", label: "Termine", icon: CalendarDays, show: SHOW.sidebarTermine },
  // { href: "/team", label: "Team", icon: HardHat, show: SHOW.sidebarTeam },
  // { href: "/marketing", label: "Marketing", icon: Megaphone, show: SHOW.sidebarMarketing },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
].filter((item) => (item as { show?: boolean }).show !== false);

// Unused flag refs keep SHOW imports intentional for future toggle
void SHOW;

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-btn border border-white/[0.06] bg-dark-900 text-dark-300 hover:text-white"
        aria-label="Menü öffnen"
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} />
      </button>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-[8px]"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/[0.06] bg-dark-900/95 backdrop-blur-xl transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-[240px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-3">
          <Link href="/dashboard" className="flex min-w-0 items-center" onClick={closeMobile}>
            {collapsed ? (
              <MeisterFlowLogo iconOnly size="xs" />
            ) : (
              <MeisterFlowLogo size="sm" priority />
            )}
          </Link>
          <button
            onClick={closeMobile}
            className="modal-close md:hidden static"
            aria-label="Menü schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className={`flex min-h-[48px] items-center gap-3 rounded-btn px-3 py-2.5 transition-all ${
                  isActive
                    ? "bg-brand-500/10 text-brand-400"
                    : "text-dark-400 hover:bg-white/[0.03] hover:text-white"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-white/[0.06] p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn-ghost hidden w-full justify-start min-h-[44px] md:flex"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                <span>Einklappen</span>
              </>
            )}
          </button>
          <button
            onClick={() => {
              closeMobile();
              signOut();
            }}
            className="flex min-h-[48px] w-full items-center gap-3 rounded-btn px-3 py-2.5 text-dark-400 transition-all hover:bg-danger/10 hover:text-danger"
          >
            <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            {!collapsed && <span className="text-sm font-medium">Abmelden</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
