"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MonitorList from "@/components/MonitorList";
import PingerForm from "@/components/PingerForm";
import CreditDisplay from "@/components/CreditDisplay";

export default function DashboardPage() {
  const [monitors, setMonitors] = useState([
    {
      id: "1",
      serviceName: "API Server",
      targetUrl: "https://api.example.com/health",
      status: "success",
      lastChecked: "2 minutes ago",
      uptime: 99.8,
      pingInterval: 60,
      isActive: true,
    },
    {
      id: "2",
      serviceName: "Web App",
      targetUrl: "https://app.example.com",
      status: "success",
      lastChecked: "5 minutes ago",
      uptime: 100,
      pingInterval: 120,
      isActive: true,
    },
    {
      id: "3",
      serviceName: "Database Backup",
      targetUrl: "https://backup.example.com",
      status: "failure",
      lastChecked: "1 minute ago",
      uptime: 95.2,
      pingInterval: 300,
      isActive: true,
    },
  ]);

  const [creditBalance] = useState(85);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddMonitor = (newMonitor: any) => {
    setMonitors([
      ...monitors,
      {
        ...newMonitor,
        id: String(monitors.length + 1),
        status: "unknown",
        lastChecked: "Never",
        uptime: 0,
      },
    ]);
    setShowAddForm(false);
  };

  const handleToggleMonitor = (id: string) => {
    setMonitors(
      monitors.map((m) =>
        m.id === id ? { ...m, isActive: !m.isActive } : m
      )
    );
  };

  const handleDeleteMonitor = (id: string) => {
    setMonitors(monitors.filter((m) => m.id !== id));
  };

  return (
    <>
      <Navbar creditBalance={creditBalance} />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Monitor your web services and track uptime
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <CreditDisplay balance={creditBalance} />
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 uppercase">
                Active Monitors
              </h3>
              <p className="text-4xl font-bold text-blue-600 mt-2">
                {monitors.filter((m) => m.isActive).length}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                of {monitors.length} total
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 uppercase">
                Avg Uptime
              </h3>
              <p className="text-4xl font-bold text-green-600 mt-2">
                {(
                  monitors.reduce((sum, m) => sum + m.uptime, 0) /
                  monitors.length
                ).toFixed(1)}
                %
              </p>
              <p className="text-sm text-gray-600 mt-1">Last 30 days</p>
            </div>
          </div>

          {/* Add Monitor Section */}
          <div className="mb-8">
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary"
              >
                + Add New Monitor
              </button>
            ) : (
              <div className="card">
                <h2 className="text-2xl font-bold mb-4">Add New Monitor</h2>
                <PingerForm
                  onSubmit={handleAddMonitor}
                  onCancel={() => setShowAddForm(false)}
                />
              </div>
            )}
          </div>

          {/* Monitors List */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Your Monitors</h2>
            {monitors.length > 0 ? (
              <MonitorList
                monitors={monitors}
                onToggle={handleToggleMonitor}
                onDelete={handleDeleteMonitor}
              />
            ) : (
              <div className="card text-center py-12">
                <p className="text-gray-600 mb-4">No monitors yet</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="btn-primary"
                >
                  Create your first monitor
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
