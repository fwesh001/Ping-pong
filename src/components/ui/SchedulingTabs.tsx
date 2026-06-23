"use client";

import React from "react";
import { RefreshCw, CalendarDays, Crosshair, ShieldCheck, Info } from "lucide-react";

export type ScheduleMode = "RECURRING" | "SCHEDULED" | "ONEOFF";

export interface ThreeModeFormState {
  scheduleMode: ScheduleMode;
  // RECURRING
  pingIntervalSecs: number;
  // SCHEDULED
  activeDays: string[];
  scheduledTime: string;
  // ONEOFF
  executeDate: string;
  oneOffTime: string;
  // Shared
  timeoutMs: number;
  maxRetries: number;
}

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const RETRY_OPTIONS = [
  { value: 0, label: "0 — Instant Alert" },
  { value: 1, label: "1 — Double-Check" },
  { value: 2, label: "2 — Max Verification" },
];

interface SchedulingTabsProps {
  value: ThreeModeFormState;
  onChange: (state: ThreeModeFormState) => void;
}

const MODE_TABS: { key: ScheduleMode; label: string; icon: React.ReactNode; color: string; activeColor: string }[] = [
  { key: "RECURRING", label: "Recurring", icon: <RefreshCw className="w-3.5 h-3.5" />, color: "text-brand-cyan", activeColor: "bg-slate-700 border-brand-cyan" },
  { key: "SCHEDULED", label: "Scheduled", icon: <CalendarDays className="w-3.5 h-3.5" />, color: "text-emerald-400", activeColor: "bg-slate-700 border-emerald-500" },
  { key: "ONEOFF", label: "One-Off", icon: <Crosshair className="w-3.5 h-3.5" />, color: "text-brand-purple", activeColor: "bg-slate-700 border-brand-purple" },
];

