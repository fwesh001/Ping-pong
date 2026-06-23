"use client";

import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQ from "@/components/ui/FAQ";
import VolleyLoader from "@/components/ui/VolleyLoader";
import { Gift, CheckCircle2, Lock, Flame, Star, Trophy, Zap } from "lucide-react";

export default function CreditsPage() {
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [streakCount, setStreakCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claimedToday, setClaimedToday] = useState(false);
  const [lastClaimedAt, setLastClaimedAt] = useState<string | null>(null);

  const DAILY_REWARD = 10;

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) { if (res.status === 401) { window.location.href = "/login"; return; } throw new Error("Failed"); }
      const data = await res.json();
      setCreditBalance(data.user.creditBalance);
      setStreakCount(data.user.streakCount || 0);
      setLastClaimedAt(data.user.lastClaimedAt || null);

      // Check if already claimed today
      if (data.user.lastClaimedAt) {
        const lastClaim = new Date(data.user.lastClaimedAt);
        const now = new Date();
        const hoursSince = (now.getTime() - lastClaim.getTime()) / (60 * 60 * 1000);
        if (hoursSince < 24) setClaimedToday(true);
      }
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  const fireConfetti = (isBonus: boolean) => {
    if (isBonus) {
      // Explosive multi-directional burst for Day 7
      const duration = 3000;
      const end = Date.now() + duration;
      const colors = ["#00CFFF", "#9B4DCC", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];

      (function frame() {
        confetti({ particleCount: 7, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 7, angle: 120, spread: 55, origin: { x: 1 }, colors });
        confetti({ particleCount: 3, angle: 90, spread: 120, origin: { y: 0.5 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    } else {
      // Standard celebration
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#10B981", "#00CFFF", "#9B4DCC"] });
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/credits/claim", { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json();

      if (!res.ok) {
        if (data.error?.toLowerCase().includes("already") || data.error?.toLowerCase().includes("come back")) {
          setClaimedToday(true);
        }
        throw new Error(data.error || "Failed to claim credits");
      }

      setMessage(data.message || `You claimed ${DAILY_REWARD} credits!`);
      setClaimedToday(true);
      setCreditBalance(data.creditBalance ?? creditBalance + DAILY_REWARD);
      setStreakCount(data.streakCount || 1);
      setLastClaimedAt(new Date().toISOString());

      // Fire confetti!
      fireConfetti(data.isBonus);
    } catch (err: any) { setError(err.message); }
    finally { setClaiming(false); }
  };

  if (loading) {
    return (
      <><Navbar creditBalance={0} /><main className="flex-1"><div className="container mx-auto px-4 py-8"><div className="flex items-center justify-center py-20"><VolleyLoader size="lg" message="Loading your credits..." /></div></div></main><Footer /></>
    );
  }

  return (
    <>
      <Navbar creditBalance={creditBalance} />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Daily Check-in</h1>
          <p className="text-slate-400 mb-8">Claim your free daily credits to keep monitoring your services.</p>

          {/* Current Balance */}
          <div className="card mb-6 bg-slate-800 border-slate-700">
            <h3 className="text-sm font-medium text-slate-200 uppercase mb-1">Current Balance</h3>
            <p className="text-4xl font-bold text-slate-100">
              {typeof creditBalance === "number" ? creditBalance.toFixed(4).replace(/\.?0+$/, "") : creditBalance}
            </p>
          </div>

          {/* 7-Day Streak Tracker */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" /> Streak Tracker
                </h3>
                <span className="text-sm text-slate-400">
                {streakCount > 0 ? `${streakCount} day${streakCount > 1 ? "s" : ""} strong!` : "Start your streak!"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-1">
              {Array.from({ length: 7 }, (_, i) => {
                const day = i + 1;
                const isClaimed = day <= streakCount;
                const isCurrent = day === streakCount + 1 || (streakCount === 0 && day === 1);
                const isLocked = day > streakCount + 1;
                const isDay7 = day === 7;

                return (
                  <div key={day} className="flex-1 flex flex-col items-center relative">
                    {isDay7 && (
                      <span className="absolute -top-5 text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        <Zap className="w-2.5 h-2.5 inline" /> +25
                      </span>
                    )}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isClaimed
                          ? "bg-emerald-400 text-slate-900 shadow-md shadow-emerald-200"
                          : isCurrent && !claimedToday
                          ? "border-2 border-brand-purple text-brand-purple animate-pulse"
                          : isCurrent && claimedToday
                          ? "border-2 border-slate-600 text-slate-400"
                          : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {isClaimed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isLocked ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : isDay7 ? (
                        <Trophy className="w-4 h-4" />
                      ) : (
                        day
                      )}
                    </div>
                    <span className={`text-[10px] mt-1 font-medium ${isClaimed ? "text-emerald-400" : isCurrent ? "text-brand-purple" : "text-slate-400"}`}>
                      Day {day}
                    </span>
                  </div>
                );
              })}
            </div>

            {streakCount > 0 && streakCount < 7 && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                {7 - streakCount} more day{7 - streakCount > 1 ? "s" : ""} until the +25 bonus!
              </p>
            )}
            {streakCount === 0 && !claimedToday && (
              <p className="text-xs text-purple-600 mt-3 text-center font-medium">
                Claim today to start your streak! 🔥
              </p>
            )}
          </div>

          {/* Claim Section */}
          <div className="card text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-10 h-10 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Daily Credit Reward</h2>
              <p className="text-gray-600">
                Claim <span className="font-bold text-blue-600">{DAILY_REWARD} credits</span> every 24 hours for free!
              </p>
              {streakCount >= 7 && (
                <p className="text-purple-600 text-sm mt-2 font-medium flex items-center justify-center gap-1">
                  <Star className="w-4 h-4" /> You&apos;ve completed a full streak cycle!
                </p>
              )}
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

            {claiming ? (
              <div className="flex justify-center py-4">
                <VolleyLoader size="sm" message="Claiming..." />
              </div>
            ) : (
              <button
                onClick={handleClaim}
                disabled={claiming || claimedToday}
                className="btn-primary text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {claimedToday ? "✅ Already Claimed Today" : `Claim ${DAILY_REWARD} Credits`}
              </button>
            )}

            {claimedToday && lastClaimedAt && (
              <p className="text-sm text-gray-500 mt-3">
                Come back in {Math.ceil(24 - (Date.now() - new Date(lastClaimedAt).getTime()) / (60 * 60 * 1000))} hours!
              </p>
            )}
          </div>

          {/* Info */}
          <div className="card mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">How Credits Work</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2"><span className="text-blue-600 mt-0.5">•</span><span>Each ping costs credits based on your monitor&apos;s interval</span></li>
              <li className="flex items-start gap-2"><span className="text-blue-600 mt-0.5">•</span><span>Claim {DAILY_REWARD} free credits every 24 hours</span></li>
              <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">•</span><span>Maintain a 7-day streak for a +25 bonus reward!</span></li>
              <li className="flex items-start gap-2"><span className="text-red-600 mt-0.5">•</span><span>Miss a day and your streak resets to 0</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8"><FAQ /></div>
      </main>
      <Footer />
    </>
  );
}
