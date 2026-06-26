import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/support", label: "Support & Reports" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/monitors", label: "Monitors" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) {
    if (auth.status === 401) {
      redirect("/login");
    }
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col xl:flex-row gap-6">
          <aside className="w-full xl:w-80 rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-black/20">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Admin Workspace</p>
              <h1 className="text-2xl font-bold text-slate-100 mt-3">Control Center</h1>
              <p className="text-slate-400 mt-2 text-sm">Manage users, monitors, support tickets, and global settings.</p>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 transition hover:border-brand-cyan hover:bg-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <main className="min-w-0 flex-1 rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-black/20">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
