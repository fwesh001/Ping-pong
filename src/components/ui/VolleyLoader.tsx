"use client";

import React from "react";

interface VolleyLoaderProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

export default function VolleyLoader({ size = "md", message }: VolleyLoaderProps) {
  const dims = {
    sm: { w: 120, h: 60, paddleW: 4, paddleH: 16, ballR: 4 },
    md: { w: 180, h: 90, paddleW: 6, paddleH: 22, ballR: 6 },
    lg: { w: 260, h: 130, paddleW: 8, paddleH: 30, ballR: 8 },
  };

  const d = dims[size];

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-800"
        style={{ width: d.w, height: d.h }}
      >
        {/* Center line */}
        <div
          className="absolute top-0 bottom-0 left-1/2 w-px border-l-2 border-dashed border-slate-600"
          style={{ transform: "translateX(-50%)" }}
        />

        {/* Left paddle (purple) */}
        <div
          className="absolute bg-brand-purple rounded-sm"
          style={{
            width: d.paddleW, height: d.paddleH, left: 6, top: "50%",
            transform: "translateY(-50%)",
            animation: "paddleLeft 2s ease-in-out infinite",
          }}
        />

        {/* Right paddle (blue) */}
        <div
          className="absolute bg-brand-cyan rounded-sm"
          style={{
            width: d.paddleW, height: d.paddleH, right: 6, top: "50%",
            transform: "translateY(-50%)",
            animation: "paddleRight 2s ease-in-out infinite",
          }}
        />

        {/* Ball */}
        <div
          className="absolute rounded-full bg-gradient-to-br from-brand-cyan to-brand-cyan/80 shadow-lg"
          style={{
            width: d.ballR * 2, height: d.ballR * 2, top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "ballBounce 1s ease-in-out infinite",
          }}
        />

        {/* Ball trail */}
        <div
          className="absolute rounded-full bg-brand-cyan/20"
          style={{
            width: d.ballR * 3, height: d.ballR * 3, top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "ballTrail 1s ease-in-out infinite",
          }}
        />
      </div>

      {message && <p className="text-sm text-slate-400 font-medium animate-pulse">{message}</p>}

      <style jsx>{`
        @keyframes paddleLeft {
          0%, 100% { transform: translateY(-50%) translateY(-12px); }
          50% { transform: translateY(-50%) translateY(12px); }
        }
        @keyframes paddleRight {
          0%, 100% { transform: translateY(-50%) translateY(12px); }
          50% { transform: translateY(-50%) translateY(-12px); }
        }
        @keyframes ballBounce {
          0% { left: ${6 + d.paddleW + 4}px; transform: translate(0, -50%); }
          50% { left: calc(100% - ${6 + d.paddleW + 4 + d.ballR * 2}px); transform: translate(0, -50%); }
          100% { left: ${6 + d.paddleW + 4}px; transform: translate(0, -50%); }
        }
        @keyframes ballTrail {
          0% { left: ${6 + d.paddleW + 4 + d.ballR}px; opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
          50% { left: calc(100% - ${6 + d.paddleW + 4 + d.ballR}px); opacity: 0.1; transform: translate(-50%, -50%) scale(1.5); }
          100% { left: ${6 + d.paddleW + 4 + d.ballR}px; opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
}
