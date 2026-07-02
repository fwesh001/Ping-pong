"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StatusHeroBanner from "@/components/ui/StatusHeroBanner";
import SchedulingTabs, { type ThreeModeFormState } from "@/components/ui/SchedulingTabs";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import {
  CheckCircle2, XCircle, Clock, AlertTriangle, Pause, Play,
  RefreshCw, Timer, Trash2, Save, X, CalendarClock, Zap, ExternalLink,
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
  const [editStartsAt, setEditStartsAt] = useState("");
  const [editEndsAt, setEditEndsAt] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [isOneOff, setIsOneOff] = useState(false);
  // Scheduling form state (reuse same shape as Create drawer)
  const [formSchedule, setFormSchedule] = useState<ThreeModeFormState>({
    scheduleMode: "RECURRING",
    pingIntervalSecs: 60,
    activeDays: [],
    scheduledTime: "09:00",
    executeDate: "",
    oneOffTime: "09:00",
    timeoutMs: 10000,
    maxRetries: 0,
  });

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
      setEditStartsAt(monData.monitor.startsAt ? monData.monitor.startsAt.slice(0, 16) : "");
      setEditEndsAt(monData.monitor.endsAt ? monData.monitor.endsAt.slice(0, 16) : "");
      setIsScheduled(!!monData.monitor.startsAt);
      setIsOneOff(monData.monitor.isOneOff);
      // Initialize scheduling form state from monitor
      try {
        const activeDays = typeof monData.monitor.activeDays === "string"
          ? (JSON.parse(monData.monitor.activeDays) as string[])
          : Array.isArray(monData.monitor.activeDays)
          ? monData.monitor.activeDays
          : (monData.monitor.activeDays ? String(monData.monitor.activeDays).split(",").map((s: string) => s.trim()) : []);

        const executeDate = monData.monitor.startsAt ? monData.monitor.startsAt.slice(0, 10) : "";
        const oneOffTime = monData.monitor.startsAt ? (monData.monitor.startsAt.slice(11, 16)) : "09:00";

        setFormSchedule({
          scheduleMode: monData.monitor.isOneOff ? "ONEOFF" : (monData.monitor.scheduleType === "SCHEDULED" ? "SCHEDULED" : "RECURRING"),
          pingIntervalSecs: monData.monitor.pingInterval || 60,
          activeDays: activeDays || [],
          scheduledTime: monData.monitor.executeTime || "09:00",
          executeDate: executeDate,
          oneOffTime: oneOffTime,
          timeoutMs: monData.monitor.timeoutMs || 10000,
          maxRetries: (monData.monitor as any).maxRetries || 0,
        });
      } catch (e) {
        // best-effort parsing; fall back to defaults
        setFormSchedule((s) => ({ ...s, pingIntervalSecs: monData.monitor.pingInterval || 60, timeoutMs: monData.monitor.timeoutMs || 10000 }));
      }
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
      const isOneOffNow = formSchedule.scheduleMode === "ONEOFF";
      let startsAtVal: string | null = null;
      if (isOneOffNow && formSchedule.executeDate) {
        startsAtVal = new Date(`${formSchedule.executeDate}T${formSchedule.oneOffTime}:00`).toISOString();
      } else if (isScheduled && editStartsAt) {
        startsAtVal = new Date(editStartsAt).toISOString();
      }

      const body: Record<string, any> = {
        serviceName: editName,
        pingInterval: formSchedule.pingIntervalSecs,
        timeoutMs: formSchedule.timeoutMs,
        isOneOff: isOneOffNow,
        startsAt: startsAtVal,
        endsAt: isScheduled && editEndsAt ? new Date(editEndsAt).toISOString() : null,
        activeDays: formSchedule.activeDays,
        scheduledTime: formSchedule.scheduledTime,
        maxRetries: formSchedule.maxRetries,
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

  const parseActiveDays = (value: string | string[] | null): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
      return JSON.parse(value as string) as string[];
    } catch {
      return String(value).split(",").map((d) => d.trim()).filter(Boolean);
    }
  };

  const monitorScheduleMode = monitor
    ? monitor.isOneOff
      ? "ONEOFF"
      : monitor.scheduleType === "SCHEDULED" || monitor.startsAt
      ? "SCHEDULED"
      : "RECURRING"
    : "RECURRING";

  const formatDateTime = (value: string | null) =>
    value ? new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "—";

  const scheduleDetails = () => {
    if (!monitor) return null;

    if (monitor.isOneOff) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-slate-300">Runs once at the scheduled execution time and then completes.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-100">
            <div>
              <p className="text-xs text-slate-400 uppercase">Execution</p>
              <p>{formatDateTime(monitor.startsAt)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase">Status</p>
              <p>{monitor.isCompleted ? "Completed" : "Pending"}</p>
            </div>
          </div>
        </div>
      );
    }

    if (monitor.scheduleType === "SCHEDULED" || monitor.startsAt) {
      const days = parseActiveDays(monitor.activeDays);
      return (
        <div className="space-y-2">
          <p className="text-sm text-slate-300">Runs only during the selected schedule window on chosen days.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-100">
            <div>
              <p className="text-xs text-slate-400 uppercase">Days</p>
              <p>{days.length > 0 ? days.map((day) => day.charAt(0).toUpperCase() + day.slice(1)).join(", ") : "Every day"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase">Execution time</p>
              <p>{monitor.executeTime || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase">Starts</p>
              <p>{formatDateTime(monitor.startsAt)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase">Ends</p>
              <p>{monitor.endsAt ? formatDateTime(monitor.endsAt) : "None"}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <p className="text-sm text-slate-300">Runs repeatedly at a fixed interval as long as the monitor is active.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-100">
          <div>
            <p className="text-xs text-slate-400 uppercase">Interval</p>
            <p>Every {monitor.pingInterval}s</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Last checked</p>
            <p>{formatDateTime(monitor.lastChecked)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Timeout</p>
            <p>{monitor.timeoutMs} ms</p>
          </div>
        </div>
      </div>
    );
  };

  const scheduleModeBadge = () => {
    if (!monitor) return null;
    if (monitor.isOneOff) {
      return {
        label: "One-off",
        icon: <Zap className="w-4 h-4" />,
        badgeClass: "bg-slate-800 text-brand-purple border border-brand-purple",
      };
    }
    if (monitor.scheduleType === "SCHEDULED" || monitor.startsAt) {
      return {
        label: "Scheduled",
        icon: <CalendarClock className="w-4 h-4" />,
        badgeClass: "bg-slate-800 text-emerald-400 border border-emerald-500",
      };
    }
    return {
      label: "Recurring",
      icon: <RefreshCw className="w-4 h-4" />,
      badgeClass: "bg-slate-800 text-brand-cyan border border-brand-cyan",
    };
  };

  const hasChanges = monitor && (
    editName !== monitor.serviceName ||
    isOneOff !== monitor.isOneOff ||
    isScheduled !== !!monitor.startsAt ||
    formSchedule.scheduleMode !== monitorScheduleMode ||
    formSchedule.pingIntervalSecs !== monitor.pingInterval ||
    formSchedule.timeoutMs !== monitor.timeoutMs
  );

  if (loading) {
    return (
      <><Navbar creditBalance={0} /><main className="flex-1"><div className="container mx-auto px-4 py-8"><div className="flex items-center justify-center py-20"><div className="w-12 h-12 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin" /></div></div></main><Footer /></>
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
          <button onClick={() => router.push("/dashboard")} className="text-brand-cyan hover:underline text-sm mb-4 inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
                {monitor.serviceName}
                {monitor.isOneOff && <Zap className="w-5 h-5 text-brand-purple" />}
              </h1>
              <p className="text-slate-400 mt-1 font-mono text-sm break-all flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> {monitor.targetUrl}
              </p>
            </div>

          <div className="grid gap-4 mb-8">
            <div className="card border border-slate-700 bg-slate-900 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Schedule Mode</p>
                  <div className="mt-3 flex items-center gap-2 text-lg font-semibold text-slate-100">
                    {scheduleModeBadge()?.icon}
                    {scheduleModeBadge()?.label}
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${scheduleModeBadge()?.badgeClass}`}>
                  {scheduleModeBadge()?.icon} {scheduleModeBadge()?.label}
                </span>
              </div>
              <div className="mt-4 border-t border-slate-800 pt-4">
                {scheduleDetails()}
              </div>
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
                <p className="text-xs text-slate-400 uppercase font-medium flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" /> Uptime (30d)</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">{monitor.uptime.toFixed(1)}%</p>
              </div>
              <div className="card text-center">
                <p className="text-xs text-slate-400 uppercase font-medium flex items-center justify-center gap-1"><Timer className="w-3 h-3" /> Avg Response</p>
                <p className="text-3xl font-bold text-brand-cyan mt-1">{analytics.avgResponseTimeMs ? `${analytics.avgResponseTimeMs}ms` : "—"}</p>
              </div>
              <div className="card text-center">
                <p className="text-xs text-slate-400 uppercase font-medium flex items-center justify-center gap-1"><BarChart3 className="w-3 h-3" /> Total Pings</p>
                <p className="text-3xl font-bold text-slate-100 mt-1">{analytics.totalPings30d}</p>
              </div>
              <div className="card text-center">
                <p className="text-xs text-slate-400 uppercase font-medium flex items-center justify-center gap-1"><AlertTriangle className="w-3 h-3" /> Incidents</p>
                <p className="text-3xl font-bold text-rose-400 mt-1">{analytics.failurePings30d}</p>
              </div>
            </div>
          )}

          {/* Uptime Timeline Grid */}
          {timelineLogs.length > 0 && (
            <div className="card mb-8">
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-cyan" /> Uptime Timeline
                <span className="text-xs font-normal text-slate-400 ml-2">Last {timelineLogs.length} pings</span>
              </h2>
              <div className="flex flex-wrap gap-1">
                {timelineLogs.map((log) => {
                  const color = log.status === "success"
                    ? "bg-emerald-400"
                    : log.status === "timeout"
                    ? "bg-amber-400"
                    : log.status === "failure"
                    ? "bg-rose-400"
                    : "bg-slate-700";
                  return (
                    <div
                      key={log.id}
                      className={`w-3 h-8 rounded-sm ${color} cursor-pointer hover:opacity-80 transition-opacity`}
                      title={`${log.status} — ${log.responseTimeMs ? `${log.responseTimeMs}ms` : "—"} — ${new Date(log.checkedAt).toLocaleString()}`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" /> Success</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Timeout</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" /> Failure</span>
              </div>
            </div>
          )}

          {/* Configuration Form */}
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-400" /> Configuration
            </h2>
            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Service Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="input-field" />
              </div>

              {/* Target URL (read-only) */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Target URL</label>
                <input type="text" value={monitor.targetUrl} readOnly className="input-field bg-slate-800 text-slate-400" />
              </div>

              {/* Scheduling */}
              <div className="border-t border-slate-700 pt-5">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-100">Scheduling</h3>
                  <p className="text-xs text-slate-400">Configure when this monitor should run</p>
                </div>

                <div className="space-y-4 bg-slate-800 rounded-lg p-4">
                  <SchedulingTabs
                    value={formSchedule}
                    onChange={(s) => {
                      setFormSchedule(s);
                      setIsOneOff(s.scheduleMode === "ONEOFF");
                    }}
                  />
                </div>
              </div>

              {/* Cost info */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <p className="text-sm text-slate-200">
                  <span className="font-semibold">Cost:</span>{" "}
                  {isOneOff || formSchedule.scheduleMode === "ONEOFF"
                    ? "25.0000 credits (flat, one-time charge)"
                    : `${((0.8333 * formSchedule.pingIntervalSecs) / 3600).toFixed(5)} credits/ping (${(((0.8333 * formSchedule.pingIntervalSecs) / 3600) * ((24 * 3600) / formSchedule.pingIntervalSecs)).toFixed(4)} credits/day)`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t border-slate-700">
                <button
                  onClick={() => setConfirmAction("delete")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium bg-rose-700 text-rose-100 hover:bg-rose-600 transition-colors"
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
            <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-rose-400" /> Recent Incidents</h2>
            {incidents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 font-medium text-slate-400">Status</th>
                      <th className="text-left py-2 px-3 font-medium text-slate-400">Code</th>
                      <th className="text-left py-2 px-3 font-medium text-slate-400">Response Time</th>
                      <th className="text-left py-2 px-3 font-medium text-slate-400">Error</th>
                      <th className="text-left py-2 px-3 font-medium text-slate-400">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map((inc) => (
                      <tr key={inc.id} className="border-b border-slate-700 hover:bg-slate-800">
                        <td className="py-2 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${inc.status === "timeout" ? "bg-amber-400 text-slate-900" : "bg-rose-400 text-slate-900"}`}>
                            {inc.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-400">{inc.statusCode || "—"}</td>
                        <td className="py-2 px-3 text-slate-400">{inc.responseTimeMs ? `${inc.responseTimeMs}ms` : "—"}</td>
                        <td className="py-2 px-3 text-slate-400 max-w-xs truncate">{inc.errorMessage || "—"}</td>
                        <td className="py-2 px-3 text-slate-400">{new Date(inc.checkedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8 flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> No incidents recorded in the last 30 days</p>
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
