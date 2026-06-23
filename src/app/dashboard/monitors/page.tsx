"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CreditDisplay from "@/components/CreditDisplay";
import SlideOverDrawer from "@/components/ui/SlideOverDrawer";
import SchedulingTabs, { type ThreeModeFormState } from "@/components/ui/SchedulingTabs";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import {
  Play, Pause, Trash2, ExternalLink, Plus, Globe,
  Activity, Clock, Zap, Timer, ChevronRight,
} from "lucide-react";

interface Monitor {
  id: string;
  serviceName: string;
  targetUrl: string;
  status: string;
  lastChecked: string;
  uptime: number;
  pingInterval: number;
  isActive: boolean;
  isCompleted: boolean;
  costPerPing: number;
  avgResponseTimeMs: number | null;
  createdAt: string;
  scheduleMode: string;
  maxRetries: number;
  activeDays: string | null;
  executeTime: string | null;
  executeDate: string | null;
}

/* ------------------------------------------------------------------ */
/*  Sparkline placeholder — renders a tiny bar chart from fake data   */
/* ------------------------------------------------------------------ */
function MiniSparkline({ uptime }: { uptime: number }) {
  // Generate 24 bars with slight variation around the uptime value
  const bars = Array.from({ length: 24 }, (_, i) => {
    const base = uptime / 100;
    const noise = (Math.sin(i * 1.7 + uptime) * 0.15);
    return Math.max(0.05, Math.min(1, base + noise));
  });

  const color = uptime >= 99 ? "bg-emerald-400" : uptime >= 95 ? "bg-amber-400" : "bg-rose-400";

  return (
    <div className="flex items-end gap-[2px] h-8 w-24">
      {bars.map((h, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm ${color} opacity-70`}
          style={{ height: `${h * 100}%` }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status badge                                                       */
/* ------------------------------------------------------------------ */
function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-400",
    PAUSED: "bg-amber-400",
    DOWN: "bg-rose-400",
    success: "bg-emerald-400",
    failure: "bg-rose-400",
    timeout: "bg-amber-400",
    unknown: "bg-slate-600",
  };
  return <span className={`w-2.5 h-2.5 rounded-full inline-block ${map[status] || "bg-gray-400"}`} />;
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function MonitorsPage() {
  const router = useRouter();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Form state for the drawer
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");

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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) { router.push("/login"); return; }
      const meData = await meRes.json();
      setCreditBalance(meData.user.creditBalance);

      const monRes = await fetch("/api/monitors");
      if (!monRes.ok) throw new Error("Failed to fetch monitors");
      const monData = await monRes.json();
      setMonitors(monData.monitors || []);
    } catch (err: any) {
      setError(err.message || "Failed to load monitors");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async (id: string) => {
    const monitor = monitors.find((m) => m.id === id);
    if (!monitor) return;
    try {
      const res = await fetch(`/api/monitors?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !monitor.isActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/monitors?id=${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setDeleteTarget(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formName.trim()) errs.name = "Service name is required";
    if (!formUrl.trim()) {
      errs.url = "Target URL is required";
    } else {
      try { new URL(formUrl); } catch { errs.url = "Invalid URL format"; }
    }
    if (formSchedule.scheduleMode === "RECURRING") {
      if (formSchedule.pingIntervalSecs < 60) errs.interval = "Minimum interval is 60 seconds";
      if (formSchedule.pingIntervalSecs > 3600) errs.interval = "Maximum interval is 3600 seconds";
    }
    if (formSchedule.scheduleMode === "SCHEDULED" && formSchedule.activeDays.length === 0) {
      errs.activeDays = "Select at least one day";
    }
    if (formSchedule.scheduleMode === "ONEOFF" && !formSchedule.executeDate) {
      errs.executeDate = "Execution date is required for one-off monitors";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveNew = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const body: Record<string, any> = {
        serviceName: formName.trim(),
        targetUrl: formUrl.trim(),
        scheduleMode: formSchedule.scheduleMode,
        timeoutMs: formSchedule.timeoutMs,
        maxRetries: formSchedule.maxRetries,
      };
      if (formSchedule.scheduleMode === "RECURRING") {
        body.pingIntervalSecs = formSchedule.pingIntervalSecs;
      } else if (formSchedule.scheduleMode === "SCHEDULED") {
        body.activeDays = formSchedule.activeDays.join(",");
        body.executeTime = formSchedule.scheduledTime;
      } else if (formSchedule.scheduleMode === "ONEOFF") {
        body.executeDate = formSchedule.executeDate ? new Date(formSchedule.executeDate).toISOString() : null;
        body.executeTime = formSchedule.oneOffTime;
      }

      const res = await fetch("/api/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create monitor");
      }
      // Reset form
      setFormName("");
      setFormUrl("");

      setFormSchedule({ scheduleMode: "RECURRING", pingIntervalSecs: 60, activeDays: [], scheduledTime: "09:00", executeDate: "", oneOffTime: "09:00", timeoutMs: 10000, maxRetries: 0 });
      setFormErrors({});
      setDrawerOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelDrawer = () => {
    setDrawerOpen(false);
    setFormErrors({});
  };

  /* ---- Loading ---- */
  if (loading) {
    return (
      <>
        <Navbar creditBalance={0} />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  /* ---- Error ---- */
  if (error) {
    return (
      <>
        <Navbar creditBalance={0} />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div className="card text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={fetchData} className="btn-primary">Retry</button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const activeMonitors = monitors.filter((m) => m.isActive && !m.isCompleted);
  const avgUptime = monitors.length > 0 ? monitors.reduce((s, m) => s + m.uptime, 0) / monitors.length : 0;

  return (
    <>
      <Navbar creditBalance={creditBalance} />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Monitors</h1>
              <p className="text-gray-500 mt-1">Manage and track all your service monitors</p>
            </div>
            <button
              onClick={() => setDrawerOpen(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create New Monitor
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <CreditDisplay balance={creditBalance} />
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 uppercase">Active Monitors</h3>
              <p className="text-4xl font-bold text-blue-600 mt-2">{activeMonitors.length}</p>
              <p className="text-sm text-gray-600 mt-1">of {monitors.length} total</p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 uppercase">Avg Uptime</h3>
              <p className="text-4xl font-bold text-green-600 mt-2">{avgUptime.toFixed(1)}%</p>
              <p className="text-sm text-gray-600 mt-1">Last 30 days</p>
            </div>
          </div>

          {/* Monitor List */}
          {monitors.length > 0 ? (
            <div className="space-y-3">
              {monitors.map((m) => (
                <div
                  key={m.id}
                  className="card hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center gap-4">
                    {/* Status dot */}
                    <StatusDot status={m.isActive ? "ACTIVE" : "PAUSED"} />

                    {/* Domain + name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900 truncate">{m.serviceName}</h3>
                        {m.scheduleMode === "ONEOFF" && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700">
                            <Zap className="w-2.5 h-2.5" /> One-off
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-mono truncate flex items-center gap-1 mt-0.5">
                        <Globe className="w-3 h-3 flex-shrink-0" /> {m.targetUrl}
                      </p>
                    </div>

                    {/* Uptime */}
                    <div className="hidden sm:block text-right">
                      <p className="text-xs text-gray-500 uppercase">Uptime</p>
                      <p className={`text-sm font-bold ${m.uptime >= 99 ? "text-green-600" : m.uptime >= 95 ? "text-yellow-600" : "text-red-600"}`}>
                        {m.uptime.toFixed(1)}%
                      </p>
                    </div>

                    {/* Sparkline */}
                    <div className="hidden md:block">
                      <MiniSparkline uptime={m.uptime} />
                    </div>

                    {/* Interval */}
                    <div className="hidden lg:block text-right">
                      <p className="text-xs text-gray-500 uppercase flex items-center gap-1 justify-end">
                        <Timer className="w-3 h-3" /> Interval
                      </p>
                      <p className="text-sm font-medium text-gray-700">{m.pingInterval}s</p>
                    </div>

                    {/* Quick pause */}
                    <button
                      onClick={() => handleToggle(m.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        m.isActive
                          ? "text-amber-500 hover:bg-amber-50"
                          : "text-green-600 hover:bg-green-50"
                      }`}
                      title={m.isActive ? "Pause" : "Resume"}
                    >
                      {m.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    {/* Details link */}
                    <button
                      onClick={() => router.push(`/dashboard/monitors/${m.id}`)}
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="View details"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="card text-center py-20">
              <Image
                src="/ping-pong.png"
                alt="ping-pong"
                width={96}
                height={96}
                className="rounded-2xl mx-auto mb-6 opacity-30"
                style={{ width: "auto", height: "auto" }}
              />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No monitors yet</h3>
              <p className="text-gray-500 mb-8 text-sm max-w-md mx-auto">
                Start monitoring your web services by creating your first monitor. Track uptime, response times, and get alerted when things go down.
              </p>
              <button
                onClick={() => setDrawerOpen(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create New Monitor
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Slide-Over Drawer */}
      <SlideOverDrawer
        isOpen={drawerOpen}
        onClose={handleCancelDrawer}
        title="Configure New Monitor"
        footer={
          <>
            <button
              type="button"
              onClick={handleCancelDrawer}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveNew}
              disabled={saving}
              className="btn-primary disabled:opacity-50 inline-flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" /> Saving…
                </>
              ) : (
                "Save Monitor"
              )}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Service Name */}
          <div>
            <label htmlFor="drawerName" className="block text-sm font-medium text-gray-700 mb-1">
              Service Name
            </label>
            <input
              id="drawerName"
              type="text"
              value={formName}
              onChange={(e) => { setFormName(e.target.value); setFormErrors((p) => { const n = { ...p }; delete n.name; return n; }); }}
              placeholder="e.g., API Server"
              className={`input-field ${formErrors.name ? "border-red-500" : ""}`}
            />
            {formErrors.name && <p className="text-red-600 text-xs mt-1">{formErrors.name}</p>}
          </div>

          {/* Target URL */}
          <div>
            <label htmlFor="drawerUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Target URL
            </label>
            <input
              id="drawerUrl"
              type="text"
              value={formUrl}
              onChange={(e) => { setFormUrl(e.target.value); setFormErrors((p) => { const n = { ...p }; delete n.url; return n; }); }}
              placeholder="https://api.example.com/health"
              className={`input-field ${formErrors.url ? "border-red-500" : ""}`}
            />
            {formErrors.url && <p className="text-red-600 text-xs mt-1">{formErrors.url}</p>}
          </div>

          {/* Scheduling Tabs */}
          <div className="border-t border-gray-200 pt-5">
            <h3 className="text-sm font-medium text-gray-900 mb-1">Schedule Configuration</h3>
            <p className="text-xs text-gray-500 mb-4">Choose how this monitor should run</p>
            <SchedulingTabs value={formSchedule} onChange={setFormSchedule} />
          </div>

          {/* Cost Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Estimated Cost:</span>{" "}
              {formSchedule.scheduleMode === "ONEOFF"
                ? "25.0000 credits (flat, one-time)"
                : `${((0.8333 * formSchedule.pingIntervalSecs) / 3600).toFixed(5)} credits/ping (${(((0.8333 * formSchedule.pingIntervalSecs) / 3600) * ((24 * 3600) / formSchedule.pingIntervalSecs)).toFixed(4)} credits/day)`}
            </p>
            {formSchedule.maxRetries > 0 && formSchedule.scheduleMode !== "ONEOFF" && (
              <p className="text-xs text-amber-700 mt-2">
                + {formSchedule.maxRetries} retry attempt(s) × {((0.8333 * formSchedule.pingIntervalSecs) / 3600).toFixed(5)} credits each if ping fails
              </p>
            )}
          </div>
        </div>
      </SlideOverDrawer>

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Monitor"
        targetName={deleteTarget?.name || ""}
        confirmButtonText="Delete Permanently"
        variant="danger"
      />
    </>
  );
}
