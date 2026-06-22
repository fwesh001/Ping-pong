"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Pause,
  Play,
  Trash2,
  ExternalLink,
  Timer,
  Zap,
  CalendarClock,
  CheckCheck,
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
  isOneOff: boolean;
  isCompleted: boolean;
  costPerPing: number;
  avgResponseTimeMs: number | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  scheduleType: string;
  activeDays: string;
  executeTime: string;
}

interface MonitorListProps {
  monitors: Monitor[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function PingStatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
    success: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: "bg-green-100 text-green-800", label: "Success" },
    failure: { icon: <XCircle className="w-3.5 h-3.5" />, cls: "bg-red-100 text-red-800", label: "Failure" },
    timeout: { icon: <Clock className="w-3.5 h-3.5" />, cls: "bg-yellow-100 text-yellow-800", label: "Timeout" },
    unknown: { icon: <HelpCircle className="w-3.5 h-3.5" />, cls: "bg-gray-100 text-gray-600", label: "Unknown" },
  };
  const c = config[status] || config.unknown;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.cls}`}>
      {c.icon} {c.label}
    </span>
  );
}

function MonitorStateBadge({ isActive, isOneOff, isCompleted, startsAt }: { isActive: boolean; isOneOff: boolean; isCompleted: boolean; startsAt: string | null }) {
  const isScheduled = startsAt && new Date(startsAt) > new Date();

  if (isCompleted) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <CheckCheck className="w-3.5 h-3.5" /> Completed
      </span>
    );
  }
  if (isScheduled) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        <CalendarClock className="w-3.5 h-3.5" /> Scheduled
      </span>
    );
  }
  if (!isActive) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <Pause className="w-3.5 h-3.5" /> Paused
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      <Play className="w-3.5 h-3.5" /> Active
    </span>
  );
}

export default function MonitorList({ monitors, onToggle, onDelete }: MonitorListProps) {
  return (
    <div className="space-y-4">
      {monitors.map((monitor) => (
        <div key={monitor.id} className="card hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h3 className="text-lg font-semibold text-gray-900">{monitor.serviceName}</h3>
                <PingStatusBadge status={monitor.status} />
                <MonitorStateBadge isActive={monitor.isActive} isOneOff={monitor.isOneOff} isCompleted={monitor.isCompleted} startsAt={monitor.startsAt} />
                {monitor.isOneOff && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                    <Zap className="w-3 h-3" /> One-off
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 truncate mb-3 font-mono">{monitor.targetUrl}</p>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Last Checked</p>
                  <p className="text-sm font-medium text-gray-900">{monitor.lastChecked}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Uptime</p>
                  <p className="text-sm font-medium text-gray-900">{monitor.uptime.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Avg Response</p>
                  <p className="text-sm font-medium text-gray-900">{monitor.avgResponseTimeMs ? `${monitor.avgResponseTimeMs}ms` : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                    <Timer className="w-3 h-3" /> Interval
                  </p>
                  <p className="text-sm font-medium text-gray-900">{monitor.pingInterval}s</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Cost/Ping</p>
                  <p className="text-sm font-medium text-gray-900">{monitor.costPerPing.toFixed(5)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Created</p>
                  <p className="text-sm font-medium text-gray-900">{new Date(monitor.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:flex-col">
              <Link
                href={`/dashboard/monitors/${monitor.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors text-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Details
              </Link>
              <button
                onClick={() => onToggle(monitor.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  monitor.isActive ? "btn-secondary" : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
              >
                {monitor.isActive ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Resume</>}
              </button>
              <button
                onClick={() => onDelete(monitor.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors text-sm"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
