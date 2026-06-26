import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import prisma from "@/lib/db";

export default async function AdminOverviewPage() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) {
    if (auth.status === 401) redirect("/login");
    redirect("/dashboard");
  }

  const [totalUsers, totalPings, activeMonitors] = await Promise.all([
    prisma.user.count(),
    prisma.pingLog.count(),
    prisma.monitor.count({ where: { isActive: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-cyan">Overview</p>
        <h2 className="mt-3 text-3xl font-bold text-slate-100">Admin dashboard</h2>
        <p className="text-slate-400 mt-2">View system health, monitor usage, and global platform metrics.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
          <p className="text-sm text-slate-400">Total Users</p>
          <p className="mt-4 text-4xl font-semibold text-slate-100">{totalUsers}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
          <p className="text-sm text-slate-400">Total Pings</p>
          <p className="mt-4 text-4xl font-semibold text-slate-100">{totalPings}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
          <p className="text-sm text-slate-400">Active Monitors</p>
          <p className="mt-4 text-4xl font-semibold text-slate-100">{activeMonitors}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
        <h3 className="text-lg font-semibold text-slate-100">Quick actions</h3>
        <p className="text-slate-400 mt-3">Use the sidebar to navigate to user management, monitor controls, support tickets, and global settings.</p>
      </div>
    </div>
  );
}
