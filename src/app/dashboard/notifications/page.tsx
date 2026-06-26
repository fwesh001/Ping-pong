"use client";

import React, { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Bell, DollarSign, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const tabs = [
  { id: "SYSTEM", label: "System" },
  { id: "BILLING", label: "Billing" },
  { id: "ALERT", label: "Alerts" },
  { id: "BROADCAST", label: "Broadcasts" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState("SYSTEM");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditBalance, setCreditBalance] = useState<number>(0);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, noteRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch(`/api/notifications?type=${activeTab}`),
      ]);

      if (!meRes.ok) {
        if (meRes.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to fetch user info");
      }

      const meData = await meRes.json();
      setCreditBalance(meData.user.creditBalance);

      if (!noteRes.ok) throw new Error("Failed to load notifications");
      const noteData = await noteRes.json();
      setNotifications(noteData.notifications || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Unable to fetch notifications");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
      if (!res.ok) throw new Error("Failed to mark notifications as read");
      loadNotifications();
    } catch (err: any) {
      setError(err.message || "Unable to update notifications");
    }
  };

  return (
    <>
      <Navbar creditBalance={creditBalance} />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-brand-cyan">Notifications</p>
                <h1 className="text-3xl font-bold text-slate-100">Notification hub</h1>
                <p className="text-slate-400 mt-2">View your system, billing, and alert messages in one place.</p>
              </div>
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-cyan px-4 py-3 text-sm font-semibold text-slate-950"
              >
                <CheckCircle2 className="w-4 h-4" /> Mark all as read
              </button>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2">
                <DollarSign className="w-4 h-4 text-brand-cyan" /> Balance: {creditBalance.toFixed(2)} credits
              </span>
              <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2">
                <Bell className="w-4 h-4 text-brand-purple" /> {notifications.filter((item) => !item.isRead).length} unread
              </span>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-2xl px-4 py-2 text-sm ${activeTab === tab.id ? "bg-brand-cyan text-slate-950" : "bg-slate-800 text-slate-300"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 text-slate-400">Loading notifications…</div>
            ) : error ? (
              <div className="rounded-3xl border border-rose-700 bg-rose-900/80 p-8 text-rose-200">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 text-slate-400">No notifications in this tab yet.</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-3xl border ${notification.isRead ? "border-slate-800 bg-slate-950" : "border-brand-cyan bg-slate-900"} p-6 shadow-sm`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{notification.type}</p>
                      <p className="mt-3 text-lg font-semibold text-slate-100">{notification.message}</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                      {notification.isRead ? <Sparkles className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />} {notification.isRead ? "Read" : "Unread"}
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
