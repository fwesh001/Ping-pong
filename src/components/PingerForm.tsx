"use client";

import React, { useState } from "react";

interface PingerFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function PingerForm({ onSubmit, onCancel }: PingerFormProps) {
  const [formData, setFormData] = useState({
    serviceName: "",
    targetUrl: "",
    pingInterval: 60,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
      [name]:
        name === "pingInterval" ? parseInt(value, 10) : value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      setFormData({
        serviceName: "",
        targetUrl: "",
        pingInterval: 60,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          Ping Interval (seconds)
        </label>
        <select
          id="pingInterval"
          name="pingInterval"
          value={formData.pingInterval}
          onChange={handleChange}
          className={`input-field ${
            errors.pingInterval ? "border-red-500 focus:border-red-500" : ""
          }`}
        >
          <option value={30}>Every 30 seconds</option>
          <option value={60}>Every 1 minute (default)</option>
          <option value={300}>Every 5 minutes</option>
          <option value={600}>Every 10 minutes</option>
          <option value={1800}>Every 30 minutes</option>
          <option value={3600}>Every 1 hour</option>
        </select>
        {errors.pingInterval && (
          <p className="text-red-600 text-sm mt-1">{errors.pingInterval}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button type="submit" className="btn-primary flex-1">
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
