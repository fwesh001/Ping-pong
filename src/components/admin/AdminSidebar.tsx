"use client";

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

  return (
    <nav className="space-y-2">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
              isActive
                ? "border-brand-cyan bg-slate-900 text-brand-cyan"
                : "border-slate-800 bg-slate-950 text-slate-200 hover:border-brand-cyan hover:bg-slate-900"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
