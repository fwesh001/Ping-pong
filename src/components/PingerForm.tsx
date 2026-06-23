"use client";

import React, { useState, useMemo } from "react";
import { DollarSign, Timer, AlertTriangle, Info, Crosshair, CalendarDays } from "lucide-react";
import SchedulingTabs, { type ThreeModeFormState } from "@/components/ui/SchedulingTabs";

const HOURLY_DRAIN = 0.8333;
const ONE_OFF_FLAT_COST = 25.0;
const MIN_INTERVAL_SECS = 60;

interface PingerFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  activeMonitorCount?: number;
  maxMonitors?: number;
}

const defaultThreeMode: ThreeModeFormState = {
  scheduleMode: "RECURRING",
  pingIntervalSecs: 60,
  activeDays: [],
  scheduledTime: "09:00",
  executeDate: "",
  oneOffTime: "09:00",
  timeoutMs: 10000,
  maxRetries: 0,
};

export default function PingerForm({
  onSubmit,
  onCancel,
  activeMonitorCount = 0,
  maxMonitors = 5,
}: PingerFormProps) {
  // Core fields (cached across mode switches)
  const [serviceName, setServiceName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");

  // 3-Mode scheduling state
  const [schedule, setSchedule] = useState<ThreeModeFormState>(defaultThreeMode);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cost calculations
  const costPerPing = useMemo(() => {
    if (schedule.scheduleMode === "ONEOFF") return ONE_OFF_FLAT_COST;
    return (HOURLY_DRAIN * schedule.pingIntervalSecs) / 3600;
  }, [schedule.scheduleMode, schedule.pingIntervalSecs]);

  const pingsPerDay = useMemo(() => {
    if (schedule.scheduleMode === "ONEOFF") return 1;
    return (24 * 3600) / schedule.pingIntervalSecs;
  }, [schedule.scheduleMode, schedule.pingIntervalSecs]);

  const dailyCost = useMemo(() => {
    if (schedule.scheduleMode === "ONEOFF") return ONE_OFF_FLAT_COST;
    return costPerPing * pingsPerDay;
  }, [costPerPing, pingsPerDay, schedule.scheduleMode]);

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
    if (schedule.scheduleMode === "RECURRING") {
      if (schedule.pingIntervalSecs < MIN_INTERVAL_SECS) {
        newErrors.interval = `Minimum interval is ${MIN_INTERVAL_SECS} seconds`;
      }
      if (schedule.pingIntervalSecs > 3600) {
        newErrors.interval = "Maximum interval is 3600 seconds (1 hour)";
      }
    }
    if (schedule.scheduleMode === "SCHEDULED" && schedule.activeDays.length === 0) {
      newErrors.activeDays = "Select at least one day";
    }
    if (schedule.scheduleMode === "ONEOFF" && !schedule.executeDate) {
      newErrors.executeDate = "Execution date is required for one-off monitors";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const body: Record<string, any> = {
      serviceName: serviceName.trim(),
      targetUrl: targetUrl.trim(),
      scheduleMode: schedule.scheduleMode,
      timeoutMs: schedule.timeoutMs,
      maxRetries: schedule.maxRetries,
    };

    if (schedule.scheduleMode === "RECURRING") {
      body.pingIntervalSecs = schedule.pingIntervalSecs;
    } else if (schedule.scheduleMode === "SCHEDULED") {
      body.activeDays = schedule.activeDays.join(",");
      body.executeTime = schedule.scheduledTime;
    } else if (schedule.scheduleMode === "ONEOFF") {
      body.executeDate = schedule.executeDate ? new Date(schedule.executeDate).toISOString() : null;
      body.executeTime = schedule.oneOffTime;
    }

    onSubmit(body);
  };

  const atMaxMonitors = activeMonitorCount >= maxMonitors;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {atMaxMonitors && (
        <div className="bg-slate-800 border border-amber-700 rounded-lg p-4 text-sm text-amber-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          Maximum of {maxMonitors} active monitors reached. Pause or delete one to add more.
        </div>
      )}

      {/* 1. Service Name */}
      <div>
        <label htmlFor="serviceName" className="block text-sm font-medium text-slate-100 mb-1">
          Service Name
        </label>
        <input
          id="serviceName" type="text" value={serviceName}
          onChange={(e) => { setServiceName(e.target.value); setErrors((p) => { const n = { ...p }; delete n.serviceName; return n; }); }}
          placeholder="e.g., API Server"
          className={`input-field ${errors.serviceName ? "border-red-500" : ""}`}
          disabled={atMaxMonitors}
        />
        {errors.serviceName && <p className="text-rose-400 text-sm mt-1">{errors.serviceName}</p>}
      </div>

      {/* 2. Target URL */}
      <div>
        <label htmlFor="targetUrl" className="block text-sm font-medium text-slate-100 mb-1">
          Target URL
        </label>
        <input
          id="targetUrl" type="text" value={targetUrl}
          onChange={(e) => { setTargetUrl(e.target.value); setErrors((p) => { const n = { ...p }; delete n.targetUrl; return n; }); }}
          placeholder="https://api.example.com/health"
          className={`input-field ${errors.targetUrl ? "border-red-500" : ""}`}
          disabled={atMaxMonitors}
        />
        {errors.targetUrl && <p className="text-rose-400 text-sm mt-1">{errors.targetUrl}</p>}
      </div>

      {/* 3. 3-Mode Scheduling */}
      <div className="border-t border-slate-700 pt-5">
        <h3 className="text-sm font-medium font-poppins text-slate-100 mb-1">Schedule Mode</h3>
        <p className="text-xs text-slate-400 mb-4">Choose how this monitor should run</p>
        <SchedulingTabs value={schedule} onChange={setSchedule} />
        {errors.interval && <p className="text-red-600 text-xs mt-1">{errors.interval}</p>}
        {errors.activeDays && <p className="text-red-600 text-xs mt-1">{errors.activeDays}</p>}
        {errors.executeDate && <p className="text-red-600 text-xs mt-1">{errors.executeDate}</p>}
      </div>

      {/* Cost Breakdown */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold font-poppins text-slate-100 mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-slate-100" /> Cost Breakdown
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
          <div>
            <p className="text-slate-300 flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> {schedule.scheduleMode === "ONEOFF" ? "Total cost" : "Cost per ping"}
            </p>
            <p className="font-bold text-slate-100">{costPerPing.toFixed(5)} credits</p>
          </div>
          <div>
            <p className="text-slate-300 flex items-center gap-1">
              {schedule.scheduleMode === "ONEOFF" ? <Crosshair className="w-3 h-3" /> : <Timer className="w-3 h-3" />}
              {" "}{schedule.scheduleMode === "ONEOFF" ? "Type" : "Pings/day"}
            </p>
            <p className="font-bold text-slate-100">
              {schedule.scheduleMode === "ONEOFF" ? "One-off (25cr)" : pingsPerDay.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-slate-300 flex items-center gap-1">
              {schedule.scheduleMode === "ONEOFF" ? <Crosshair className="w-3 h-3" /> : <Timer className="w-3 h-3" />}
              {" "}{schedule.scheduleMode === "ONEOFF" ? "Flat fee" : "Daily cost"}
            </p>
            <p className="font-bold text-slate-100">
              {schedule.scheduleMode === "ONEOFF" ? "25.0000 cr" : `${dailyCost.toFixed(4)} cr/day`}
            </p>
          </div>
          <div>
            <p className="text-slate-300 flex items-center gap-1"><Timer className="w-3 h-3" /> 100cr lasts</p>
            <p className="font-bold text-slate-100">{daysUntilEmpty === Infinity ? "∞" : `~${daysUntilEmpty.toFixed(1)} days`}</p>
          </div>
        </div>
        {schedule.scheduleMode === "RECURRING" && (
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
            <Info className="w-3 h-3" /> Formula: (0.8333 × {schedule.pingIntervalSecs}s) ÷ 3600s = {costPerPing.toFixed(5)} credits/ping
          </p>
        )}
        {schedule.scheduleMode === "ONEOFF" && (
          <p className="text-xs text-brand-purple mt-3 flex items-center gap-1">
            <Crosshair className="w-3 h-3" /> One-off: flat 25 credit charge, runs once then auto-completes
          </p>
        )}
        {schedule.scheduleMode === "SCHEDULED" && (
          <p className="text-xs text-emerald-400 mt-3 flex items-center gap-1">
            <CalendarDays className="w-3 h-3" /> Scheduled: pings on selected days at the specified time
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
