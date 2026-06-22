"use client";

import React, { useState, useMemo } from "react";
import { DollarSign, Timer, Zap, CalendarClock, Clock, AlertTriangle, Info } from "lucide-react";

const HOURLY_DRAIN = 0.8333;
const ONE_OFF_FLAT_COST = 25.0;
const MIN_INTERVAL_SECS = 60;

interface PingerFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  activeMonitorCount?: number;
  maxMonitors?: number;
}

const INTERVAL_UNITS = [
  { value: "seconds", label: "Seconds", multiplier: 1 },
  { value: "minutes", label: "Minutes", multiplier: 60 },
  { value: "hours", label: "Hours", multiplier: 3600 },
];

export default function PingerForm({
  onSubmit,
  onCancel,
  activeMonitorCount = 0,
  maxMonitors = 5,
}: PingerFormProps) {
  const [serviceName, setServiceName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [intervalValue, setIntervalValue] = useState(60);
  const [intervalUnit, setIntervalUnit] = useState("seconds");
  const [timeoutMs, setTimeoutMs] = useState(10000);
  const [isScheduled, setIsScheduled] = useState(false);
  const [isOneOff, setIsOneOff] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Compute interval in seconds from value + unit
  const intervalSecs = useMemo(() => {
    const unit = INTERVAL_UNITS.find((u) => u.value === intervalUnit);
    return intervalValue * (unit?.multiplier || 1);
  }, [intervalValue, intervalUnit]);

  // Cost calculations
  const costPerPing = useMemo(() => {
    if (isOneOff) return ONE_OFF_FLAT_COST;
    return (HOURLY_DRAIN * intervalSecs) / 3600;
  }, [intervalSecs, isOneOff]);

  const pingsPerDay = useMemo(() => {
    if (isOneOff) return 1;
    return (24 * 3600) / intervalSecs;
  }, [intervalSecs, isOneOff]);

  const dailyCost = useMemo(() => {
    if (isOneOff) return ONE_OFF_FLAT_COST;
    return costPerPing * pingsPerDay;
  }, [costPerPing, pingsPerDay, isOneOff]);

  const daysUntilEmpty = useMemo(() => {
    return dailyCost > 0 ? 100 / dailyCost : Infinity;
  }, [dailyCost]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!serviceName.trim()) newErrors.serviceName = "Service name is required";
    if (!targetUrl.trim()) {
      newErrors.targetUrl = "Target URL is required";
    } else {
      try { new URL(targetUrl); } catch { newErrors.targetUrl = "Invalid URL format"; }
    }
    if (intervalSecs < MIN_INTERVAL_SECS) {
      newErrors.interval = `Minimum interval is ${MIN_INTERVAL_SECS} seconds`;
    }
    if (intervalSecs > 3600) {
      newErrors.interval = "Maximum interval is 3600 seconds (1 hour)";
    }
    if (isScheduled && !startsAt) {
      newErrors.startsAt = "Start time is required for scheduled monitors";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      serviceName: serviceName.trim(),
      targetUrl: targetUrl.trim(),
      pingInterval: intervalSecs,
      timeoutMs,
      isOneOff: isScheduled && isOneOff,
      startsAt: isScheduled && startsAt ? new Date(startsAt).toISOString() : null,
      endsAt: isScheduled && endsAt ? new Date(endsAt).toISOString() : null,
      costPerPing,
      scheduleType: isScheduled && isOneOff ? "ONCE" : "INTERVAL",
      activeDays: "",
      executeTime: "",
    });
  };

  const atMaxMonitors = activeMonitorCount >= maxMonitors;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {atMaxMonitors && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Maximum of {maxMonitors} active monitors reached. Pause or delete one to add more.
        </div>
      )}

      {/* Service Name */}
      <div>
        <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700 mb-1">
          Service Name
        </label>
        <input
          id="serviceName" type="text" value={serviceName}
          onChange={(e) => { setServiceName(e.target.value); setErrors((p) => { const n = { ...p }; delete n.serviceName; return n; }); }}
          placeholder="e.g., API Server"
          className={`input-field ${errors.serviceName ? "border-red-500" : ""}`}
          disabled={atMaxMonitors}
        />
        {errors.serviceName && <p className="text-red-600 text-sm mt-1">{errors.serviceName}</p>}
      </div>

      {/* Target URL */}
      <div>
        <label htmlFor="targetUrl" className="block text-sm font-medium text-gray-700 mb-1">
          Target URL
        </label>
        <input
          id="targetUrl" type="text" value={targetUrl}
          onChange={(e) => { setTargetUrl(e.target.value); setErrors((p) => { const n = { ...p }; delete n.targetUrl; return n; }); }}
          placeholder="https://api.example.com/health"
          className={`input-field ${errors.targetUrl ? "border-red-500" : ""}`}
          disabled={atMaxMonitors}
        />
        {errors.targetUrl && <p className="text-red-600 text-sm mt-1">{errors.targetUrl}</p>}
      </div>

      {/* Interval: numeric input + unit selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ping Interval</label>
        <div className="flex gap-2">
          <input
            type="number" value={intervalValue}
            onChange={(e) => { setIntervalValue(Number(e.target.value)); setErrors((p) => { const n = { ...p }; delete n.interval; return n; }); }}
            min={1} max={3600}
            className={`input-field w-32 ${errors.interval ? "border-red-500" : ""}`}
            disabled={atMaxMonitors}
          />
          <select
            value={intervalUnit}
            onChange={(e) => { setIntervalUnit(e.target.value); setErrors((p) => { const n = { ...p }; delete n.interval; return n; }); }}
            className="input-field w-36"
            disabled={atMaxMonitors}
          >
            {INTERVAL_UNITS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>
        {errors.interval && <p className="text-red-600 text-sm mt-1">{errors.interval}</p>}
        <p className="text-xs text-gray-500 mt-1">
          = {intervalSecs} seconds {intervalSecs < MIN_INTERVAL_SECS ? `(minimum ${MIN_INTERVAL_SECS}s)` : ""}
        </p>
      </div>

      {/* Timeout */}
      <div>
        <label htmlFor="timeoutMs" className="block text-sm font-medium text-gray-700 mb-1">
          Timeout (ms)
        </label>
        <input
          id="timeoutMs" type="number" value={timeoutMs}
          onChange={(e) => setTimeoutMs(Number(e.target.value))}
          min={1000} max={60000} step={500}
          className="input-field w-40"
          disabled={atMaxMonitors}
        />
      </div>

      {/* Scheduling Toggle */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Scheduling</h3>
            <p className="text-xs text-gray-500">Set a time window for this monitor</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} className="sr-only peer" disabled={atMaxMonitors} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {isScheduled && (
          <div className="space-y-4 bg-gray-50 rounded-lg p-4">
            {/* One-off vs Repeat */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="scheduleType" checked={!isOneOff} onChange={() => setIsOneOff(false)} className="text-blue-600" />
                <span className="text-sm text-gray-700 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Repeat on interval</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="scheduleType" checked={isOneOff} onChange={() => setIsOneOff(true)} className="text-purple-600" />
                <span className="text-sm text-gray-700 flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Run once (25 credits)</span>
              </label>
            </div>

            {/* Date/Time pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start At</label>
                <input
                  type="datetime-local" value={startsAt}
                  onChange={(e) => { setStartsAt(e.target.value); setErrors((p) => { const n = { ...p }; delete n.startsAt; return n; }); }}
                  className={`input-field text-sm ${errors.startsAt ? "border-red-500" : ""}`}
                />
                {errors.startsAt && <p className="text-red-600 text-xs mt-1">{errors.startsAt}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End At (optional)</label>
                <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="input-field text-sm" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cost Breakdown */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> Cost Breakdown
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-blue-700 flex items-center gap-1"><DollarSign className="w-3 h-3" /> {isOneOff ? "Total cost" : "Cost per ping"}</p>
            <p className="font-bold text-blue-900">{costPerPing.toFixed(5)} credits</p>
          </div>
          <div>
            <p className="text-blue-700 flex items-center gap-1">{isOneOff ? <Zap className="w-3 h-3" /> : <Timer className="w-3 h-3" />} {isOneOff ? "Type" : "Pings/day"}</p>
            <p className="font-bold text-blue-900">{isOneOff ? "One-off (25cr)" : pingsPerDay.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-blue-700 flex items-center gap-1"><CalendarClock className="w-3 h-3" /> {isOneOff ? "Flat fee" : "Daily cost"}</p>
            <p className="font-bold text-blue-900">{isOneOff ? "25.0000 cr" : `${dailyCost.toFixed(4)} cr/day`}</p>
          </div>
          <div>
            <p className="text-blue-700 flex items-center gap-1"><Clock className="w-3 h-3" /> 100cr lasts</p>
            <p className="font-bold text-blue-900">{daysUntilEmpty === Infinity ? "∞" : `~${daysUntilEmpty.toFixed(1)} days`}</p>
          </div>
        </div>
        {!isOneOff && (
          <p className="text-xs text-blue-600 mt-3 flex items-center gap-1">
            <Info className="w-3 h-3" /> Formula: (0.8333 × {intervalSecs}s) ÷ 3600s = {costPerPing.toFixed(5)} credits/ping
          </p>
        )}
        {isOneOff && (
          <p className="text-xs text-purple-600 mt-3 flex items-center gap-1">
            <Zap className="w-3 h-3" /> One-off: flat 25 credit charge, runs once then auto-completes
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button type="submit" className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed" disabled={atMaxMonitors}>
          Create Monitor
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
      </div>
    </form>
  );
}
