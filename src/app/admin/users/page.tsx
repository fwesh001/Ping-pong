"use client";

import React, { useCallback, useEffect, useState } from "react";

interface AdminUser {
  id: string;
  fluxUserId: string;
  email: string | null;
  role: string;
  creditBalance: number;
  monitorSlots: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || "Unable to load admin users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const adjustCredits = async (userId: string, amount: number) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, creditDelta: amount }),
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error || "Failed to update credits");
      }
      setMessage(`Updated credits for user successfully.`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Unable to update credits");
    }
  };

  const adjustSlots = async (userId: string, amount: number) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, slotDelta: amount }),
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error || "Failed to update slots");
      }
      setMessage("Updated monitor slots successfully.");
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Unable to update slots");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-cyan">Users</p>
        <h2 className="mt-3 text-3xl font-bold text-slate-100">Manage user accounts</h2>
        <p className="text-slate-400 mt-2">Review account roles, balances, and slot allocations.</p>
      </div>

      {message && <div className="rounded-3xl border border-emerald-700 bg-emerald-900/80 p-4 text-sm text-emerald-200">{message}</div>}
      {error && <div className="rounded-3xl border border-rose-700 bg-rose-900/80 p-4 text-sm text-rose-200">{error}</div>}

      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
          <thead className="bg-slate-900 text-xs uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3">Slots</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">Loading users…</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">No users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-4 text-slate-100">{user.email || user.fluxUserId}</td>
                  <td className="px-4 py-4 text-slate-300">{user.role}</td>
                  <td className="px-4 py-4 text-slate-100">{user.creditBalance.toFixed(2)}</td>
                  <td className="px-4 py-4 text-slate-100">{user.monitorSlots}</td>
                  <td className="px-4 py-4 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => adjustCredits(user.id, 50)}
                        className="rounded-2xl bg-brand-cyan px-3 py-2 text-xs font-semibold text-slate-950"
                      >
                        +50 credits
                      </button>
                      <button
                        onClick={() => adjustCredits(user.id, -50)}
                        className="rounded-2xl bg-slate-800 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700"
                      >
                        -50 credits
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => adjustSlots(user.id, 1)}
                        className="rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950"
                      >
                        + Slot
                      </button>
                      <button
                        onClick={() => adjustSlots(user.id, -1)}
                        className="rounded-2xl bg-slate-800 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700"
                      >
                        - Slot
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
