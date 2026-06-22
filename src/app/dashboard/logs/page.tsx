"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp,
  Filter, RotateCcw, AlertTriangle, Search,
} from "lucide-react";

interface LogEntry {
  id: string;
  monitorId: string;
  monitorName: string;
  targetUrl: string;
  status: string;
  statusCode: number | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
  checkedAt: string;
}

interface MonitorOption { id: string; serviceName: string; }

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [monitors, setMonitors] = useState<MonitorOption[]>([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMonitorId, setFilterMonitorId] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const LIMIT = 20;

  const fetchLogs = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    try {
      const params = new URLSearchParams();
      if (filterMonitorId) params.set("monitorId", filterMonitorId);
      if (filterStatus !== "all") params.set("status", filterStatus);
      params.set("limit", String(LIMIT));
      params.set("offset", String(currentOffset));
      const res = await fetch(`/api/logs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      if (reset) { setLogs(data.logs); setOffset(0); }
      else { setLogs((prev) => [...prev, ...data.logs]); }
      setTotal(data.total);
      setHasMore(data.hasMore);
      setError(null);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, [filterMonitorId, filterStatus, offset]);

  const fetchMonitors = useCallback(async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) { window.location.href = "/login"; return; }
      const meData = await meRes.json();
      setCreditBalance(meData.user.creditBalance);
      const monRes = await fetch("/api/monitors");
      if (monRes.ok) { const monData = await monRes.json(); setMonitors(monData.monitors || []); }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchMonitors(); }, [fetchMonitors]);
  useEffect(() => { setLoading(true); fetchLogs(true); }, [filterMonitorId, filterStatus]);
  useEffect(() => { if (offset > 0) fetchLogs(false); }, [offset]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "failure": return <XCircle className="w-4 h-4 text-red-500" />;
      case "timeout": return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      success: "bg-green-100 text-green-800",
      failure: "bg-red-100 text-red-800",
      timeout: "bg-yellow-100 text-yellow-800",
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-600"}`}>
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <>
      <Navbar creditBalance={creditBalance} />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-6">
            <Link href="/dashboard" className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1 mb-2">← Back to Dashboard</Link>
            <h1 className="text-3xl font-bold text-gray-900">Ping Logs</h1>
            <p className="text-gray-500 mt-1">Historical ping results across all your monitors</p>
          </div>

          {/* Filters */}
          <div className="card mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500"><Filter className="w-4 h-4" /> Filters</div>
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select value={filterMonitorId} onChange={(e) => setFilterMonitorId(e.target.value)} className="input-field pl-9 appearance-none">
                    <option value="">All Monitors</option>
                    {monitors.map((m) => (<option key={m.id} value={m.id}>{m.serviceName}</option>))}
                  </select>
                </div>
              </div>
              <div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field">
                  <option value="all">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="failure">Failure</option>
                  <option value="timeout">Timeout</option>
                </select>
              </div>
              <button onClick={() => { setFilterMonitorId(""); setFilterStatus("all"); }} className="btn-secondary text-sm flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>

          {error && (<div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> {error}</div>)}

          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : logs.length === 0 ? (
            <div className="card text-center py-16">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No logs found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or wait for some pings to complete</p>
            </div>
          ) : (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500 w-8"></th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Date & Time</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Monitor</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Target URL</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Code</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <React.Fragment key={log.id}>
                        <tr className="border-b border-gray-100 hover:bg-blue-50/50 cursor-pointer transition-colors" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                          <td className="py-3 px-4">{expandedId === log.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}</td>
                          <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{new Date(log.checkedAt).toLocaleString()}</td>
                          <td className="py-3 px-4"><Link href={`/dashboard/monitors/${log.monitorId}`} className="text-blue-600 hover:underline font-medium" onClick={(e) => e.stopPropagation()}>{log.monitorName}</Link></td>
                          <td className="py-3 px-4 text-gray-500 font-mono text-xs max-w-[200px] truncate">{log.targetUrl}</td>
                          <td className="py-3 px-4">{getStatusBadge(log.status)}</td>
                          <td className="py-3 px-4 text-gray-500 font-mono">{log.statusCode || "—"}</td>
                          <td className="py-3 px-4 text-gray-500">{log.responseTimeMs ? `${log.responseTimeMs}ms` : "—"}</td>
                        </tr>
                        {expandedId === log.id && (
                          <tr className="bg-gray-50">
                            <td colSpan={7} className="px-4 py-4">
                              <div className="max-w-2xl">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Details</h4>
                                {log.errorMessage ? (
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-3"><p className="text-sm text-red-800 font-mono break-all">{log.errorMessage}</p></div>
                                ) : (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-3"><p className="text-sm text-green-800 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> No errors returned — ping completed successfully</p></div>
                                )}
                                <div className="mt-3 grid grid-cols-3 gap-4 text-xs text-gray-500">
                                  <div><span className="font-medium">Log ID:</span> <span className="font-mono">{log.id}</span></div>
                                  <div><span className="font-medium">Monitor ID:</span> <span className="font-mono">{log.monitorId}</span></div>
                                  <div><span className="font-medium">Checked:</span> {new Date(log.checkedAt).toISOString()}</div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              {hasMore && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-center">
                  <button onClick={() => setOffset((p) => p + LIMIT)} className="btn-secondary text-sm flex items-center gap-1.5">
                    <ChevronDown className="w-4 h-4" /> Load More ({total - offset - LIMIT} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
          {!loading && logs.length > 0 && <p className="text-sm text-gray-500 mt-3 text-center">Showing {logs.length} of {total} logs</p>}
        </div>
      </main>
      <Footer />
    </>
  );
}
