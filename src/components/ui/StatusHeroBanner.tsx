"use client";

import React from "react";
import { CheckCircle2, Pause, AlertTriangle, Play, Activity } from "lucide-react";

interface StatusHeroBannerProps {
  status: "ACTIVE" | "PAUSED" | "DOWN";
  onToggle: () => void;
  toggling?: boolean;
}

export default function StatusHeroBanner({ status, onToggle, toggling }: StatusHeroBannerProps) {
  const config = {
    ACTIVE: {
      bg: "bg-slate-800",
      icon: <Activity className="w-8 h-8 text-emerald-400" />,
      title: "Monitor Active",
      subtitle: "All systems operational — pinging on schedule",
      btnClass: "bg-brand-cyan hover:bg-brand-cyan/90 text-slate-900 border border-transparent",
      btnLabel: "Pause",
      showPulse: true,
    },
    PAUSED: {
      bg: "bg-slate-800",
      icon: <Pause className="w-8 h-8 text-amber-400" />,
      title: "Monitor Paused",
      subtitle: "Pinging halted — no credits being consumed",
      btnClass: "bg-brand-cyan hover:bg-brand-cyan/90 text-slate-900 border border-transparent",
      btnLabel: "Resume",
      showPulse: false,
    },
    DOWN: {
      bg: "bg-slate-800",
      icon: <AlertTriangle className="w-8 h-8 text-rose-400" />,
      title: "Service Down",
      subtitle: "Target is unreachable — immediate attention required",
      btnClass: "bg-brand-cyan hover:bg-brand-cyan/90 text-slate-900 border border-transparent",
      btnLabel: "Pause",
      showPulse: false,
    },
  };

  const c = config[status];

  return (
    <div className={`${c.bg} rounded-2xl p-6 md:p-8 text-slate-100 relative overflow-hidden`}> 
      {/* Background decorative circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-purple/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {/* Animated radar pulse for ACTIVE */}
            {c.showPulse && (
              <>
                <span className="absolute inset-0 rounded-full bg-brand-cyan/20 animate-ping" />
                <span className="absolute inset-0 rounded-full bg-brand-cyan/10 animate-pulse" />
              </>
            )}
            <div className="relative w-14 h-14 rounded-full bg-slate-700/40 flex items-center justify-center backdrop-blur-sm">
              {c.icon}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-poppins">{c.title}</h2>
            <p className="text-slate-300 text-sm mt-0.5">{c.subtitle}</p>
          </div>
        </div>

        <button
          onClick={onToggle}
          disabled={toggling}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${c.btnClass} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {status === "PAUSED" ? (
            <Play className="w-4 h-4" />
          ) : (
            <Pause className="w-4 h-4" />
          )}
          {toggling ? "Updating…" : c.btnLabel}
        </button>
      </div>

      {/* Helper text */}
      <p className="relative z-10 text-slate-300/60 text-xs mt-4 pl-0 md:pl-[4.5rem]">
        Pausing this monitor immediately halts background pings and preserves your wallet balance.
      </p>
    </div>
  );
}
