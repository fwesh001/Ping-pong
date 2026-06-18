"use client";

import React from "react";

interface Monitor {
  id: string;
  serviceName: string;
  targetUrl: string;
  status: string;
  lastChecked: string;
  uptime: number;
  pingInterval: number;
  isActive: boolean;
}

interface MonitorListProps {
  monitors: Monitor[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function MonitorList({
  monitors,
  onToggle,
  onDelete,
}: MonitorListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failure":
        return "bg-red-100 text-red-800";
      case "timeout":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="space-y-4">
      {monitors.map((monitor) => (
        <div key={monitor.id} className="card hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left: Service Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {monitor.serviceName}
                </h3>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    monitor.status
                  )}`}
                >
                  {getStatusText(monitor.status)}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate mb-3">
                {monitor.targetUrl}
              </p>

              {/* Grid of details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">
                    Last Checked
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {monitor.lastChecked}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">
                    Uptime
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {monitor.uptime.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">
                    Interval
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {monitor.pingInterval}s
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">
                    Status
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {monitor.isActive ? "Active" : "Paused"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:flex-col">
              <button
                onClick={() => onToggle(monitor.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  monitor.isActive
                    ? "btn-secondary"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
              >
                {monitor.isActive ? "Pause" : "Resume"}
              </button>
              <button
                onClick={() => onDelete(monitor.id)}
                className="px-4 py-2 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
