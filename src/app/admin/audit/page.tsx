"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Scroll, Users, Activity, AlertTriangle } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import AdminStatCard from "@/components/admin/AdminStatCard";

interface AuditLog {
  id: string;
  logType: string;
  userId: string | null;
  action: string;
  details: string | null;
  timestamp: string;
}

const LOG_TYPE_OPTIONS = ["ALL", "USER_ACT", "MON_ACT", "SYS_EVNT"];

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (typeFilter !== "ALL") params.set("logType", typeFilter);
      const query = params.toString();
      const data = await adminApi.get<{ logs: AuditLog[] }>(
        `/logs${query ? `?${query}` : ""}`
      );
      setLogs(data.logs);
    } catch (err: any) {
      setError(err.message || "Unable to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const stats = useMemo(() => {
    const total = logs.length;
    const userActivity = logs.filter((l) => l.logType === "USER_ACT").length;
    const engineMonitors = logs.filter((l) => l.logType === "MON_ACT").length;
    const systemAlerts = logs.filter((l) => l.logType === "SYS_EVNT").length;
    return { total, userActivity, engineMonitors, systemAlerts };
  }, [logs]);

  const typeBadgeClass = (logType: string) => {
    switch (logType) {
      case "USER_ACT":
        return "bg-brand-cyan/20 text-brand-cyan border-brand-cyan/50";
      case "MON_ACT":
        return "bg-purple-500/20 text-purple-300 border-purple-700";
      case "SYS_EVNT":
        return "bg-amber-500/20 text-amber-300 border-amber-700";
      default:
        return "bg-slate-700/20 text-slate-300 border-slate-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-cyan">Audit</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-100">System Audit Logs</h1>
        <p className="text-slate-400 mt-2">Review administrative actions and system events.</p>
      </div>

      {/* Analytics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          title="Total Logs"
          metric={stats.total}
          subtitle="entries indexed"
          icon={Scroll}
          colorTint="text-slate-100"
        />
        <AdminStatCard
          title="User Activity"
          metric={stats.userActivity}
          subtitle="USER_ACT events"
          icon={Users}
          colorTint="text-brand-cyan"
        />
        <AdminStatCard
          title="Engine/Monitors"
          metric={stats.engineMonitors}
          subtitle="MON_ACT events"
          icon={Activity}
          colorTint="text-purple-400"
        />
        <AdminStatCard
          title="System Alerts"
          metric={stats.systemAlerts}
          subtitle="SYS_EVNT events"
          icon={AlertTriangle}
          colorTint="text-amber-400"
        />
      </div>

      {/* Command Bar */}
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search by User ID or Action..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-cyan focus:outline-none"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 focus:border-brand-cyan focus:outline-none"
        >
          {LOG_TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {type === "ALL" ? "All Types" : type}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-700 bg-rose-900/80 p-4 text-sm text-rose-200">{error}</div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
          <thead className="bg-slate-900 text-xs uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Log Type</th>
              <th className="px-4 py-3">User / System</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Loading logs…</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No logs found.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-4">
                    <span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${typeBadgeClass(log.logType)}`}>
                      {log.logType}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-100 font-mono text-xs">{log.userId ?? "SYSTEM"}</td>
                  <td className="px-4 py-4 text-slate-100">{log.action}</td>
                  <td className="px-4 py-4 text-slate-300">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-4 text-slate-400 truncate max-w-[200px]">{log.details ?? "—"}</td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="rounded-2xl border border-slate-700 p-2 text-slate-300 hover:border-brand-cyan hover:text-brand-cyan"
                      aria-label="View log details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Log Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">Log Inspector</h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-100">✕</button>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                  <p className="text-xs text-slate-500">Log ID</p>
                  <p className="font-mono text-xs text-slate-100">{selectedLog.id}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                  <p className="text-xs text-slate-500">Type</p>
                  <p><span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${typeBadgeClass(selectedLog.logType)}`}>{selectedLog.logType}</span></p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                  <p className="text-xs text-slate-500">Action</p>
                  <p className="text-slate-100">{selectedLog.action}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                  <p className="text-xs text-slate-500">Timestamp</p>
                  <p className="text-slate-100">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                <p className="text-xs text-slate-500">User / System</p>
                <p className="font-mono text-xs text-slate-100">{selectedLog.userId ?? "SYSTEM"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Details Payload</p>
                <pre className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-xs text-slate-100 overflow-x-auto whitespace-pre-wrap">
                  <code>{selectedLog.details ?? "No additional details"}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
