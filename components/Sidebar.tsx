"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useData } from "@/contexts/DataContext";
import MeisterFlowLogo from "@/components/MeisterFlowLogo";
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  CalendarDays,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Settings,
} from "lucide-react";
import { useMemo, useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/kunden", label: "Kunden", icon: Users },
  { href: "/angebote", label: "Angebote", icon: FileText },
  { href: "/rechnungen", label: "Rechnungen", icon: Receipt },
  { href: "/termine", label: "Termine", icon: CalendarDays },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { followUps } = useData();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const openFollowUps = useMemo(
    () => followUps.filter((f) => f.status === "offen").length,
    [followUps],
  );

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-dark-900 border border-dark-800 rounded-lg text-dark-300 hover:text-white"
        aria-label="Menü öffnen"
      >
        <Menu className="w-6 h-6" />
        {openFollowUps > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
            {openFollowUps > 9 ? "9+" : openFollowUps}
          </span>
        )}
      </button>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen bg-dark-900 border-r border-dark-800 flex flex-col transition-all duration-300 z-40 ${
          collapsed ? "w-16" : "w-64"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-3 border-b border-dark-800">
          <Link href="/dashboard" className="flex items-center min-w-0" onClick={closeMobile}>
            {collapsed ? (
              <MeisterFlowLogo iconOnly size="xs" />
            ) : (
              <MeisterFlowLogo size="sm" priority />
            )}
          </Link>
          <button
            onClick={closeMobile}
            className="md:hidden p-1 text-dark-500 hover:text-white"
            aria-label="Menü schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const showBadge = item.href === "/dashboard" && openFollowUps > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className={`flex items-center gap-3 px-3 py-3 md:py-2.5 min-h-[48px] md:min-h-0 rounded-lg transition-all ${
                  isActive
                    ? "bg-brand-600/10 text-brand-400 border border-brand-500/20"
                    : "text-dark-400 hover:bg-dark-800 hover:text-dark-200"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span className="relative shrink-0">
                  <Icon className="w-5 h-5" />
                  {showBadge && collapsed && (
                    <span className="absolute -right-1.5 -top-1.5 h-2 w-2 rounded-full bg-brand-500" />
                  )}
                </span>
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {showBadge && (
                      <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[11px] font-semibold text-brand-300">
                        {openFollowUps}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-dark-800 space-y-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center gap-3 px-3 py-2.5 rounded-lg text-dark-500 hover:bg-dark-800 hover:text-dark-300 transition-all w-full min-h-[48px] md:min-h-0"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 shrink-0" />
                <span className="text-sm">Einklappen</span>
              </>
            )}
          </button>
          <button
            onClick={() => {
              closeMobile();
              signOut();
            }}
            className="flex items-center gap-3 px-3 py-3 md:py-2.5 min-h-[48px] md:min-h-0 rounded-lg text-dark-500 hover:bg-red-500/10 hover:text-red-400 transition-all w-full"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm">Abmelden</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
