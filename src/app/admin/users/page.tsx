"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Settings, Users, ShieldCheck, Ban } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import AdminStatCard from "@/components/admin/AdminStatCard";

interface AdminUser {
  id: string;
  fluxUserId: string;
  email: string | null;
  role: string;
  creditBalance: number;
  monitorSlots: number;
  activeSlots: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

type UserModalTab = "details" | "balance" | "engine" | "danger";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalTab, setModalTab] = useState<UserModalTab>("details");
  const [creditInput, setCreditInput] = useState("");
  const [slotInput, setSlotInput] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const query = params.toString();
      const data = await adminApi.get<{ users: AdminUser[] }>(
        `/users${query ? `?${query}` : ""}`
      );
      setUsers(data.users);
    } catch (err: any) {
      setError(err.message || "Unable to load users");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === "ACTIVE").length;
    const admins = users.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length;
    const suspended = users.filter((u) => u.status === "SUSPENDED").length;
    return { total, active, admins, suspended };
  }, [users]);

  const handleAdjustCredits = async (userId: string, amount: number) => {
    try {
      await adminApi.put(`/users/${userId}`, { creditDelta: amount });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Unable to update credits");
    }
  };

  const handleAdjustSlots = async (userId: string, amount: number) => {
    try {
      await adminApi.put(`/users/${userId}`, { slotDelta: amount });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Unable to update slots");
    }
  };

  const handleStatusChange = async (userId: string, status: string) => {
    try {
      await adminApi.put(`/users/${userId}/status`, { status });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Unable to update status");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Permanently delete this user? This cannot be undone.")) return;
    try {
      await adminApi.del(`/users/${userId}`);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Unable to delete user");
    }
  };

  const statusPillClass = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-700";
      case "PAUSED":
        return "bg-amber-500/20 text-amber-300 border-amber-700";
      case "SUSPENDED":
        return "bg-rose-500/20 text-rose-300 border-rose-700";
      default:
        return "bg-slate-700/20 text-slate-300 border-slate-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-cyan">Directory</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-100">User Management</h1>
        <p className="text-slate-400 mt-2">Search, filter, and manage registered users.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard title="Total Users" metric={stats.total} icon={Users} colorTint="text-slate-100" />
        <AdminStatCard title="Active Users" metric={stats.active} subtitle="currently active" icon={Users} colorTint="text-emerald-400" />
        <AdminStatCard title="Administrators" metric={stats.admins} subtitle="admin / super admin" icon={ShieldCheck} colorTint="text-brand-cyan" />
        <AdminStatCard title="Suspended" metric={stats.suspended} subtitle="suspended accounts" icon={Ban} colorTint="text-rose-400" />
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search by email or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-cyan focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 focus:border-brand-cyan focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-700 bg-rose-900/80 p-4 text-sm text-rose-200">{error}</div>
      )}

      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
          <thead className="bg-slate-900 text-xs uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Credit Balance</th>
              <th className="px-4 py-3">Active Monitors</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Loading users…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No users found.</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-4 text-slate-100">{user.fluxUserId}</td>
                  <td className="px-4 py-4 text-slate-300">{user.email ?? "—"}</td>
                  <td className={`px-4 py-4 font-medium ${user.creditBalance < 0 ? "text-rose-400" : "text-slate-100"}`}>
                    {user.creditBalance.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-slate-100">{user.activeSlots} / {user.monitorSlots}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${statusPillClass(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => { setSelectedUser(user); setModalTab("details"); }}
                      className="rounded-2xl border border-slate-700 p-2 text-slate-300 hover:border-brand-cyan hover:text-brand-cyan"
                      aria-label="User settings"
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

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">{selectedUser.email ?? selectedUser.fluxUserId}</h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-100">✕</button>
            </div>

            <div className="mb-4 flex gap-2 border-b border-slate-800 pb-2">
              {(["details", "balance", "engine", "danger"] as UserModalTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setModalTab(tab)}
                  className={`rounded-2xl px-3 py-1.5 text-xs font-medium capitalize ${
                    modalTab === tab ? "bg-brand-cyan text-slate-950" : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  {tab === "danger" ? "Danger Zone" : tab}
                </button>
              ))}
            </div>

            {modalTab === "details" && (
              <div className="space-y-2 text-sm text-slate-300">
                <p><span className="text-slate-500">ID:</span> {selectedUser.id}</p>
                <p><span className="text-slate-500">Flux ID:</span> {selectedUser.fluxUserId}</p>
                <p><span className="text-slate-500">Role:</span> {selectedUser.role}</p>
                <p><span className="text-slate-500">Created:</span> {new Date(selectedUser.createdAt).toLocaleString()}</p>
                <p><span className="text-slate-500">Updated:</span> {new Date(selectedUser.updatedAt).toLocaleString()}</p>
              </div>
            )}

            {modalTab === "balance" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Credit delta (+/-)"
                    value={creditInput}
                    onChange={(e) => setCreditInput(e.target.value)}
                    className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 focus:border-brand-cyan focus:outline-none"
                  />
                  <button
                    onClick={() => { handleAdjustCredits(selectedUser.id, Number(creditInput)); setCreditInput(""); }}
                    className="rounded-2xl bg-brand-cyan px-4 py-2 text-xs font-semibold text-slate-950"
                  >
                    Apply Credits
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Slot delta (+/-)"
                    value={slotInput}
                    onChange={(e) => setSlotInput(e.target.value)}
                    className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 focus:border-brand-cyan focus:outline-none"
                  />
                  <button
                    onClick={() => { handleAdjustSlots(selectedUser.id, Number(slotInput)); setSlotInput(""); }}
                    className="rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950"
                  >
                    Apply Slots
                  </button>
                </div>
              </div>
            )}

            {modalTab === "engine" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-400">Toggle user status:</p>
                <div className="flex gap-2">
                  {(["ACTIVE", "PAUSED", "SUSPENDED"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(selectedUser.id, status)}
                      className={`rounded-2xl px-4 py-2 text-xs font-medium ${
                        selectedUser.status === status
                          ? "bg-brand-cyan text-slate-950"
                          : "border border-slate-700 text-slate-300 hover:border-brand-cyan"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {modalTab === "danger" && (
              <div className="space-y-3">
                <p className="text-sm text-rose-300">Permanently delete this user and all associated data.</p>
                <button
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  className="rounded-2xl bg-rose-500 px-4 py-2 text-xs font-semibold text-slate-950"
                >
                  Delete User
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
