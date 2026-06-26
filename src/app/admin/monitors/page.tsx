"use client";

import React, { useCallback, useEffect, useState } from "react";

interface AdminMonitor {
  id: string;
  serviceName: string;
  targetUrl: string;
  status: string;
  isActive: boolean;
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
  const [message, setMessage] = useState<string | null>(null);
  const [role, setRole] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, monitorRes] = await Promise.all([fetch("/api/auth/me"), fetch("/api/admin/monitors")]);
      if (!userRes.ok) throw new Error("Authentication required");
      if (!monitorRes.ok) throw new Error("Failed to fetch monitors");
      const userData = await userRes.json();
      const monitorData = await monitorRes.json();
      setRole(userData.user.role);
      setMonitors(monitorData.monitors || []);
    } catch (err: any) {
      setError(err.message || "Unable to load monitors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleActive = async (monitorId: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/admin/monitors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monitorId, isActive: !isActive }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to update monitor");
      }
      setMessage("Monitor status updated.");
      fetchData();
    } catch (err: any) {
      setError(err.message || "Unable to update monitor");
    }
  };

  const deleteMonitor = async (monitorId: string) => {
    try {
      const res = await fetch(`/api/admin/monitors?id=${monitorId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to delete monitor");
      }
      setMessage("Monitor permanently deleted.");
      fetchData();
    } catch (err: any) {
      setError(err.message || "Unable to delete monitor");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-cyan">Monitors</p>
        <h2 className="mt-3 text-3xl font-bold text-slate-100">Global monitor management</h2>
        <p className="text-slate-400 mt-2">Inspect all monitors across the platform and pause or delete them as needed.</p>
      </div>

      {message && <div className="rounded-3xl border border-emerald-700 bg-emerald-900/80 p-4 text-sm text-emerald-200">{message}</div>}
      {error && <div className="rounded-3xl border border-rose-700 bg-rose-900/80 p-4 text-sm text-rose-200">{error}</div>}

      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
          <thead className="bg-slate-900 text-xs uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Target URL</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">Loading monitors…</td>
              </tr>
            ) : monitors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">No monitors found.</td>
              </tr>
            ) : (
              monitors.map((monitor) => (
                <tr key={monitor.id}>
                  <td className="px-4 py-4 text-slate-100">{monitor.serviceName}</td>
                  <td className="px-4 py-4 text-slate-300 truncate max-w-[220px]">{monitor.targetUrl}</td>
                  <td className="px-4 py-4 text-slate-100">{monitor.user.email || monitor.user.fluxUserId}</td>
                  <td className="px-4 py-4 text-slate-100">{monitor.isActive ? "Active" : "Paused"}</td>
                  <td className="px-4 py-4 space-y-2">
                    <button
                      onClick={() => toggleActive(monitor.id, monitor.isActive)}
                      className="rounded-2xl bg-brand-cyan px-3 py-2 text-xs font-semibold text-slate-950"
                    >
                      {monitor.isActive ? "Pause" : "Resume"}
                    </button>
                    {role === "SUPER_ADMIN" && (
                      <button
                        onClick={() => deleteMonitor(monitor.id)}
                        className="rounded-2xl bg-rose-500 px-3 py-2 text-xs font-semibold text-slate-950"
                      >
                        Permanently Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
