"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, HelpCircle, Zap, Clock, Shield, CreditCard } from "lucide-react";

interface FAQItem {
  question: string;
  icon: React.ReactNode;
  answer: React.ReactNode;
}

const faqItems: FAQItem[] = [
  {
    question: "How does fractional credit billing work?",
    icon: <CreditCard className="w-4 h-4 text-blue-600" />,
    answer: (
      <div className="space-y-2">
        <p>Credits are consumed per ping based on your monitor&apos;s interval. The formula ensures 100 credits last exactly 5 days for a single active monitor:</p>
        <div className="bg-gray-100 rounded-lg p-3 font-mono text-sm">
          Cost per ping = (0.8333 × interval_in_seconds) ÷ 3600
        </div>
        <p>For example, a 60-second interval costs ~0.01389 credits per ping, which equals ~1200 pings/day or ~1.389 credits/day.</p>
      </div>
    ),
  },
  {
    question: "What is the 25-credit flat fee for one-off tasks?",
    icon: <Zap className="w-4 h-4 text-purple-600" />,
    answer: (
      <div className="space-y-2">
        <p>When you create a monitor with &quot;Run Once&quot; enabled, it uses a flat pricing model of <strong>25.0000 credits</strong> total instead of per-ping billing.</p>
        <p>This is ideal for:</p>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          <li>One-time health checks before a deployment</li>
          <li>Scheduled maintenance window monitoring</li>
          <li>Short-lived monitoring tasks that don&apos;t need recurring pings</li>
        </ul>
        <p>After the one-off ping completes, the monitor is automatically marked as <strong>Completed</strong> and <strong>deactivated</strong>.</p>
      </div>
    ),
  },
  {
    question: "How do scheduled monitors work?",
    icon: <Clock className="w-4 h-4 text-green-600" />,
    answer: (
      <div className="space-y-2">
        <p>Scheduled monitors let you define a time window during which the monitor is active:</p>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          <li><strong>Start At</strong> — The cron engine will skip this monitor until the start time is reached</li>
          <li><strong>End At</strong> (optional) — The monitor will be skipped after this time</li>
          <li><strong>Repeat on Interval</strong> — Pings recur at your chosen interval within the window</li>
          <li><strong>Run Once</strong> — A single ping at the start time, then auto-completes (25 credit flat fee)</li>
        </ul>
      </div>
    ),
  },
  {
    question: "What happens when my credits run out?",
    icon: <Shield className="w-4 h-4 text-red-600" />,
    answer: (
      <div className="space-y-2">
        <p>When a user&apos;s credit balance drops to <strong>0 or below</strong>:</p>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          <li>All active monitors are <strong>automatically paused</strong> to prevent negative balances</li>
          <li>No further pings are fired until credits are replenished</li>
          <li>You can claim <strong>10 free credits daily</strong> via the Daily Check-in page</li>
          <li>New users start with <strong>100 credits</strong></li>
        </ul>
      </div>
    ),
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">Frequently Asked Questions</h3>
      </div>

      {faqItems.map((item, index) => (
        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            {openIndex === index ? (
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
            {item.icon}
            <span className="text-sm font-medium text-gray-900">{item.question}</span>
          </button>
          {openIndex === index && (
            <div className="px-4 pb-4 pl-11 text-sm text-gray-700 leading-relaxed">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
