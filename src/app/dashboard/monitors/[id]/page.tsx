"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface MonitorDetail {
  id: string;
  serviceName: string;
  targetUrl: string;
  pingInterval: number;
  timeoutMs: number;
  isActive: boolean;
  isOneOff: boolean;
  isCompleted: boolean;
  startsAt: string | null;
  endsAt: string | null;
  costPerPing: number;
  lastChecked: string;
  uptime: number;
  createdAt: string;
}

interface Analytics {
  avgResponseTimeMs: number | null;
  totalPings30d: number;
  successPings30d: number;
  failurePings30d: number;
}

interface Incident {
  id: string;
  status: string;
  statusCode: number | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
  checkedAt: string;
}

export default function MonitorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const monitorId = params.id as string;

  const [monitor, setMonitor] = useState<MonitorDetail | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editName, setEditName] = useState("");
  const [editInterval, setEditInterval] = useState(60);
  const [editTimeout, setEditTimeout] = useState(10000);
  const [editStartsAt, setEditStartsAt] = useState("");
  const [editEndsAt, setEditEndsAt] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [isOneOff, setIsOneOff] = useState(false);

  // Confirmation modal
  const [confirmAction, setConfirmAction] = useState<"delete" | "save" | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [meRes, monRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch(`/api/monitors?id=${monitorId}`),
      ]);

      if (!meRes.ok) { router.push("/login"); return; }
      const meData = await meRes.json();
      setCreditBalance(meData.user.creditBalance);

      if (!monRes.ok) throw new Error("Monitor not found");
      const monData = await monRes.json();
      setMonitor(monData.monitor);
      setAnalytics(monData.analytics);
      setIncidents(monData.recentIncidents || []);

      // Initialize edit state
      setEditName(monData.monitor.serviceName);
      setEditInterval(monData.monitor.pingInterval);
      setEditTimeout(monData.monitor.timeoutMs);
      setEditStartsAt(monData.monitor.startsAt ? monData.monitor.startsAt.slice(0, 16) : "");
      setEditEndsAt(monData.monitor.endsAt ? monData.monitor.endsAt.slice(0, 16) : "");
      setIsScheduled(!!monData.monitor.startsAt);
      setIsOneOff(monData.monitor.isOneOff);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [monitorId, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, any> = {
        serviceName: editName,
        pingInterval: editInterval,
        timeoutMs: editTimeout,
        isOneOff,
        startsAt: isScheduled && editStartsAt ? new Date(editStartsAt).toISOString() : null,
        endsAt: isScheduled && editEndsAt ? new Date(editEndsAt).toISOString() : null,
      };

      const res = await fetch(`/api/monitors?id=${monitorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update");
      setConfirmAction(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/monitors?id=${monitorId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/dashboard");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const hasChanges = monitor && (
    editName !== monitor.serviceName ||
    editInterval !== monitor.pingInterval ||
    editTimeout !== monitor.timeoutMs ||
    isOneOff !== monitor.isOneOff ||
    isScheduled !== !!monitor.startsAt
  );

  if (loading) {
    return (
      <><Navbar creditBalance={0} /><main className="flex-1"><div className="container mx-auto px-4 py-8"><div className="flex items-center justify-center py-20"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div></div></main><Footer /></>
    );
  }

  if (error || !monitor) {
    return (
      <><Navbar creditBalance={0} /><main className="flex-1"><div className="container mx-auto px-4 py-8"><div className="card text-center py-12"><p className="text-red-600 mb-4">⚠️ {error || "Not found"}</p><button onClick={() => router.push("/dashboard")} className="btn-primary">Back to Dashboard</button></div></div></main><Footer /></>
    );
  }

  return (
    <>
      <Navbar creditBalance={creditBalance} />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Breadcrumb */}
          <button onClick={() => router.push("/dashboard")} className="text-blue-600 hover:underline text-sm mb-4 inline-flex items-center gap-1">
            ← Back to Dashboard
          </button>

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{monitor.serviceName}</h1>
              <p className="text-gray-500 mt-1 font-mono text-sm break-all">{monitor.targetUrl}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${monitor.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                {monitor.isActive ? "Active" : monitor.isCompleted ? "Completed" : "Paused"}
              </span>
              {monitor.isOneOff && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">One-off</span>
              )}
            </div>
          </div>

          {/* Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="card text-center">
                <p className="text-xs text-gray-500 uppercase font-medium">Uptime (30d)</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{monitor.uptime.toFixed(1)}%</p>
              </div>
              <div className="card text-center">
                <p className="text-xs text-gray-500 uppercase font-medium">Avg Response</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{analytics.avgResponseTimeMs ? `${analytics.avgResponseTimeMs}ms` : "—"}</p>
              </div>
              <div className="card text-center">
                <p className="text-xs text-gray-500 uppercase font-medium">Total Pings</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.totalPings30d}</p>
              </div>
              <div className="card text-center">
                <p className="text-xs text-gray-500 uppercase font-medium">Incidents</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{analytics.failurePings30d}</p>
              </div>
            </div>
          )}

          {/* Configuration Form */}
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Configuration</h2>
            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="input-field" />
              </div>

              {/* Target URL (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target URL</label>
                <input type="text" value={monitor.targetUrl} readOnly className="input-field bg-gray-50 text-gray-500" />
              </div>

              {/* Interval + Timeout */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ping Interval (seconds)</label>
                  <input type="number" value={editInterval} onChange={(e) => setEditInterval(Number(e.target.value))} min={60} max={3600} className="input-field" />
                  <p className="text-xs text-gray-500 mt-1">Minimum 60 seconds</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (ms)</label>
                  <input type="number" value={editTimeout} onChange={(e) => setEditTimeout(Number(e.target.value))} min={1000} max={60000} className="input-field" />
                </div>
              </div>

              {/* Scheduling */}
              <div className="border-t border-gray-200 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Scheduling</h3>
                    <p className="text-xs text-gray-500">Configure when this monitor should run</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {isScheduled && (
                  <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="scheduleType" checked={!isOneOff} onChange={() => setIsOneOff(false)} className="text-blue-600" />
                        <span className="text-sm text-gray-700">Repeat on interval</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="scheduleType" checked={isOneOff} onChange={() => setIsOneOff(true)} className="text-purple-600" />
                        <span className="text-sm text-gray-700">Run once (25 credits)</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start At</label>
                        <input type="datetime-local" value={editStartsAt} onChange={(e) => setEditStartsAt(e.target.value)} className="input-field" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End At (optional)</label>
                        <input type="datetime-local" value={editEndsAt} onChange={(e) => setEditEndsAt(e.target.value)} className="input-field" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cost info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Cost:</span>{" "}
                  {isOneOff
                    ? "25.0000 credits (flat, one-time charge)"
                    : `${((0.8333 * editInterval) / 3600).toFixed(5)} credits/ping (${(((0.8333 * editInterval) / 3600) * ((24 * 3600) / editInterval)).toFixed(4)} credits/day)`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => setConfirmAction("delete")}
                  className="px-4 py-2 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  Delete Monitor
                </button>
                <div className="flex gap-3">
                  <button onClick={() => router.push("/dashboard")} className="btn-secondary">Cancel</button>
                  <button
                    onClick={() => hasChanges ? setConfirmAction("save") : router.push("/dashboard")}
                    disabled={saving}
                    className="btn-primary disabled:opacity-50"
                  >
                    {saving ? "Saving..." : hasChanges ? "Save Changes" : "Done"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Incidents */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Incidents</h2>
            {incidents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Status</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Code</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Response Time</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Error</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map((inc) => (
                      <tr key={inc.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${inc.status === "timeout" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                            {inc.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-gray-600">{inc.statusCode || "—"}</td>
                        <td className="py-2 px-3 text-gray-600">{inc.responseTimeMs ? `${inc.responseTimeMs}ms` : "—"}</td>
                        <td className="py-2 px-3 text-gray-500 max-w-xs truncate">{inc.errorMessage || "—"}</td>
                        <td className="py-2 px-3 text-gray-500">{new Date(inc.checkedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No incidents recorded in the last 30 days 🎉</p>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={confirmAction === "delete"}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleDelete}
        title="Delete Monitor"
        targetName={monitor.serviceName}
        confirmButtonText="Delete Permanently"
        variant="danger"
      />
      <ConfirmationModal
        isOpen={confirmAction === "save"}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleSave}
        title="Save Changes"
        targetName={monitor.serviceName}
        promptText={`Type "${monitor.serviceName}" to confirm changes`}
        confirmButtonText="Save Changes"
        variant="warning"
      />
    </>
  );
}
