"use client";

import React from "react";
import { Clock, Zap } from "lucide-react";

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday", short: "Mon" },
  { key: "tuesday", label: "Tuesday", short: "Tue" },
  { key: "wednesday", label: "Wednesday", short: "Wed" },
  { key: "thursday", label: "Thursday", short: "Thu" },
  { key: "friday", label: "Friday", short: "Fri" },
  { key: "saturday", label: "Saturday", short: "Sat" },
  { key: "sunday", label: "Sunday", short: "Sun" },
];

export interface ScheduleFormState {
  scheduleType: "INTERVAL" | "ONCE";
  activeDays: string[];
  executeTime: string;
}

interface SchedulingTabsProps {
  value: ScheduleFormState;
  onChange: (state: ScheduleFormState) => void;
}

export default function SchedulingTabs({ value, onChange }: SchedulingTabsProps) {
  const isInterval = value.scheduleType === "INTERVAL";

  const toggleDay = (day: string) => {
    const current = value.activeDays;
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    onChange({ ...value, activeDays: next });
  };

  return (
    <div className="space-y-5">
      {/* Tab Switcher */}
      <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
        <button
          type="button"
          onClick={() => onChange({ ...value, scheduleType: "INTERVAL" })}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            isInterval
              ? "bg-white text-blue-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Clock className="w-4 h-4" />
          Repeat on Interval
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...value, scheduleType: "ONCE" })}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            !isInterval
              ? "bg-white text-purple-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Zap className="w-4 h-4" />
          Run Once
        </button>
      </div>

      {/* Interval Mode: Day Grid + Time Picker */}
      {isInterval && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
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
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDay(day.key)}
                      className="sr-only"
                    />
                    <span
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        checked ? "border-blue-500 bg-blue-500" : "border-gray-300"
                      }`}
                    >
                      {checked && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
            <label htmlFor="executeTime" className="block text-sm font-medium text-gray-700 mb-1.5">
              Execution Time
            </label>
            <input
              id="executeTime"
              type="time"
              value={value.executeTime}
              onChange={(e) => onChange({ ...value, executeTime: e.target.value })}
              className="input-field w-48"
            />
            <p className="text-xs text-gray-500 mt-1">Time of day to run pings (HH:MM format)</p>
          </div>
        </div>
      )}

      {/* Once Mode: Info */}
      {!isInterval && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-purple-800 font-semibold text-sm">
            <Zap className="w-4 h-4" />
            One-Time Execution
          </div>
          <p className="text-sm text-purple-700">
            This monitor will execute a single ping and then auto-complete. A flat fee of <strong>25 credits</strong> will be deducted.
          </p>
          <div>
            <label htmlFor="onceExecuteTime" className="block text-sm font-medium text-purple-800 mb-1.5">
              Execution Time
            </label>
            <input
              id="onceExecuteTime"
              type="time"
              value={value.executeTime}
              onChange={(e) => onChange({ ...value, executeTime: e.target.value })}
              className="input-field w-48 border-purple-200 focus:border-purple-500 focus:ring-purple-200"
            />
          </div>
        </div>
      )}
    </div>
  );
}
