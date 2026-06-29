"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Settings, Bell, Send, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import AdminStatCard from "@/components/admin/AdminStatCard";

interface AdminNotification {
  id: string;
  title: string;
  type: string;
  message: string;
  targetAudience: string;
  readBy: string[];
  createdAt: string;
  userId?: string | null;
}

type ModalMode = "inspector" | "compose" | null;

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);

  // Compose form state
  const [composeTitle, setComposeTitle] = useState("");
  const [composeType, setComposeType] = useState("SYSTEM");
  const [composeAudience, setComposeAudience] = useState("ALL");
  const [composeEmail, setComposeEmail] = useState("");
  const [composeMessage, setComposeMessage] = useState("");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (filterType !== "ALL") params.set("type", filterType);
      const query = params.toString();
      // Graceful fallback: if the backend route doesn't exist yet, swallow the error
      try {
        const data = await adminApi.get<{ notifications: AdminNotification[] }>(
          `/notifications${query ? `?${query}` : ""}`
        );
        setNotifications(data.notifications);
      } catch {
        // Backend route may not be implemented yet; show empty state gracefully
        setNotifications([]);
      }
    } catch (err: any) {
      setError(err.message || "Unable to load notifications");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterType]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const stats = useMemo(() => {
    const total = notifications.length;
    const read = notifications.filter((n) => n.readBy && n.readBy.length > 0).length;
    const unread = total - read;
    return { total, read, unread };
  }, [notifications]);

  const openInspector = (notification: AdminNotification) => {
    setSelectedNotification(notification);
    setModalMode("inspector");
  };

  const openCompose = () => {
    setComposeTitle("");
    setComposeType("SYSTEM");
    setComposeAudience("ALL");
    setComposeEmail("");
    setComposeMessage("");
    setModalMode("compose");
  };

  const handleComposeSubmit = async () => {
    if (!composeTitle || !composeMessage) {
      setError("Title and message are required");
      return;
    }
    try {
      await adminApi.post("/notifications", {
        title: composeTitle,
        type: composeType,
        message: composeMessage,
        targetAudience: composeAudience === "SPECIFIC" ? composeEmail : "ALL",
      });
      setModalMode(null);
      fetchNotifications();
    } catch (err: any) {
      setError(err.message || "Unable to dispatch notification");
    }
  };

  const handleDeleteNotification = async (notification: AdminNotification) => {
    if (!confirm(`Delete notification "${notification.title}"? This cannot be undone.`)) return;
    try {
      await adminApi.del(`/notifications/${notification.id}`);
      if (selectedNotification?.id === notification.id) {
        setSelectedNotification(null);
        setModalMode(null);
      }
      fetchNotifications();
    } catch (err: any) {
      setError(err.message || "Unable to delete notification");
    }
  };

  const typePillClass = (type: string) => {
    switch (type.toUpperCase()) {
      case "SYSTEM":
        return "bg-brand-cyan/20 text-brand-cyan border-brand-cyan/50";
      case "BILLING":
        return "bg-amber-500/20 text-amber-300 border-amber-700";
      case "BROADCAST":
        return "bg-purple-500/20 text-purple-300 border-purple-700";
      case "ALERT":
        return "bg-rose-500/20 text-rose-300 border-rose-700";
      case "WELCOME":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-700";
      default:
        return "bg-slate-700/20 text-slate-300 border-slate-600";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-cyan">Messaging</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-100">Notification Dispatch &amp; Logs</h1>
        <p className="text-slate-400 mt-1">Create and review system notifications targeted to specific audiences.</p>
      </div>

      {/* Analytics Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard
          title="Total Sent"
          metric={stats.total}
          subtitle="notifications dispatched"
          icon={Send}
          colorTint="text-slate-100"
        />
        <AdminStatCard
          title="Total Read"
          metric={stats.read}
          subtitle="by recipients"
          icon={Eye}
          colorTint="text-emerald-400"
        />
        <AdminStatCard
          title="Total Unread"
          metric={stats.unread}
          subtitle="awaiting reads"
          icon={EyeOff}
          colorTint="text-amber-400"
        />
      </div>

      {/* Command Bar */}
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-cyan focus:outline-none"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 focus:border-brand-cyan focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="SYSTEM">System</option>
            <option value="BILLING">Billing</option>
            <option value="BROADCAST">Broadcast</option>
          </select>
        </div>
        <button
          onClick={openCompose}
          className="flex items-center gap-2 rounded-2xl bg-brand-cyan px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-brand-cyan/90"
        >
          <Plus className="w-4 h-4" />
          Compose New Notification
        </button>
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-700 bg-rose-900/80 p-4 text-sm text-rose-200">{error}</div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
          <thead className="bg-slate-900 text-xs uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Recipient(s)</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Loading notifications…</td></tr>
            ) : notifications.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No notifications found.</td></tr>
            ) : (
              notifications.map((notification) => {
                const isRead = notification.readBy && notification.readBy.length > 0;
                return (
                  <tr key={notification.id}>
                    <td className="px-4 py-4 text-slate-100">{notification.title}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${typePillClass(notification.type)}`}>
                        {notification.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{notification.targetAudience}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs ${isRead ? "text-emerald-400" : "text-slate-500"}`}>
                        {isRead ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {isRead ? "Read" : "Unread"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{new Date(notification.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => openInspector(notification)}
                        className="rounded-2xl border border-slate-700 p-2 text-slate-300 hover:border-brand-cyan hover:text-brand-cyan"
                        aria-label="Notification inspector"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Inspector Modal */}
      {modalMode === "inspector" && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">Notification Inspector</h3>
              <button onClick={() => { setModalMode(null); setSelectedNotification(null); }} className="text-slate-400 hover:text-slate-100">✕</button>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <div>
                <span className="text-slate-500">Title:</span>
                <p className="mt-1 text-slate-100">{selectedNotification.title}</p>
              </div>
              <div>
                <span className="text-slate-500">Type:</span>
                <p className="mt-1"><span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${typePillClass(selectedNotification.type)}`}>{selectedNotification.type}</span></p>
              </div>
              <div>
                <span className="text-slate-500">Message:</span>
                <p className="mt-1 rounded-2xl border border-slate-800 bg-slate-900 p-3 text-slate-100 whitespace-pre-wrap">{selectedNotification.message}</p>
              </div>
              <div>
                <span className="text-slate-500">Target Audience:</span>
                <p className="mt-1 text-slate-100">{selectedNotification.targetAudience}</p>
              </div>
              <div>
                <span className="text-slate-500">Dispatched At:</span>
                <p className="mt-1 text-slate-100">{new Date(selectedNotification.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-slate-500">Read By:</span>
                <p className="mt-1 text-slate-100">{selectedNotification.readBy?.length ?? 0} recipient(s)</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => handleDeleteNotification(selectedNotification)}
                className="flex items-center gap-2 rounded-2xl bg-rose-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-rose-500/90"
              >
                <Trash2 className="w-3 h-3" />
                Delete / Recall Notification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {modalMode === "compose" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">Compose New Notification</h3>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-slate-100">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Title</label>
                <input
                  type="text"
                  value={composeTitle}
                  onChange={(e) => setComposeTitle(e.target.value)}
                  placeholder="e.g. Scheduled Maintenance"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-cyan focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Type</label>
                <select
                  value={composeType}
                  onChange={(e) => setComposeType(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 focus:border-brand-cyan focus:outline-none"
                >
                  <option value="SYSTEM">System</option>
                  <option value="BILLING">Billing</option>
                  <option value="BROADCAST">Broadcast</option>
                  <option value="ALERT">Alert</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Target Audience</label>
                <select
                  value={composeAudience}
                  onChange={(e) => setComposeAudience(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 focus:border-brand-cyan focus:outline-none"
                >
                  <option value="ALL">All Users</option>
                  <option value="SPECIFIC">Specific Email</option>
                </select>
              </div>
              {composeAudience === "SPECIFIC" && (
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Recipient Email</label>
                  <input
                    type="email"
                    value={composeEmail}
                    onChange={(e) => setComposeEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-cyan focus:outline-none"
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs text-slate-400">Message Body</label>
                <textarea
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  placeholder="Write your notification message here..."
                  rows={5}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-cyan focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setModalMode(null)}
                className="rounded-2xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:border-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={handleComposeSubmit}
                className="flex items-center gap-2 rounded-2xl bg-brand-cyan px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-brand-cyan/90"
              >
                <Send className="w-3 h-3" />
                Dispatch Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
