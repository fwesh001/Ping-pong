"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Users, Activity, DollarSign, LifeBuoy } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import AdminStatCard from "@/components/admin/AdminStatCard";

interface DashboardUser {
  id: string;
  fluxUserId: string;
  email: string | null;
  role: string;
  createdAt: string;
}

interface DashboardMonitor {
  id: string;
  serviceName: string;
  isActive: boolean;
}

interface DashboardTransaction {
  id: string;
  amount: number;
  status: string;
}

interface DashboardTicket {
  id: string;
  status: string;
}

interface DashboardLog {
  id: string;
  logType: string;
  action: string;
  timestamp: string;
}

export default function AdminOverviewPage() {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [monitors, setMonitors] = useState<DashboardMonitor[]>([]);
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [tickets, setTickets] = useState<DashboardTicket[]>([]);
  const [logs, setLogs] = useState<DashboardLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, monitorsData, txnData, ticketData, logsData] = await Promise.all([
        adminApi.get<{ users: DashboardUser[] }>("/users?limit=5"),
        adminApi.get<{ monitors: DashboardMonitor[] }>("/monitors?limit=100"),
        adminApi.get<{ transactions: DashboardTransaction[] }>("/transactions?limit=100"),
        adminApi.get<{ tickets: DashboardTicket[] }>("/support?limit=100"),
        adminApi.get<{ logs: DashboardLog[] }>("/logs?limit=5"),
      ]);
      setUsers(usersData.users);
      setMonitors(monitorsData.monitors);
      setTransactions(txnData.transactions);
      setTickets(ticketData.tickets);
      setLogs(logsData.logs);
    } catch (err: any) {
      setError(err.message || "Unable to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeMonitors = monitors.filter((m) => m.isActive).length;
    const totalRevenue = transactions
      .filter((t) => t.status === "COMPLETED")
      .reduce((sum, t) => sum + t.amount, 0);
    const openTickets = tickets.filter((t) => t.status !== "RESOLVED").length;
    return { totalUsers, activeMonitors, totalRevenue, openTickets };
  }, [users, monitors, transactions, tickets]);

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-cyan">Overview</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-100">Command Center Overview</h1>
        <p className="text-slate-400 mt-2">High-level snapshot of platform health and activity.</p>
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-700 bg-rose-900/80 p-4 text-sm text-rose-200">{error}</div>
      )}

      {/* Top Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          title="Total Users"
          metric={loading ? "…" : stats.totalUsers}
          subtitle="registered accounts"
          icon={Users}
          colorTint="text-slate-100"
        />
        <AdminStatCard
          title="Active Monitors"
          metric={loading ? "…" : stats.activeMonitors}
          subtitle="currently running"
          icon={Activity}
          colorTint="text-emerald-400"
        />
        <AdminStatCard
          title="Total Revenue"
          metric={loading ? "…" : `$${stats.totalRevenue.toFixed(2)}`}
          subtitle="completed transactions"
          icon={DollarSign}
          colorTint="text-amber-400"
        />
        <AdminStatCard
          title="Open Tickets"
          metric={loading ? "…" : stats.openTickets}
          subtitle="awaiting resolution"
          icon={LifeBuoy}
          colorTint="text-rose-400"
        />
      </div>

      {/* Bottom Split Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent User Signups */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-100">Recent User Signups</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-2 py-2">Email</th>
                  <th className="px-2 py-2">Role</th>
                  <th className="px-2 py-2">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr><td colSpan={3} className="px-2 py-4 text-slate-500">Loading…</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={3} className="px-2 py-4 text-slate-500">No recent signups.</td></tr>
                ) : (
                  users.slice(0, 5).map((user) => (
                    <tr key={user.id}>
                      <td className="px-2 py-3 text-slate-100">{user.email ?? user.fluxUserId}</td>
                      <td className="px-2 py-3 text-slate-300">{user.role}</td>
                      <td className="px-2 py-3 text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Audit Activity */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-100">Recent Audit Activity</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Action</th>
                  <th className="px-2 py-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr><td colSpan={3} className="px-2 py-4 text-slate-500">Loading…</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={3} className="px-2 py-4 text-slate-500">No recent activity.</td></tr>
                ) : (
                  logs.slice(0, 5).map((log) => (
                    <tr key={log.id}>
                      <td className="px-2 py-3">
                        <span className="inline-block rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
                          {log.logType}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-slate-100">{log.action}</td>
                      <td className="px-2 py-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
