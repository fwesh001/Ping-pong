"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Bug, MessageCircle, ArrowRight, CheckCircle2 } from "lucide-react";

interface SupportTicket {
  id: string;
  type: string;
  status: string;
  content: string;
  createdAt: string;
  user: {
    email: string | null;
    fluxUserId: string;
  };
}

const statusOptions = ["NEW", "UNDER_REVIEW", "IN_PROGRESS", "RESOLVED"];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeType, setActiveType] = useState("BUG");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [replyById, setReplyById] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("type", activeType);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/support?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch tickets");
      const data = await res.json();
      setTickets(data.tickets || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Unable to load support tickets");
    } finally {
      setLoading(false);
    }
  }, [activeType, statusFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleUpdate = async (ticketId: string, status: string, reply?: string) => {
    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, status, reply }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to update ticket");
      }
      setMessage("Ticket updated successfully.");
      setReplyById((prev) => ({ ...prev, [ticketId]: "" }));
      fetchTickets();
    } catch (err: any) {
      setError(err.message || "Unable to save updates");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-cyan">Support & Reports</p>
        <h2 className="mt-3 text-3xl font-bold text-slate-100">Ticket center</h2>
        <p className="text-slate-400 mt-2">Review bug reports and suggestions, update status, and send replies directly to users.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveType("BUG")}
            className={`rounded-2xl px-4 py-2 text-sm ${activeType === "BUG" ? "bg-brand-cyan text-slate-950" : "bg-slate-800 text-slate-300"}`}
          >
            <Bug className="w-4 h-4 inline" /> Bugs
          </button>
          <button
            onClick={() => setActiveType("SUGGESTION")}
            className={`rounded-2xl px-4 py-2 text-sm ${activeType === "SUGGESTION" ? "bg-brand-cyan text-slate-950" : "bg-slate-800 text-slate-300"}`}
          >
            <MessageCircle className="w-4 h-4 inline" /> Suggestions
          </button>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">Filter by status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field bg-slate-800 text-slate-100"
          >
            <option value="">All</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>{option.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      </div>

      {message && <div className="rounded-2xl border border-emerald-700 bg-emerald-900/80 p-4 text-sm text-emerald-200">{message}</div>}
      {error && <div className="rounded-2xl border border-rose-700 bg-rose-900/80 p-4 text-sm text-rose-200">{error}</div>}

      <div className="space-y-4">
        {loading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-400">Loading tickets…</div>
        ) : tickets.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-400">No tickets found for this filter.</div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{ticket.type}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-100">{ticket.content}</p>
                  <p className="mt-2 text-sm text-slate-400">Submitted by {ticket.user.email || ticket.user.fluxUserId}</p>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">{ticket.status.replace(/_/g, " ")}</span>
                  <span className="text-xs text-slate-500">{new Date(ticket.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                <textarea
                  rows={3}
                  placeholder="Write a reply to this user..."
                  value={replyById[ticket.id] || ""}
                  onChange={(e) => setReplyById((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100"
                />
                <button
                  onClick={() => handleUpdate(ticket.id, ticket.status, replyById[ticket.id])}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-cyan px-4 py-3 text-sm font-semibold text-slate-950"
                >
                  <ArrowRight className="w-4 h-4" /> Send Reply
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {statusOptions.map((statusOption) => (
                  <button
                    key={statusOption}
                    onClick={() => handleUpdate(ticket.id, statusOption)}
                    className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 hover:border-brand-cyan"
                  >
                    {statusOption.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
