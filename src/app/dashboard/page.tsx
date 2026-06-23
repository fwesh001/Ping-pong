"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MonitorList from "@/components/MonitorList";
import PingerForm from "@/components/PingerForm";
import CreditDisplay from "@/components/CreditDisplay";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

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

export default function DashboardPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) { if (meRes.status === 401) { window.location.href = "/login"; return; } throw new Error("Auth failed"); }
      const meData = await meRes.json();
      setCreditBalance(meData.user.creditBalance);
      const monRes = await fetch("/api/monitors");
      if (!monRes.ok) throw new Error("Failed to fetch monitors");
      const monData = await monRes.json();
      setMonitors(monData.monitors || []);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddMonitor = async (newMonitor: any) => {
    try {
      const res = await fetch("/api/monitors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newMonitor) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Failed to create"); }
      setShowAddForm(false); await fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const handleToggleMonitor = async (id: string) => {
    const monitor = monitors.find((m) => m.id === id);
    if (!monitor) return;
    try {
      const res = await fetch(`/api/monitors?id=${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !monitor.isActive }) });
      if (!res.ok) throw new Error("Failed"); await fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteMonitor = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/monitors?id=${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed"); setDeleteTarget(null); await fetchData();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) {
    return (<><Navbar creditBalance={0} /><main className="flex-1"><div className="container mx-auto px-4 py-8"><div className="flex items-center justify-center py-20"><div className="w-12 h-12 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin" /></div></div></main><Footer /></>);
  }

  if (error) {
    return (<><Navbar creditBalance={0} /><main className="flex-1"><div className="container mx-auto px-4 py-8"><div className="card text-center py-12"><p className="text-red-600 mb-4">{error}</p><button onClick={fetchData} className="btn-primary">Retry</button></div></div></main><Footer /></>);
  }

  const activeMonitors = monitors.filter((m) => m.isActive && !m.isCompleted);
  const avgUptime = monitors.length > 0 ? monitors.reduce((sum, m) => sum + m.uptime, 0) / monitors.length : 0;

  return (
    <>
      <Navbar creditBalance={creditBalance} />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
            <p className="text-slate-400 mt-2">Monitor your web services and track uptime</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <CreditDisplay balance={creditBalance} />
            <div className="card">
              <h3 className="text-sm font-medium text-slate-400 uppercase">Active Monitors</h3>
              <p className="text-4xl font-bold text-brand-cyan mt-2">{activeMonitors.length}</p>
              <p className="text-sm text-slate-400 mt-1">of {monitors.length} total</p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-slate-400 uppercase">Avg Uptime</h3>
              <p className="text-4xl font-bold text-emerald-400 mt-2">{avgUptime.toFixed(1)}%</p>
              <p className="text-sm text-slate-400 mt-1">Last 30 days</p>
            </div>
          </div>
          <div className="mb-8">
            {!showAddForm ? (
              <button onClick={() => setShowAddForm(true)} className="btn-primary">+ Add New Monitor</button>
            ) : (
              <div className="card">
                <h2 className="text-2xl font-bold mb-4">Add New Monitor</h2>
                <PingerForm onSubmit={handleAddMonitor} onCancel={() => setShowAddForm(false)} activeMonitorCount={activeMonitors.length} maxMonitors={5} />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4">Your Monitors</h2>
            {monitors.length > 0 ? (
              <MonitorList monitors={monitors} onToggle={handleToggleMonitor} onDelete={(id) => { const m = monitors.find((x) => x.id === id); if (m) setDeleteTarget({ id, name: m.serviceName }); }} />
            ) : (
                <div className="card text-center py-16">
                <Image src="/ping-pong.png" alt="ping-pong" width={80} height={80} className="rounded-xl mx-auto mb-6 opacity-40" style={{ width: "auto", height: "auto" }} />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No monitors yet</h3>
                <p className="text-slate-400 mb-6 text-sm">Start monitoring your services by creating your first monitor.</p>
                <button onClick={() => setShowAddForm(true)} className="btn-primary">Create your first monitor</button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <ConfirmationModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteMonitor} title="Delete Monitor" targetName={deleteTarget?.name || ""} confirmButtonText="Delete Permanently" variant="danger" />
    </>
  );
}
