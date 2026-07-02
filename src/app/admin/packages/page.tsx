"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Settings, DollarSign, Layers, CreditCard, Plus, Server, Crown } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import AdminStatCard from "@/components/admin/AdminStatCard";

interface CreditPackage {
  id: string;
  name: string;
  type: string;
  credits?: number;
  slots?: number;
  tier?: number;
  features?: any;
  price: number;
  createdAt: string;
  updatedAt: string;
}

type PackageModalMode = "create" | "edit";

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [modalMode, setModalMode] = useState<PackageModalMode | null>(null);

  // form
  const [formType, setFormType] = useState("CREDIT");
  const [formName, setFormName] = useState("");
  const [formCredits, setFormCredits] = useState("");
  const [formSlots, setFormSlots] = useState("");
  const [formTier, setFormTier] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formFeatures, setFormFeatures] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get<{ packages: CreditPackage[] }>("/packages");
      setPackages(res.packages || []);
    } catch (err: any) {
      setError(err.message || "Unable to load packages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const creditPkgs = useMemo(() => packages.filter(p => p.type === "CREDIT"), [packages]);
  const slotPkgs = useMemo(() => packages.filter(p => p.type === "SLOT"), [packages]);
  const premiumPkgs = useMemo(() => packages.filter(p => p.type === "PREMIUM"), [packages]);

  const openCreateModal = () => {
    setModalMode("create");
    setFormType("CREDIT");
    setFormName("");
    setFormCredits("");
    setFormSlots("");
    setFormTier("");
    setFormPrice("");
    setFormFeatures("");
    setSelectedPackage(null);
  };

  const openEditModal = (pkg: CreditPackage) => {
    setModalMode("edit");
    setSelectedPackage(pkg);
    setFormType(pkg.type || "CREDIT");
    setFormName(pkg.name);
    setFormCredits(String(pkg.credits ?? ""));
    setFormSlots(String(pkg.slots ?? ""));
    setFormTier(String(pkg.tier ?? ""));
    setFormPrice(String(pkg.price));
    setFormFeatures(pkg.features ? JSON.stringify(pkg.features) : "");
  };

  const handleSavePackage = async () => {
    if (!formName || !formPrice) { setError("Name and price required"); return; }
    try {
      const payload: any = {
        name: formName,
        price: Number(formPrice),
        type: formType,
      };
      if (formType === "CREDIT") payload.credits = Number(formCredits || 0);
      if (formType === "SLOT") payload.slots = Number(formSlots || 0);
      if (formType === "PREMIUM") {
        payload.credits = Number(formCredits || 0);
        payload.slots = Number(formSlots || 0);
        payload.tier = Number(formTier || 0);
      }
      if (formFeatures) {
        try { payload.features = JSON.parse(formFeatures); } catch { payload.features = { raw: formFeatures }; }
      }
      if (modalMode === "edit" && selectedPackage) {
        await adminApi.put(`/packages/${selectedPackage.id}`, payload);
      } else {
        await adminApi.post(`/packages`, payload);
      }
      setSelectedPackage(null);
      setModalMode(null);
      await fetchData();
    } catch (err: any) { setError(err.message || "Unable to save package"); }
  };

  const handleDeletePackage = async (pkg: CreditPackage) => {
    if (!confirm(`Delete package ${pkg.name}?`)) return;
    try { await adminApi.del(`/packages/${pkg.id}`); fetchData(); } catch (err: any) { setError(err.message || "Unable to delete"); }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-cyan">Billing</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-100">Packages</h1>
        <p className="text-slate-400 mt-1">Manage credit, slot, and premium packages.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard title="Total Packages" metric={String(packages.length)} subtitle="active packages" icon={Layers} colorTint="text-brand-cyan" />
        <AdminStatCard title="Premium Tiers" metric={String(premiumPkgs.length)} subtitle="premium offerings" icon={Crown} colorTint="text-amber-400" />
        <AdminStatCard title="Total Revenue" metric="$0.00" subtitle="(placeholder)" icon={DollarSign} colorTint="text-emerald-400" />
      </div>

      {error && <div className="rounded-3xl border border-rose-700 bg-rose-900/80 p-4 text-sm text-rose-200">{error}</div>}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-100">Commercial Packages Catalog</h2>
        <button onClick={openCreateModal} className="flex items-center gap-2 rounded-2xl bg-brand-cyan px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-brand-cyan/90"><Plus className="w-4 h-4"/>Add New Package</button>
      </div>

      <section className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">Credit Packages</h3>
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
              <thead className="bg-slate-900 text-xs uppercase tracking-[0.2em] text-slate-500"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Credits</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">Loading…</td></tr> : creditPkgs.map(p => (
                  <tr key={p.id}><td className="px-4 py-4">{p.name}</td><td className="px-4 py-4">{p.credits ?? "—"}</td><td className="px-4 py-4">{p.price}</td><td className="px-4 py-4"><button onClick={() => openEditModal(p)} className="p-2"><Settings/></button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">Slot Packages</h3>
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
              <thead className="bg-slate-900 text-xs uppercase tracking-[0.2em] text-slate-500"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Slots</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-800">{slotPkgs.map(p => (<tr key={p.id}><td className="px-4 py-4">{p.name}</td><td className="px-4 py-4">{p.slots ?? "—"}</td><td className="px-4 py-4">{p.price}</td><td className="px-4 py-4"><button onClick={() => openEditModal(p)} className="p-2"><Settings/></button></td></tr>))}</tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">Premium Packages</h3>
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
              <thead className="bg-slate-900 text-xs uppercase tracking-[0.2em] text-slate-500"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Tier</th><th className="px-4 py-3">Slots</th><th className="px-4 py-3">Credits</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-800">{premiumPkgs.map(p => (<tr key={p.id}><td className="px-4 py-4">{p.name}</td><td className="px-4 py-4">{p.tier ?? "—"}</td><td className="px-4 py-4">{p.slots ?? "—"}</td><td className="px-4 py-4">{p.credits ?? "—"}</td><td className="px-4 py-4">{p.price}</td><td className="px-4 py-4"><button onClick={() => openEditModal(p)} className="p-2"><Settings/></button></td></tr>))}</tbody>
            </table>
          </div>
        </div>
      </section>

      {(selectedPackage || modalMode === "create") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold text-slate-100">{modalMode === "edit" ? `Edit: ${selectedPackage?.name}` : "Create New Package"}</h3><button onClick={() => { setSelectedPackage(null); setModalMode(null); }} className="text-slate-400 hover:text-slate-100">✕</button></div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Type</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100">
                  <option value="CREDIT">Credit</option>
                  <option value="SLOT">Slot</option>
                  <option value="PREMIUM">Premium</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Package Name</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100" />
              </div>
              {formType !== "SLOT" && (
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Credits</label>
                  <input type="number" value={formCredits} onChange={(e) => setFormCredits(e.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100" />
                </div>
              )}
              {formType !== "CREDIT" && (
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Slots</label>
                  <input type="number" value={formSlots} onChange={(e) => setFormSlots(e.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100" />
                </div>
              )}
              {formType === "PREMIUM" && (
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Tier</label>
                  <input type="number" value={formTier} onChange={(e) => setFormTier(e.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100" />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs text-slate-400">Price</label>
                <input type="number" step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Features (JSON, optional)</label>
                <textarea value={formFeatures} onChange={(e) => setFormFeatures(e.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 h-24" />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between gap-3"><div>{modalMode === "edit" && selectedPackage && (<button onClick={() => { handleDeletePackage(selectedPackage); setSelectedPackage(null); setModalMode(null); }} className="rounded-2xl bg-rose-500 px-4 py-2 text-xs font-semibold text-slate-950">Delete Package</button>)}</div><div className="flex gap-2"><button onClick={() => { setSelectedPackage(null); setModalMode(null); }} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs text-slate-300">Cancel</button><button onClick={handleSavePackage} className="rounded-2xl bg-brand-cyan px-4 py-2 text-xs font-semibold text-slate-950">{modalMode === "edit" ? "Update Package" : "Create Package"}</button></div></div>
          </div>
        </div>
      )}
    </div>
  );
}
