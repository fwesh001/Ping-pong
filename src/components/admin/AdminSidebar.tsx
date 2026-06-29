"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sliders,
  Users,
  Activity,
  CreditCard,
  Bell,
  LifeBuoy,
  Scroll,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/control-panel", label: "Control Panel", icon: Sliders },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/monitors", label: "Monitors", icon: Activity },
  { href: "/admin/credits", label: "Credits", icon: CreditCard },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/support", label: "Support/Reports", icon: LifeBuoy },
  { href: "/admin/audit", label: "Audit Logs", icon: Scroll },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Persist collapsed state to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("admin-sidebar-collapsed");
    if (saved !== null) {
      setCollapsed(saved === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("admin-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 rounded-2xl border border-slate-800 bg-slate-900 p-2 text-slate-200 shadow-lg xl:hidden"
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 xl:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed xl:relative z-40 flex flex-col border border-slate-800 bg-slate-900/95 shadow-lg shadow-black/20 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          ${mobileOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"}
          ${collapsed ? "w-[70px]" : "w-[260px]"}
          h-screen xl:h-auto xl:rounded-3xl
          top-0 left-0 xl:top-auto xl:left-auto
          p-4 xl:p-6
        `}
      >
        {/* Header */}
        <div className={`mb-6 flex items-center justify-between overflow-hidden ${collapsed ? "justify-center" : ""}`}>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admin</p>
              <h1 className="text-lg font-bold text-slate-100 truncate">Control Center</h1>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-xl bg-brand-cyan/20 flex items-center justify-center">
              <Settings className="w-4 h-4 text-brand-cyan" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <div key={href} className="relative">
                <Link
                  href={href}
                  onMouseEnter={() => setHoveredItem(href)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    ${collapsed ? "justify-center" : ""}
                    ${isActive
                      ? "border-brand-cyan bg-slate-800 text-brand-cyan shadow-sm shadow-brand-cyan/10"
                      : "border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-800/60 hover:text-slate-100"
                    }`}
                >
                  <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-brand-cyan" : ""}`} />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>

                {/* Dark pill tooltip when collapsed */}
                {collapsed && hoveredItem === href && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 pointer-events-none">
                    <div className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 whitespace-nowrap shadow-xl">
                      {label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-px">
                        <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[5px] border-r-slate-700" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Back to App link */}
        <div className={`mt-6 mb-2 ${collapsed ? "flex justify-center" : ""}`}>
          <Link
            href="/dashboard"
            onMouseEnter={() => setHoveredItem("__back__")}
            onMouseLeave={() => setHoveredItem(null)}
            className={`flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-sm text-slate-400 hover:border-slate-700 hover:bg-slate-800/60 hover:text-slate-100 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${collapsed ? "justify-center" : "w-full"}`}
          >
            <ArrowLeft className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span className="truncate">Back to App</span>}
          </Link>
          {collapsed && hoveredItem === "__back__" && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 pointer-events-none">
              <div className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 whitespace-nowrap shadow-xl">
                Back to App
                <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-px">
                  <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[5px] border-r-slate-700" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Collapse toggle button (desktop only) */}
        <div className={`mt-2 pt-4 border-t border-slate-800 ${collapsed ? "flex justify-center" : ""}`}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-400 hover:border-slate-600 hover:text-slate-200 transition-colors ${collapsed ? "justify-center" : "w-full"}`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
