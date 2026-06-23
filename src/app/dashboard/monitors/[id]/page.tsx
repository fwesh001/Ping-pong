"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StatusHeroBanner from "@/components/ui/StatusHeroBanner";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import {
  CheckCircle2, XCircle, Clock, AlertTriangle, Pause, Play,
  Timer, Trash2, Save, X, CalendarClock, Zap, ExternalLink,
  BarChart3, Activity, Globe, Settings, ChevronLeft,
} from "lucide-react";

interface MonitorDetail {
  id: string;
  serviceName: string;
  targetUrl: string;
  pingInterval: number;
  timeoutMs: number;
  isActive: boolean;
  status: string;
  isOneOff: boolean;
  isCompleted: boolean;
  startsAt: string | null;
  endsAt: string | null;
  costPerPing: number;
  lastChecked: string;
  uptime: number;
  createdAt: string;
  scheduleType: string;
  activeDays: string;
  executeTime: string;
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

interface TimelineLog {
  id: string;
  status: string;
  responseTimeMs: number | null;
  checkedAt: string;
}

export default function MonitorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const monitorId = params.id as string;

  const [monitor, setMonitor] = useState<MonitorDetail | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [timelineLogs, setTimelineLogs] = useState<TimelineLog[]>([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

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

      // Fetch timeline logs (last 50 pings)
      const timelineRes = await fetch(`/api/logs?monitorId=${monitorId}&limit=50`);
      if (timelineRes.ok) {
        const timelineData = await timelineRes.json();
        setTimelineLogs(timelineData.logs || []);
      }

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

  /* ---- Status Hero Toggle ---- */
  const handleStatusToggle = async () => {
    setToggling(true);
    try {
      const res = await fetch(`/api/monitors/toggle?id=${monitorId}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to toggle status");
      const data = await res.json();
      // Optimistic update
      setMonitor((prev) =>
        prev
          ? { ...prev, isActive: data.monitor.isActive, status: data.monitor.status }
          : prev
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setToggling(false);
    }
  };

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

  const handleResume = async () => {
    try {
      const res = await fetch(`/api/monitors?id=${monitorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true, status: "ACTIVE" }),
      });
      if (!res.ok) throw new Error("Failed to resume");
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Derive display status for the hero banner
  const getDisplayStatus = (): "ACTIVE" | "PAUSED" | "DOWN" => {
    if (!monitor) return "PAUSED";
    if (monitor.status === "DOWN") return "DOWN";
    return monitor.isActive ? "ACTIVE" : "PAUSED";
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
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                {monitor.serviceName}
                {monitor.isOneOff && <Zap className="w-5 h-5 text-purple-500" />}
              </h1>
              <p className="text-gray-500 mt-1 font-mono text-sm break-all flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> {monitor.targetUrl}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {monitor.isCompleted ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                </span>
              ) : monitor.startsAt && new Date(monitor.startsAt) > new Date() ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <CalendarClock className="w-3.5 h-3.5" /> Scheduled
                </span>
              ) : monitor.isActive ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Play className="w-3.5 h-3.5" /> Active
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <Pause className="w-3.5 h-3.5" /> Paused
                  </span>
                  <button
                    onClick={handleResume}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" /> Resume
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ===== STATUS HERO BANNER ===== */}
          <div className="mb-8">
            <StatusHeroBanner
              status={getDisplayStatus()}
              onToggle={handleStatusToggle}
              toggling={toggling}
            />
          </div>

          {/* Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="card text-center">
                <p className="text-xs text-gray-500 uppercase font-medium flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" /> Uptime (30d)</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{monitor.uptime.toFixed(1)}%</p>
              </div>
              <div className="card text-center">
                <p className="text-xs text-gray-500 uppercase font-medium flex items-center justify-center gap-1"><Timer className="w-3 h-3" /> Avg Response</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{analytics.avgResponseTimeMs ? `${analytics.avgResponseTimeMs}ms` : "—"}</p>
              </div>
              <div className="card text-center">
                <p className="text-xs text-gray-500 uppercase font-medium flex items-center justify-center gap-1"><BarChart3 className="w-3 h-3" /> Total Pings</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.totalPings30d}</p>
              </div>
              <div className="card text-center">
                <p className="text-xs text-gray-500 uppercase font-medium flex items-center justify-center gap-1"><AlertTriangle className="w-3 h-3" /> Incidents</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{analytics.failurePings30d}</p>
              </div>
            </div>
          )}

          {/* Uptime Timeline Grid */}
          {timelineLogs.length > 0 && (
            <div className="card mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" /> Uptime Timeline
                <span className="text-xs font-normal text-gray-500 ml-2">Last {timelineLogs.length} pings</span>
              </h2>
              <div className="flex flex-wrap gap-1">
                {timelineLogs.map((log) => {
                  const color = log.status === "success"
                    ? "bg-green-500"
                    : log.status === "timeout"
                    ? "bg-yellow-400"
                    : log.status === "failure"
                    ? "bg-red-500"
                    : "bg-gray-300";
                  return (
                    <div
                      key={log.id}
                      className={`w-3 h-8 rounded-sm ${color} cursor-pointer hover:opacity-80 transition-opacity`}
                      title={`${log.status} — ${log.responseTimeMs ? `${log.responseTimeMs}ms` : "—"} — ${new Date(log.checkedAt).toLocaleString()}`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Success</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-400 inline-block" /> Timeout</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Failure</span>
              </div>
            </div>
          )}

          {/* Configuration Form */}
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" /> Configuration
            </h2>
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

              {/* 3-Mode Scheduling */}
              <div className="border-t border-gray-200 pt-5">
                <SchedulingTabs value={editSchedule} onChange={setEditSchedule} />
              </div>

              {/* Cost info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Cost:</span>{" "}
                  {editSchedule.scheduleMode === "ONEOFF"
                    ? "25.0000 credits (flat, one-time charge)"
                    : `${((0.8333 * editSchedule.pingIntervalSecs) / 3600).toFixed(5)} credits/ping (${(((0.8333 * editSchedule.pingIntervalSecs) / 3600) * ((24 * 3600) / editSchedule.pingIntervalSecs)).toFixed(4)} credits/day)`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => setConfirmAction("delete")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Monitor
                </button>
                <div className="flex gap-3">
                  <button onClick={() => router.push("/dashboard")} className="btn-secondary inline-flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> Cancel</button>
                  <button
                    onClick={() => hasChanges ? setConfirmAction("save") : router.push("/dashboard")}
                    disabled={saving}
                    className="btn-primary disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {saving ? <><Clock className="w-3.5 h-3.5 animate-spin" /> Saving...</> : hasChanges ? <><Save className="w-3.5 h-3.5" /> Save Changes</> : "Done"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Incidents */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /> Recent Incidents</h2>
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
              <p className="text-gray-500 text-center py-8 flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-400" /> No incidents recorded in the last 30 days</p>
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
