"use client";

import React, { useState, useMemo } from "react";

const HOURLY_DRAIN = 0.8333;

interface PingerFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  activeMonitorCount?: number;
  maxMonitors?: number;
}

const INTERVAL_OPTIONS = [
  { value: 30, label: "Every 30 seconds" },
  { value: 60, label: "Every 1 minute" },
  { value: 300, label: "Every 5 minutes" },
  { value: 600, label: "Every 10 minutes" },
  { value: 1800, label: "Every 30 minutes" },
  { value: 3600, label: "Every 1 hour" },
];

export default function PingerForm({
  onSubmit,
  onCancel,
  activeMonitorCount = 0,
  maxMonitors = 5,
}: PingerFormProps) {
  const [formData, setFormData] = useState({
    serviceName: "",
    targetUrl: "",
    pingInterval: 60,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate dynamic cost for the selected interval
  const costPerPing = useMemo(() => {
    return (HOURLY_DRAIN * formData.pingInterval) / 3600;
  }, [formData.pingInterval]);

  const pingsPerDay = useMemo(() => {
    return (24 * 3600) / formData.pingInterval;
  }, [formData.pingInterval]);

  const dailyCost = useMemo(() => {
    return costPerPing * pingsPerDay;
  }, [costPerPing, pingsPerDay]);

  const daysUntilEmpty = useMemo(() => {
    return dailyCost > 0 ? 100 / dailyCost : Infinity;
  }, [dailyCost]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.serviceName.trim()) {
      newErrors.serviceName = "Service name is required";
    }
    if (!formData.targetUrl.trim()) {
      newErrors.targetUrl = "Target URL is required";
    } else {
      try {
        new URL(formData.targetUrl);
      } catch {
        newErrors.targetUrl = "Invalid URL format";
      }
    }
    if (formData.pingInterval < 30 || formData.pingInterval > 3600) {
      newErrors.pingInterval =
        "Ping interval must be between 30 and 3600 seconds";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "pingInterval" ? parseInt(value, 10) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        costPerPing,
      });
      setFormData({ serviceName: "", targetUrl: "", pingInterval: 60 });
    }
  };

  const atMaxMonitors = activeMonitorCount >= maxMonitors;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Max monitors warning */}
      {atMaxMonitors && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          ⚠️ You have reached the maximum of {maxMonitors} active monitors.
          Pause or delete an existing one to add more.
        </div>
      )}

      {/* Service Name */}
      <div>
        <label
          htmlFor="serviceName"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Service Name
        </label>
        <input
          id="serviceName"
          type="text"
          name="serviceName"
          value={formData.serviceName}
          onChange={handleChange}
          placeholder="e.g., API Server"
          className={`input-field ${
            errors.serviceName ? "border-red-500 focus:border-red-500" : ""
          }`}
          disabled={atMaxMonitors}
        />
        {errors.serviceName && (
          <p className="text-red-600 text-sm mt-1">{errors.serviceName}</p>
        )}
      </div>

      {/* Target URL */}
      <div>
        <label
          htmlFor="targetUrl"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Target URL
        </label>
        <input
          id="targetUrl"
          type="text"
          name="targetUrl"
          value={formData.targetUrl}
          onChange={handleChange}
          placeholder="e.g., https://api.example.com/health"
          className={`input-field ${
            errors.targetUrl ? "border-red-500 focus:border-red-500" : ""
          }`}
          disabled={atMaxMonitors}
        />
        {errors.targetUrl && (
          <p className="text-red-600 text-sm mt-1">{errors.targetUrl}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Enter a valid URL starting with http:// or https://
        </p>
      </div>

      {/* Ping Interval */}
      <div>
        <label
          htmlFor="pingInterval"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Ping Interval
        </label>
        <select
          id="pingInterval"
          name="pingInterval"
          value={formData.pingInterval}
          onChange={handleChange}
          className={`input-field ${
            errors.pingInterval ? "border-red-500 focus:border-red-500" : ""
          }`}
          disabled={atMaxMonitors}
        >
          {INTERVAL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.pingInterval && (
          <p className="text-red-600 text-sm mt-1">{errors.pingInterval}</p>
        )}
      </div>

      {/* Dynamic Cost Breakdown */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-3">
          💰 Cost Breakdown
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-blue-700">Cost per ping</p>
            <p className="font-bold text-blue-900">
              {costPerPing.toFixed(5)} credits
            </p>
          </div>
          <div>
            <p className="text-blue-700">Pings per day</p>
            <p className="font-bold text-blue-900">
              {pingsPerDay.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-blue-700">Daily cost</p>
            <p className="font-bold text-blue-900">
              {dailyCost.toFixed(4)} credits/day
            </p>
          </div>
          <div>
            <p className="text-blue-700">100 credits last</p>
            <p className="font-bold text-blue-900">
              {daysUntilEmpty === Infinity
                ? "∞"
                : `~${daysUntilEmpty.toFixed(1)} days`}
            </p>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-3">
          Formula: (0.8333 × {formData.pingInterval}s) ÷ 3600s ={" "}
          {costPerPing.toFixed(5)} credits/ping
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={atMaxMonitors}
        >
          Create Monitor
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
