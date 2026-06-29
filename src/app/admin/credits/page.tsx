"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Settings, DollarSign, Layers, CreditCard, Plus } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import AdminStatCard from "@/components/admin/AdminStatCard";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  id: string;
  userId: string;
  packageId: string;
  amount: number;
  status: string;
  createdAt: string;
  user: {
    id: string;
    email: string | null;
    fluxUserId: string;
  };
  package: {
    id: string;
    name: string;
    credits: number;
  };
}

type PackageModalMode = "create" | "edit";

export default function AdminCreditsPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [modalMode, setModalMode] = useState<PackageModalMode>("create");

  // Package form state
  const [formName, setFormName] = useState("");
  const [formCredits, setFormCredits] = useState("");
  const [formPrice, setFormPrice] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pkgData, txnData] = await Promise.all([
        adminApi.get<{ packages: CreditPackage[] }>("/packages"),
        adminApi.get<{ transactions: Transaction[] }>("/transactions"),
      ]);
      setPackages(pkgData.packages);
      setTransactions(txnData.transactions);
    } catch (err: any) {
      setError(err.message || "Unable to load billing data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const totalCreditsSold = transactions
      .filter((t) => t.status === "COMPLETED" || t.status === "PENDING")
      .reduce((sum, t) => sum + (t.package?.credits ?? 0), 0);
    const totalSlotsSold = 0;
    const totalRevenue = transactions
      .filter((t) => t.status === "COMPLETED")
      .reduce((sum, t) => sum + t.amount, 0);
    return { totalCreditsSold, totalSlotsSold, totalRevenue };
  }, [transactions]);

  const openCreateModal = () => {
    setModalMode("create");
    setFormName("");
    setFormCredits("");
    setFormPrice("");
    setSelectedPackage(null);
  };

  const openEditModal = (pkg: CreditPackage) => {
    setModalMode("edit");
    setSelectedPackage(pkg);
    setFormName(pkg.name);
    setFormCredits(String(pkg.credits));
    setFormPrice(String(pkg.price));
  };

  const handleSavePackage = async () => {
    if (!formName || !formCredits || !formPrice) {
      setError("All fields are required");
      return;
    }
    try {
      const payload = {
        name: formName,
        credits: Number(formCredits),
        price: Number(formPrice),
      };
      if (modalMode === "edit" && selectedPackage) {
        await adminApi.put(`/packages/${selectedPackage.id}`, payload);
      } else {
        await adminApi.post("/packages", payload);
      }
      setSelectedPackage(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Unable to save package");
    }
  };

  const handleDeletePackage = async (pkg: CreditPackage) => {
    if (!confirm(`Permanently delete package "${pkg.name}"? This cannot be undone.`)) return;
    try {
      await adminApi.del(`/packages/${pkg.id}`);
      if (selectedPackage?.id === pkg.id) setSelectedPackage(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Unable to delete package");
    }
  };

  const statusPillClass = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-700";
      case "PENDING":
        return "bg-amber-500/20 text-amber-300 border-amber-700";
      case "FAILED":
      case "CANCELLED":
        return "bg-rose-500/20 text-rose-300 border-rose-700";
      default:
        return "bg-slate-700/20 text-slate-300 border-slate-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-cyan">Billing</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-100">Billing &amp; Revenue Control</h1>
        <p className="text-slate-400 mt-2">Manage credit packages, pricing, and transaction history.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard
          title="Total Credits Sold"
          metric={stats.totalCreditsSold.toLocaleString()}
          subtitle="across all transactions"
          icon={Layers}
          colorTint="text-brand-cyan"
        />
        <AdminStatCard
          title="Total Slots Sold"
          metric={stats.totalSlotsSold}
          subtitle="monitor slots allocated"
          icon={CreditCard}
          colorTint="text-emerald-400"
        />
        <AdminStatCard
          title="Total Revenue"
          metric={`$${stats.totalRevenue.toFixed(2)}`}
          subtitle="completed transactions"
          icon={DollarSign}
          colorTint="text-amber-400"
        />
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-700 bg-rose-900/80 p-4 text-sm text-rose-200">{error}</div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-100">Commercial Packages Catalog</h2>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-2xl bg-brand-cyan px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-brand-cyan/90"
          >
            <Plus className="w-4 h-4" />
            Add New Package
          </button>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
            <thead className="bg-slate-900 text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Package Name</th>
                <th className="px-4 py-3">Credits</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">Loading packages…</td></tr>
              ) : packages.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No packages found.</td></tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg.id}>
                    <td className="px-4 py-4 text-slate-100">{pkg.name}</td>
                    <td className="px-4 py-4 text-slate-300">{pkg.credits.toLocaleString()}</td>
                    <td className="px-4 py-4 text-slate-100">${pkg.price.toFixed(2)}</td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => openEditModal(pkg)}
                        className="rounded-2xl border border-slate-700 p-2 text-slate-300 hover:border-brand-cyan hover:text-brand-cyan"
                        aria-label="Package settings"
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
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-100">Transaction Ledger</h2>

        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
            <thead className="bg-slate-900 text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">User Account</th>
                <th className="px-4 py-3">Package</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Loading transactions…</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No transactions found.</td></tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn.id}>
                    <td className="px-4 py-4 text-slate-400 font-mono text-xs">{txn.id.slice(0, 8)}…</td>
                    <td className="px-4 py-4 text-slate-100">{txn.user?.email ?? txn.user?.fluxUserId ?? "—"}</td>
                    <td className="px-4 py-4 text-slate-300">{txn.package?.name ?? "—"}</td>
                    <td className="px-4 py-4 text-slate-100">${txn.amount.toFixed(2)}</td>
                    <td className="px-4 py-4 text-slate-300">{new Date(txn.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${statusPillClass(txn.status)}`}>
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(selectedPackage || modalMode === "create") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">
                {modalMode === "edit" ? `Edit: ${selectedPackage?.name}` : "Create New Package"}
              </h3>
              <button onClick={() => setSelectedPackage(null)} className="text-slate-400 hover:text-slate-100">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Package Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Starter Pack"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-cyan focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Credit Volume</label>
                <input
                  type="number"
                  value={formCredits}
                  onChange={(e) => setFormCredits(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-cyan focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Price (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="e.g. 9.99"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-cyan focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                {modalMode === "edit" && selectedPackage && (
                  <button
                    onClick={() => handleDeletePackage(selectedPackage)}
                    className="rounded-2xl bg-rose-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-rose-500/90"
                  >
                    Delete Package
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPackage(null)}
                  className="rounded-2xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:border-slate-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePackage}
                  className="rounded-2xl bg-brand-cyan px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-brand-cyan/90"
                >
                  {modalMode === "edit" ? "Update Package" : "Create Package"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
