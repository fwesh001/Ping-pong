"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Shield, AlertTriangle, Save, RotateCcw, Pause, Play } from "lucide-react";
import { adminApi } from "@/lib/admin-api";

interface GlobalSettings {
  id: string;
  creditCostPerPing: number;
  globalPause: boolean;
  pollIntervalMs: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceStart: string | null;
  maintenanceEnd: string | null;
  lockdownNewAccounts: boolean;
  lockdownNewMonitors: boolean;
  lockdownMessage: string;
  createdAt: string;
  updatedAt: string;
}

type ResetActionType = "credits" | "slots" | "audit" | null;

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [lockdownNewAccounts, setLockdownNewAccounts] = useState(false);
  const [lockdownNewMonitors, setLockdownNewMonitors] = useState(false);
  const [lockdownMessage, setLockdownMessage] = useState("");
  const [pollIntervalMs, setPollIntervalMs] = useState(1000);
  const [globalPause, setGlobalPause] = useState(false);

  // Danger zone modal state
  const [resetModal, setResetModal] = useState<ResetActionType>(null);
  const [resetConfirmText, setResetConfirmText] = useState("");

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.get<{ settings: GlobalSettings }>("/settings");
      setSettings(data.settings);
      setMaintenanceMode(data.settings.maintenanceMode);
      setMaintenanceMessage(data.settings.maintenanceMessage);
      setLockdownNewAccounts(data.settings.lockdownNewAccounts);
      setLockdownNewMonitors(data.settings.lockdownNewMonitors);
      setLockdownMessage(data.settings.lockdownMessage);
      setPollIntervalMs(data.settings.pollIntervalMs);
      setGlobalPause(data.settings.globalPause);
    } catch (err: any) {
      setError(err.message || "Unable to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveMaintenance = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await adminApi.put("/settings", { maintenanceMode, maintenanceMessage });
      setSuccess("Maintenance settings saved.");
      fetchSettings();
    } catch (err: any) {
      setError(err.message || "Unable to save maintenance settings");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCronEngine = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const newPauseState = !globalPause;
      await adminApi.put("/settings", { globalPause: newPauseState });
      setGlobalPause(newPauseState);
      setSuccess(newPauseState ? "Cron engine paused." : "Cron engine resumed.");
      fetchSettings();
    } catch (err: any) {
      setError(err.message || "Unable to toggle cron engine");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLockdown = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await adminApi.put("/settings", {
        lockdownNewAccounts,
        lockdownNewMonitors,
        lockdownMessage,
        pollIntervalMs,
      });
      setSuccess("Lockdown settings saved.");
      fetchSettings();
    } catch (err: any) {
      setError(err.message || "Unable to save lockdown settings");
    } finally {
      setSaving(false);
    }
  };

  const handleResetAction = (action: ResetActionType) => {
    setResetModal(action);
    setResetConfirmText("");
  };

  const executeReset = () => {
    if (resetConfirmText !== "RESET") return;
    switch (resetModal) {
      case "credits":
        console.warn("[ADMIN] Reset All User Credits — stub execution");
        break;
      case "slots":
        console.warn("[ADMIN] Reset Monitor Slots — stub execution");
        break;
      case "audit":
        console.warn("[ADMIN] Clear Audit Logs — stub execution");
        break;
    }
    setResetModal(null);
    setResetConfirmText("");
  };

  const resetActionLabel = (action: ResetActionType) => {
    switch (action) {
      case "credits":
        return "Reset All User Credits";
      case "slots":
        return "Reset Monitor Slots";
      case "audit":
        return "Clear Audit Logs";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-cyan">Configuration</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-100">Global Settings &amp; Security</h1>
        <p className="text-slate-400 mt-2">Manage maintenance mode, platform lockdown, and system-wide configuration.</p>
      </div>

      {success && (
        <div className="rounded-3xl border border-emerald-700 bg-emerald-900/80 p-4 text-sm text-emerald-200">{success}</div>
      )}
      {error && (
        <div className="rounded-3xl border border-rose-700 bg-rose-900/80 p-4 text-sm text-rose-200">{error}</div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-400">Loading settings…</div>
      ) : (
        <>
          {/* Section 1: App Maintenance Controls */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-slate-100">App Maintenance Controls</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
                <div>
                  <p className="font-medium text-slate-100">Maintenance Mode</p>
                  <p className="text-xs text-slate-500">Temporarily disable the platform for all users.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={maintenanceMode}
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    maintenanceMode ? "bg-brand-cyan" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      maintenanceMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Maintenance Message</label>
                <input
                  type="text"
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  placeholder="e.g. Scheduled maintenance until 3:00 AM UTC"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-cyan focus:outline-none"
                />
              </div>
              <button
                onClick={handleSaveMaintenance}
                disabled={saving}
                className="flex items-center gap-2 rounded-2xl bg-brand-cyan px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-brand-cyan/90 disabled:opacity-50"
              >
                <Save className="w-3 h-3" />
                Save Maintenance Settings
              </button>
            </div>
          </div>

          {/* Section 1.5: Cron Engine Controls */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
            <div className="mb-4 flex items-center gap-2">
              {globalPause ? <Pause className="w-5 h-5 text-rose-400" /> : <Play className="w-5 h-5 text-emerald-400" />}
              <h2 className="text-lg font-semibold text-slate-100">Cron Engine Controls</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
                <div>
                  <p className="font-medium text-slate-100">
                    {globalPause ? "Cron Engine Paused" : "Cron Engine Running"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {globalPause
                      ? "All scheduled pings are currently disabled. Click to resume."
                      : "All scheduled pings are running. Click to pause globally."}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={globalPause}
                  onClick={handleToggleCronEngine}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-50 ${
                    globalPause ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      globalPause ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className={`h-2 w-2 rounded-full ${globalPause ? "bg-rose-500" : "bg-emerald-500 animate-pulse"}`} />
                {globalPause ? "Paused" : "Active"}
              </div>
            </div>
          </div>

          {/* Section 2: Platform Lockdown Settings */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-cyan" />
              <h2 className="text-lg font-semibold text-slate-100">Platform Lockdown Settings</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
                <div>
                  <p className="font-medium text-slate-100">Disable New Account Creation</p>
                  <p className="text-xs text-slate-500">Prevent new users from signing up.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={lockdownNewAccounts}
                  onClick={() => setLockdownNewAccounts(!lockdownNewAccounts)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    lockdownNewAccounts ? "bg-rose-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      lockdownNewAccounts ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
                <div>
                  <p className="font-medium text-slate-100">Disable New Monitor Creation</p>
                  <p className="text-xs text-slate-500">Prevent users from creating new monitors.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={lockdownNewMonitors}
                  onClick={() => setLockdownNewMonitors(!lockdownNewMonitors)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    lockdownNewMonitors ? "bg-rose-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      lockdownNewMonitors ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Lockdown Message</label>
                <input
                  type="text"
                  value={lockdownMessage}
                  onChange={(e) => setLockdownMessage(e.target.value)}
                  placeholder="e.g. New registrations are temporarily disabled."
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-cyan focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Poll Interval (ms)</label>
                <input
                  type="number"
                  value={pollIntervalMs}
                  onChange={(e) => setPollIntervalMs(Number(e.target.value))}
                  step={100}
                  min={100}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 focus:border-brand-cyan focus:outline-none"
                />
              </div>
              <button
                onClick={handleSaveLockdown}
                disabled={saving}
                className="flex items-center gap-2 rounded-2xl bg-brand-cyan px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-brand-cyan/90 disabled:opacity-50"
              >
                <Save className="w-3 h-3" />
                Save Lockdown Settings
              </button>
            </div>
          </div>

          {/* Section 3: System Reset Protocols (Danger Zone) */}
          <div className="rounded-3xl border border-rose-800 bg-rose-950/30 p-6">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h2 className="text-lg font-semibold text-rose-300">System Reset Protocols</h2>
            </div>
            <p className="mb-4 text-sm text-slate-400">These actions are irreversible. Use with extreme caution.</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleResetAction("credits")}
                className="flex items-center gap-2 rounded-2xl border border-rose-700 bg-rose-900/50 px-4 py-2 text-xs font-medium text-rose-300 hover:bg-rose-900"
              >
                <RotateCcw className="w-3 h-3" />
                Reset All User Credits
              </button>
              <button
                onClick={() => handleResetAction("slots")}
                className="flex items-center gap-2 rounded-2xl border border-rose-700 bg-rose-900/50 px-4 py-2 text-xs font-medium text-rose-300 hover:bg-rose-900"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Monitor Slots
              </button>
              <button
                onClick={() => handleResetAction("audit")}
                className="flex items-center gap-2 rounded-2xl border border-rose-700 bg-rose-900/50 px-4 py-2 text-xs font-medium text-rose-300 hover:bg-rose-900"
              >
                <RotateCcw className="w-3 h-3" />
                Clear Audit Logs
              </button>
            </div>
          </div>
        </>
      )}

      {/* Danger Confirmation Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl border border-rose-800 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h3 className="text-lg font-semibold text-rose-300">Confirm: {resetActionLabel(resetModal)}</h3>
            </div>
            <p className="mb-4 text-sm text-slate-400">
              This action is <span className="font-semibold text-rose-300">irreversible</span>. To confirm, type{" "}
              <span className="font-mono font-bold text-rose-300">RESET</span> below.
            </p>
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="Type RESET to confirm"
              className="mb-4 w-full rounded-2xl border border-rose-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setResetModal(null); setResetConfirmText(""); }}
                className="rounded-2xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:border-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={executeReset}
                disabled={resetConfirmText !== "RESET"}
                className="rounded-2xl bg-rose-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-rose-500/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Execute Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
