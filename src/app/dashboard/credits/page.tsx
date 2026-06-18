"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CreditsPage() {
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claimedToday, setClaimedToday] = useState(false);

  const DAILY_REWARD = parseInt(
    process.env.NEXT_PUBLIC_DAILY_CREDIT_REWARD || "10",
    10
  );

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to fetch balance");
      }
      const data = await res.json();
      setCreditBalance(data.user.creditBalance);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const handleClaim = async () => {
    setClaiming(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/credits/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.toLowerCase().includes("already")) {
          setClaimedToday(true);
        }
        throw new Error(data.error || "Failed to claim credits");
      }

      setMessage(`🎉 You claimed ${DAILY_REWARD} credits!`);
      setClaimedToday(true);
      setCreditBalance(data.creditBalance ?? creditBalance + DAILY_REWARD);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar creditBalance={0} />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar creditBalance={creditBalance} />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Daily Check-in
          </h1>
          <p className="text-gray-600 mb-8">
            Claim your free daily credits to keep monitoring your services.
          </p>

          {/* Current Balance */}
          <div className="card mb-6 bg-blue-50 border-blue-200">
            <h3 className="text-sm font-medium text-blue-700 uppercase mb-1">
              Current Balance
            </h3>
            <p className="text-4xl font-bold text-blue-900">
              {typeof creditBalance === "number"
                ? creditBalance.toFixed(4).replace(/\.?0+$/, "")
                : creditBalance}
            </p>
          </div>

          {/* Claim Section */}
          <div className="card text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎁</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Daily Credit Reward
              </h2>
              <p className="text-gray-600">
                Claim <span className="font-bold text-blue-600">{DAILY_REWARD} credits</span> every
                24 hours for free!
              </p>
            </div>

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm mb-4">
                {message}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handleClaim}
              disabled={claiming || claimedToday}
              className="btn-primary text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {claiming ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Claiming...
                </span>
              ) : claimedToday ? (
                "✅ Already Claimed Today"
              ) : (
                `Claim ${DAILY_REWARD} Credits`
              )}
            </button>

            {claimedToday && (
              <p className="text-sm text-gray-500 mt-3">
                Come back tomorrow for more free credits!
              </p>
            )}
          </div>

          {/* Info */}
          <div className="card mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">How Credits Work</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  Each ping costs a small amount of credits based on your
                  monitor&apos;s interval
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  Frequent pings (shorter intervals) cost more per day
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  Claim {DAILY_REWARD} free credits every 24 hours
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  You start with{" "}
                  {process.env.NEXT_PUBLIC_INITIAL_CREDIT_BALANCE || "100"} credits on signup
                </span>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
