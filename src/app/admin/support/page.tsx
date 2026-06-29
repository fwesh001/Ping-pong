"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Settings, Bug, MessageCircle, LifeBuoy, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import AdminStatCard from "@/components/admin/AdminStatCard";

interface SupportTicket {
  id: string;
  type: string;
  status: string;
  text: string;
  browserInfo: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string | null;
    fluxUserId: string;
  };
}

const STATUS_OPTIONS = ["NEW", "UNDER_REVIEW", "IN_PROGRESS", "RESOLVED"];
const TYPE_OPTIONS = ["BUG", "SUGGESTION"];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      const query = params.toString();
      const data = await adminApi.get<{ tickets: SupportTicket[] }>(
        `/tickets${query ? `?${query}` : ""}`
      );
      setTickets(data.tickets);
    } catch (err: any) {
      setError(err.message || "Unable to load support tickets");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const bugs = tickets.filter((t) => t.type === "BUG").length;
    const resolved = tickets.filter((t) => t.status === "RESOLVED").length;
    const unresolved = total - resolved;
    return { total, bugs, resolved, unresolved };
  }, [tickets]);

  const handleStatusUpdate = async (ticketId: string, status: string) => {
    setUpdating(true);
    try {
      await adminApi.put(`/tickets/${ticketId}`, { status });
      fetchTickets();
    } catch (err: any) {
      setError(err.message || "Unable to update ticket status");
    } finally {
      setUpdating(false);
    }
  };

  const handleSendReply = async (ticket: SupportTicket) => {
    if (!replyText.trim()) return;
    setUpdating(true);
    try {
      await adminApi.put(`/tickets/${ticket.id}`, { reply: replyText });
      setReplyText("");
      fetchTickets();
    } catch (err: any) {
      setError(err.message || "Unable to send reply");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTicket = async (ticket: SupportTicket) => {
    if (!confirm(`Permanently delete this ${ticket.type.toLowerCase()} ticket? This cannot be undone.`)) return;
    try {
      await adminApi.del(`/tickets/${ticket.id}`);
      setSelectedTicket(null);
      fetchTickets();
    } catch (err: any) {
      setError(err.message || "Unable to delete ticket");
    }
  };

  const statusPillClass = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-brand-cyan/20 text-brand-cyan border-brand-cyan/50";
      case "UNDER_REVIEW":
        return "bg-amber-500/20 text-amber-300 border-amber-700";
      case "IN_PROGRESS":
        return "bg-purple-500/20 text-purple-300 border-purple-700";
      case "RESOLVED":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-700";
      default:
        return "bg-slate-700/20 text-slate-300 border-slate-600";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-cyan">Helpdesk</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-100">Support &amp; Ticket Center</h1>
        <p className="text-slate-400 mt-2">Review bug reports and suggestions, update status, and send replies directly to users.</p>
      </div>

      {/* Analytics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          title="Total Feedback"
          metric={stats.total}
          subtitle="tickets received"
          icon={LifeBuoy}
          colorTint="text-slate-100"
        />
        <AdminStatCard
          title="Total Bugs"
          metric={stats.bugs}
          subtitle="bug reports"
          icon={Bug}
          colorTint="text-rose-400"
        />
        <AdminStatCard
          title="Total Resolved"
          metric={stats.resolved}
          subtitle="closed tickets"
          icon={CheckCircle2}
          colorTint="text-emerald-400"
        />
        <AdminStatCard
          title="Total Unresolved"
          metric={stats.unresolved}
          subtitle="requiring attention"
          icon={AlertCircle}
          colorTint="text-amber-400"
        />
      </div>

      {/* Command Bar */}
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search by email or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-cyan focus:outline-none"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 focus:border-brand-cyan focus:outline-none"
        >
          <option value="ALL">All Types</option>
          {TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 focus:border-brand-cyan focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-700 bg-rose-900/80 p-4 text-sm text-rose-200">{error}</div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
          <thead className="bg-slate-900 text-xs uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">User Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date Submitted</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Loading tickets…</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No tickets found.</td></tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                      ticket.type === "BUG"
                        ? "bg-rose-500/20 text-rose-300 border-rose-700"
                        : "bg-amber-500/20 text-amber-300 border-amber-700"
                    }`}>
                      {ticket.type === "BUG" ? <Bug className="w-3 h-3" /> : <MessageCircle className="w-3 h-3" />}
                      {ticket.type}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-100">{ticket.user?.email ?? ticket.user?.fluxUserId ?? "—"}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${statusPillClass(ticket.status)}`}>
                      {ticket.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => { setSelectedTicket(ticket); setReplyText(""); }}
                      className="rounded-2xl border border-slate-700 p-2 text-slate-300 hover:border-brand-cyan hover:text-brand-cyan"
                      aria-label="Ticket settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Support Workspace Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">Ticket Workspace</h3>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-100">✕</button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Diagnostic Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-400">Diagnostic Info</h4>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs text-slate-500">Ticket ID</p>
                  <p className="text-sm text-slate-100 font-mono">{selectedTicket.id}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs text-slate-500">Submitted By</p>
                  <p className="text-sm text-slate-100">{selectedTicket.user?.email ?? selectedTicket.user?.fluxUserId ?? "—"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs text-slate-500">Browser Info</p>
                  <p className="mt-1 text-xs text-slate-300 break-all">{selectedTicket.browserInfo ?? "Not provided"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs text-slate-500">Ticket Content</p>
                  <p className="mt-1 text-sm text-slate-100 whitespace-pre-wrap">{selectedTicket.text}</p>
                </div>
              </div>

              {/* Workflow Actions */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-400">Workflow Actions</h4>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs text-slate-500 mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        disabled={updating}
                        onClick={() => handleStatusUpdate(selectedTicket.id, status)}
                        className={`rounded-2xl px-3 py-1.5 text-xs font-medium ${
                          selectedTicket.status === status
                            ? "bg-brand-cyan text-slate-950"
                            : "border border-slate-700 text-slate-300 hover:border-brand-cyan"
                        }`}
                      >
                        {status.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs text-slate-500 mb-2">Direct Response</p>
                  <textarea
                    rows={4}
                    placeholder="Write a reply to this user..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-cyan focus:outline-none resize-none"
                  />
                  <button
                    disabled={updating || !replyText.trim()}
                    onClick={() => handleSendReply(selectedTicket)}
                    className="mt-2 rounded-2xl bg-brand-cyan px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-brand-cyan/90 disabled:opacity-50"
                  >
                    Send Reply
                  </button>
                </div>

                {/* Danger Zone */}
                <div className="rounded-2xl border border-rose-800 bg-rose-950/50 p-4">
                  <p className="text-xs font-medium text-rose-300 mb-2">Danger Zone</p>
                  <button
                    onClick={() => handleDeleteTicket(selectedTicket)}
                    className="rounded-2xl bg-rose-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-rose-500/90"
                  >
                    Delete / Purge Ticket
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
