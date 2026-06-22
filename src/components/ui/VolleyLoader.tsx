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
        className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100"
        style={{ width: d.w, height: d.h }}
      >
        {/* Center line */}
        <div
          className="absolute top-0 bottom-0 left-1/2 w-px border-l-2 border-dashed border-gray-300"
          style={{ transform: "translateX(-50%)" }}
        />

        {/* Left paddle (purple) */}
        <div
          className="absolute bg-purple-500 rounded-sm"
          style={{
            width: d.paddleW, height: d.paddleH, left: 6, top: "50%",
            transform: "translateY(-50%)",
            animation: "paddleLeft 2s ease-in-out infinite",
          }}
        />

        {/* Right paddle (blue) */}
        <div
          className="absolute bg-blue-500 rounded-sm"
          style={{
            width: d.paddleW, height: d.paddleH, right: 6, top: "50%",
            transform: "translateY(-50%)",
            animation: "paddleRight 2s ease-in-out infinite",
          }}
        />

        {/* Ball */}
        <div
          className="absolute rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-300/50"
          style={{
            width: d.ballR * 2, height: d.ballR * 2, top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "ballBounce 1s ease-in-out infinite",
          }}
        />

        {/* Ball trail */}
        <div
          className="absolute rounded-full bg-blue-300/30"
          style={{
            width: d.ballR * 3, height: d.ballR * 3, top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "ballTrail 1s ease-in-out infinite",
          }}
        />
      </div>

      {message && <p className="text-sm text-gray-500 font-medium animate-pulse">{message}</p>}

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
