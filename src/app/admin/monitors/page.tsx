"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Settings, Activity, Play, Pause, AlertTriangle } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import AdminStatCard from "@/components/admin/AdminStatCard";

interface AdminMonitor {
  id: string;
  serviceName: string;
  targetUrl: string;
  status: string;
  isActive: boolean;
  lastPingedAt: string | null;
  nextCheckAt: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string | null;
    fluxUserId: string;
  };
}

export default function AdminMonitorsPage() {
  const [monitors, setMonitors] = useState<AdminMonitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedMonitor, setSelectedMonitor] = useState<AdminMonitor | null>(null);

  const fetchMonitors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const query = params.toString();
      const data = await adminApi.get<{ monitors: AdminMonitor[] }>(
        `/monitors${query ? `?${query}` : ""}`
      );
      setMonitors(data.monitors);
    } catch (err: any) {
      setError(err.message || "Unable to load monitors");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  const stats = useMemo(() => {
    const total = monitors.length;
    const active = monitors.filter((m) => m.status === "ACTIVE").length;
    const paused = monitors.filter((m) => m.status === "PAUSED").length;
    const failed = monitors.filter((m) => m.status === "FAILED" || m.status === "ERROR").length;
    return { total, active, paused, failed };
  }, [monitors]);

  const handleToggle = async (monitor: AdminMonitor) => {
    try {
      await adminApi.put(`/monitors/${monitor.id}/toggle`, {});
      fetchMonitors();
    } catch (err: any) {
      setError(err.message || "Unable to toggle monitor");
    }
  };

  const handleDelete = async (monitorId: string) => {
    if (!confirm("Permanently delete this monitor? This cannot be undone.")) return;
    try {
      await adminApi.del(`/monitors/${monitorId}`);
      setSelectedMonitor(null);
      fetchMonitors();
    } catch (err: any) {
      setError(err.message || "Unable to delete monitor");
    }
  };

  const statusPillClass = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-700";
      case "PAUSED":
        return "bg-amber-500/20 text-amber-300 border-amber-700";
      case "FAILED":
      case "ERROR":
        return "bg-rose-500/20 text-rose-300 border-rose-700";
      default:
        return "bg-slate-700/20 text-slate-300 border-slate-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-cyan">Infrastructure</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-100">Global Monitor Management</h1>
        <p className="text-slate-400 mt-2">Inspect all monitors across the platform and pause or delete them as needed.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard title="Total Configured" metric={stats.total} icon={Activity} colorTint="text-slate-100" />
        <AdminStatCard title="Active" metric={stats.active} subtitle="running now" icon={Play} colorTint="text-emerald-400" />
        <AdminStatCard title="Paused" metric={stats.paused} subtitle="manually paused" icon={Pause} colorTint="text-amber-400" />
        <AdminStatCard title="Failed" metric={stats.failed} subtitle="requiring attention" icon={AlertTriangle} colorTint="text-rose-400" />
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search by name or URL..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-cyan focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 focus:border-brand-cyan focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-700 bg-rose-900/80 p-4 text-sm text-rose-200">{error}</div>
      )}

      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
          <thead className="bg-slate-900 text-xs uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Monitor Name</th>
              <th className="px-4 py-3">Target URL</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Ping</th>
              <th className="px-4 py-3">Next Ping</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">Loading monitors…</td></tr>
            ) : monitors.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">No monitors found.</td></tr>
            ) : (
              monitors.map((monitor) => (
                <tr key={monitor.id}>
                  <td className="px-4 py-4 text-slate-100">{monitor.serviceName}</td>
                  <td className="px-4 py-4 text-slate-300 truncate max-w-[220px]">{monitor.targetUrl}</td>
                  <td className="px-4 py-4 text-slate-100">{monitor.user.email ?? monitor.user.fluxUserId}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${statusPillClass(monitor.status)}`}>
                      {monitor.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{monitor.lastPingedAt ? new Date(monitor.lastPingedAt).toLocaleString() : "—"}</td>
                  <td className="px-4 py-4 text-slate-300">{monitor.nextCheckAt ? new Date(monitor.nextCheckAt).toLocaleString() : "—"}</td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => setSelectedMonitor(monitor)}
                      className="rounded-2xl border border-slate-700 p-2 text-slate-300 hover:border-brand-cyan hover:text-brand-cyan"
                      aria-label="Monitor settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedMonitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">{selectedMonitor.serviceName}</h3>
              <button onClick={() => setSelectedMonitor(null)} className="text-slate-400 hover:text-slate-100">✕</button>
            </div>

            <div className="space-y-2 text-sm text-slate-300">
              <p><span className="text-slate-500">ID:</span> {selectedMonitor.id}</p>
              <p><span className="text-slate-500">Target:</span> {selectedMonitor.targetUrl}</p>
              <p><span className="text-slate-500">Owner:</span> {selectedMonitor.user.email ?? selectedMonitor.user.fluxUserId}</p>
              <p><span className="text-slate-500">Status:</span> {selectedMonitor.status}</p>
              <p><span className="text-slate-500">Last Ping:</span> {selectedMonitor.lastPingedAt ? new Date(selectedMonitor.lastPingedAt).toLocaleString() : "—"}</p>
              <p><span className="text-slate-500">Next Ping:</span> {selectedMonitor.nextCheckAt ? new Date(selectedMonitor.nextCheckAt).toLocaleString() : "—"}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={() => handleToggle(selectedMonitor)}
                className="rounded-2xl bg-brand-cyan px-4 py-2 text-xs font-semibold text-slate-950"
              >
                {selectedMonitor.isActive ? "Pause Monitor" : "Resume Monitor"}
              </button>
              <button
                onClick={() => handleDelete(selectedMonitor.id)}
                className="rounded-2xl bg-rose-500 px-4 py-2 text-xs font-semibold text-slate-950"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