function RetryControls({ value, onChange }: { value: ThreeModeFormState; onChange: (s: ThreeModeFormState) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={`retry-${value.scheduleMode}`} className="block text-sm font-medium text-slate-100 mb-1">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Max Retry Attempts
          </span>
        </label>
        <select
          id={`retry-${value.scheduleMode}`}
          value={value.maxRetries}
          onChange={(e) => onChange({ ...value, maxRetries: Number(e.target.value) })}
          className="input-field w-full max-w-xs"
        >
          {RETRY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {value.maxRetries > 0 && (
        <div className="flex items-start gap-2 bg-slate-800 border border-amber-700 rounded-lg p-3">
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-400 leading-relaxed">
            <strong>Metered Billing Notice:</strong> Each active verification retry performs live network checks and consumes <strong>1 additional credit</strong> from your wallet balance per retry attempt.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SchedulingTabs({ value, onChange }: SchedulingTabsProps) {
  const toggleDay = (day: string) => {
    const next = value.activeDays.includes(day)
      ? value.activeDays.filter((d) => d !== day)
      : [...value.activeDays, day];
    onChange({ ...value, activeDays: next });
  };

  return (
    <div className="space-y-5">
      {/* ── 3-Mode Horizontal Segmented Control ── */}
      <div className="flex rounded-xl bg-slate-800 p-1 gap-1">
        {MODE_TABS.map((tab) => {
          const isActive = value.scheduleMode === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange({ ...value, scheduleMode: tab.key })}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? `${tab.activeColor} ${tab.color} shadow-sm border`
                  : "text-slate-300 hover:text-slate-100 border border-transparent"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── RECURRING: Ping Interval + Timeout + Retries ── */}
      {value.scheduleMode === "RECURRING" && (
        <div className="space-y-4">
          <div>
            <label htmlFor="recInterval" className="block text-sm font-medium text-slate-100 mb-1">
              Ping Interval (seconds)
            </label>
            <input
              id="recInterval"
              type="number"
              value={value.pingIntervalSecs}
              onChange={(e) => onChange({ ...value, pingIntervalSecs: Number(e.target.value) })}
              min={60}
              max={3600}
              className="input-field w-48"
            />
            <p className="text-xs text-slate-400 mt-1">Minimum 60 seconds, maximum 3600 (1 hour)</p>
          </div>
          <div>
            <label htmlFor="recTimeout" className="block text-sm font-medium text-slate-100 mb-1">
              Timeout (ms)
            </label>
            <input
              id="recTimeout"
              type="number"
              value={value.timeoutMs}
              onChange={(e) => onChange({ ...value, timeoutMs: Number(e.target.value) })}
              min={1000}
              max={60000}
              step={500}
              className="input-field w-40"
            />
          </div>
          <RetryControls value={value} onChange={onChange} />
        </div>
      )}

      {/* ── SCHEDULED: Day Grid + Execution Time + Timeout + Retries ── */}
      {value.scheduleMode === "SCHEDULED" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-100 mb-3">
              Active Days
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const checked = value.activeDays.includes(day.key);
                return (
                  <label
                    key={day.key}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all duration-150 ${
                      checked
                        ? "border-emerald-500 bg-slate-800 text-emerald-400"
                        : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
                    }`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDay(day.key)}
                      className="sr-only"
                    />
                    <span
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        checked ? "border-emerald-500 bg-emerald-400" : "border-slate-600"
                      }`}
                    >
                      {checked && (
                        <svg className="w-3 h-3 text-slate-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="text-sm font-medium">{day.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="schedTime" className="block text-sm font-medium text-slate-100 mb-1">
              Execution Time
            </label>
            <input
              id="schedTime"
              type="time"
              value={value.scheduledTime}
              onChange={(e) => onChange({ ...value, scheduledTime: e.target.value })}
              className="input-field w-48"
            />
            <p className="text-xs text-slate-400 mt-1">Time of day to run pings (HH:MM)</p>
          </div>

          <div>
            <label htmlFor="schedTimeout" className="block text-sm font-medium text-slate-100 mb-1">
              Timeout (ms)
            </label>
            <input
              id="schedTimeout"
              type="number"
              value={value.timeoutMs}
              onChange={(e) => onChange({ ...value, timeoutMs: Number(e.target.value) })}
              min={1000}
              max={60000}
              step={500}
              className="input-field w-40"
            />
          </div>
          <RetryControls value={value} onChange={onChange} />
        </div>
      )}

      {/* ── ONEOFF: Calendar Date + Time + Timeout (default 20000) ── */}
      {value.scheduleMode === "ONEOFF" && (
        <div className="space-y-4 bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 text-brand-purple font-semibold text-sm">
            <Crosshair className="w-4 h-4 text-brand-purple" />
            One-Time Execution
          </div>
          <p className="text-sm text-slate-300">
            This monitor will execute a single ping at the specified date and time, then auto-complete. A flat fee of <strong>25 credits</strong> will be deducted.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="oneoffDate" className="block text-sm font-medium text-slate-100 mb-1">
                Execution Date
              </label>
              <input
                id="oneoffDate"
                type="date"
                value={value.executeDate}
                onChange={(e) => onChange({ ...value, executeDate: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="oneoffTime" className="block text-sm font-medium text-slate-100 mb-1">
                Execution Time
              </label>
              <input
                id="oneoffTime"
                type="time"
                value={value.oneOffTime}
                onChange={(e) => onChange({ ...value, oneOffTime: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label htmlFor="oneoffTimeout" className="block text-sm font-medium text-slate-100 mb-1">
              Timeout (ms)
            </label>
            <input
              id="oneoffTimeout"
              type="number"
              value={value.timeoutMs}
              onChange={(e) => onChange({ ...value, timeoutMs: Number(e.target.value) })}
              min={1000}
              max={60000}
              step={500}
              className="input-field w-40"
            />
            <p className="text-xs text-slate-400 mt-1">Default: 20000ms</p>
          </div>
        </div>
      )}
    </div>
  );
}
