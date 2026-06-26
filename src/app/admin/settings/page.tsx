"use client";

import React, { useEffect, useState } from "react";

interface SettingsModel {
  id: string;
  creditCostPerPing: number;
  globalPause: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [creditCostPerPing, setCreditCostPerPing] = useState(0.01389);
  const [globalPause, setGlobalPause] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) throw new Error("Failed to load settings");
        const data = await res.json();
        setSettings(data.settings);
        setCreditCostPerPing(data.settings.creditCostPerPing);
        setGlobalPause(data.settings.globalPause);
      } catch (err: any) {
        setError(err.message || "Unable to load settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditCostPerPing, globalPause }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to save settings");
      }
      const data = await res.json();
      setSettings(data.settings);
      setMessage("Settings saved successfully.");
    } catch (err: any) {
      setError(err.message || "Unable to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-cyan">Settings</p>
        <h2 className="mt-3 text-3xl font-bold text-slate-100">Global configuration</h2>
        <p className="text-slate-400 mt-2">Update the global credit cost and pause the cron engine if needed.</p>
      </div>

      {message && <div className="rounded-3xl border border-emerald-700 bg-emerald-900/80 p-4 text-sm text-emerald-200">{message}</div>}
      {error && <div className="rounded-3xl border border-rose-700 bg-rose-900/80 p-4 text-sm text-rose-200">{error}</div>}

      {loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-400">Loading settings…</div>
      ) : (
        <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-950 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300">
              <span>Credit cost per ping</span>
              <input
                type="number"
                value={creditCostPerPing}
                onChange={(e) => setCreditCostPerPing(Number(e.target.value))}
                step={0.00001}
                min={0}
                className="input-field bg-slate-900 text-slate-100"
              />
            </label>

            <label className="flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-900 px-4 py-4 text-sm text-slate-200">
              <div>
                <p className="font-semibold text-slate-100">Pause cron engine</p>
                <p className="text-slate-500 text-xs">Disable all scheduled pings globally.</p>
              </div>
              <input
                type="checkbox"
                checked={globalPause}
                onChange={(e) => setGlobalPause(e.target.checked)}
                className="h-5 w-5 rounded border-slate-700 bg-slate-800 text-brand-cyan"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="rounded-2xl bg-brand-cyan px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
            <span className="self-center text-sm text-slate-400">Current site settings are saved to the global configuration row.</span>
          </div>
        </div>
      )}
    </div>
  );
}
