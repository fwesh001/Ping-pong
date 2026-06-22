"use client";

import React from "react";
import { CreditCard, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";

interface CreditDisplayProps {
  balance: number;
}

export default function CreditDisplay({ balance }: CreditDisplayProps) {
  const maxCredits = 100;
  const percentage = Math.min((balance / maxCredits) * 100, 100);
  const formattedBalance = typeof balance === "number" ? balance.toFixed(4).replace(/\.?0+$/, "") : balance;

  let statusColor = "text-green-600";
  let bgColor = "bg-green-50";
  let borderColor = "border-green-200";
  let StatusIcon = CheckCircle2;
  let statusMessage = "Good balance";

  if (balance <= 20) {
    statusColor = "text-red-600";
    bgColor = "bg-red-50";
    borderColor = "border-red-200";
    StatusIcon = AlertCircle;
    statusMessage = "Critical — claim daily credits";
  } else if (balance <= 50) {
    statusColor = "text-yellow-600";
    bgColor = "bg-yellow-50";
    borderColor = "border-yellow-200";
    StatusIcon = AlertTriangle;
    statusMessage = "Low balance soon";
  }

  return (
    <div className={`card ${bgColor} border ${borderColor}`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase flex items-center gap-1.5">
          <CreditCard className="w-4 h-4" /> Credit Balance
        </h3>
        <span className={`text-2xl font-bold ${statusColor}`}>
          {formattedBalance}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              balance <= 20
                ? "bg-red-500"
                : balance <= 50
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <p className={`text-xs flex items-center gap-1 ${statusColor}`}>
        <StatusIcon className="w-3 h-3" /> {statusMessage}
      </p>
    </div>
  );
}
