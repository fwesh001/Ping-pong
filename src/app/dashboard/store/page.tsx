"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Zap,
  Server,
  CheckCircle2,
  ArrowRight,
  Crown,
  Coins,
} from "lucide-react";

interface StoreInfo {
  creditBalance: number;
  monitorSlots: number;
}

const creditPackages = [
  { price: 500, credits: 50, popular: false },
  { price: 1000, credits: 110, popular: true },
  { price: 2000, credits: 300, popular: false },
  { price: 5000, credits: 1500, popular: false },
];

const slotPackages = [
  { price: 550, slots: 1, popular: false },
  { price: 1500, slots: 3, popular: true },
  { price: 2500, slots: 6, popular: false },
];

const premiumPackages = [
  {
    price: 2500,
    title: "Tier 1",
    slots: 5,
    credits: 500,
    interval: "1-min intervals",
    retries: "Max 1 Retry",
  },
  {
    price: 7500,
    title: "Tier 2",
    slots: 10,
    credits: 2000,
    interval: "30-sec intervals",
    retries: "Max 2 Retries",
  },
  {
    price: 10500,
    title: "Tier 3",
    slots: 15,
    credits: 7000,
    interval: "10-sec intervals",
    retries: "Priority cron execution",
  },
];

export default function StorePage() {
  const [info, setInfo] = useState<StoreInfo>({ creditBalance: 0, monitorSlots: 0 });
  const [loading, setLoading] = useState(true);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = "/login";
            return;
          }
          throw new Error("Failed to load account info");
        }
        const data = await res.json();
        setInfo({ creditBalance: data.user.creditBalance, monitorSlots: data.user.monitorSlots });
      } catch (err: any) {
        setCheckoutError(err.message || "Unable to load store info");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleCheckout = async (payload: Record<string, any>) => {
    setCheckoutError(null);
    setCheckoutMessage(null);
    try {
      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout is not ready yet");
      setCheckoutMessage(data.message || "Checkout created successfully.");
    } catch (err: any) {
      setCheckoutError(err.message || "Checkout failed");
    }
  };

  return (
    <>
      <Navbar creditBalance={info.creditBalance} />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.2em] text-brand-cyan">Store</p>
            <h1 className="text-3xl font-bold text-slate-100">Credit & slot shop</h1>
            <p className="text-slate-400 mt-2">Purchase credits, additional monitor slots, or permanent upgrade bundles.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mb-8">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <p className="text-sm text-slate-400 uppercase tracking-[0.2em]">Credit balance</p>
              <p className="mt-4 text-4xl font-semibold text-slate-100">{info.creditBalance.toFixed(2)}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <p className="text-sm text-slate-400 uppercase tracking-[0.2em]">Monitor slots</p>
              <p className="mt-4 text-4xl font-semibold text-slate-100">{info.monitorSlots}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <p className="text-sm text-slate-400 uppercase tracking-[0.2em]">Upgrade notes</p>
              <p className="mt-4 text-slate-100 text-sm">Paystack integration will be connected to handle permanent purchases in the next release.</p>
            </div>
          </div>

          {checkoutMessage && <div className="rounded-3xl border border-emerald-700 bg-emerald-900/80 p-4 text-sm text-emerald-200 mb-4">{checkoutMessage}</div>}
          {checkoutError && <div className="rounded-3xl border border-rose-700 bg-rose-900/80 p-4 text-sm text-rose-200 mb-4">{checkoutError}</div>}

          <div className="space-y-10">
            {/* Credits Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-brand-cyan" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">Credits</h2>
                  <p className="text-sm text-slate-400">Fast consumable power for your monitors</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {creditPackages.map((pkg) => {
                  const isPopular = pkg.popular;
                  return (
                    <div
                      key={pkg.price}
                      className={`flex flex-col relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border transition-all duration-300 hover:-translate-y-1 ${
                        isPopular
                          ? "border-cyan-500 scale-105 shadow-lg shadow-cyan-500/20"
                          : "border-slate-700"
                      }`}
                    >
                      {/* Aurora mesh: two cyan nodes with inline animation styles */}
                      <div
                        className="pointer-events-none absolute -top-20 -left-20 w-56 h-56 rounded-full bg-cyan-500/20 blur-[60px]"
                        style={{ animation: "aurora-drift-a 12s ease-in-out infinite", willChange: "transform, opacity" }}
                      />
                      <div
                        className="pointer-events-none absolute -bottom-20 -right-20 w-56 h-56 rounded-full bg-cyan-500/20 blur-[60px]"
                        style={{ animation: "aurora-drift-b 14s ease-in-out infinite", willChange: "transform, opacity" }}
                      />

                      {isPopular && (
                        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500 text-slate-50 z-20 whitespace-nowrap">
                          Most popular
                        </span>
                      )}

                      <div className={`relative z-10 flex flex-col flex-1 ${isPopular ? "pt-8" : ""}`}>
                        <div className="flex items-center gap-2 text-slate-300 mb-4">
                          <Coins className="w-4 h-4 text-brand-cyan" />
                          <span className="text-sm font-medium">{pkg.credits} credits</span>
                        </div>
                        <p className="text-4xl font-bold text-slate-100">₦{pkg.price}</p>
                        <p className="text-xs text-slate-500 mt-1">One-time purchase</p>
                        <button
                          onClick={() =>
                            handleCheckout({ type: "credit", price: pkg.price, credits: pkg.credits })
                          }
                          className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
                            isPopular
                              ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                              : "border border-slate-600 text-slate-300 hover:bg-slate-700/50"
                          }`}
                        >
                          Checkout
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Slots Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-purple/10 border border-brand-purple/30 flex items-center justify-center">
                  <Server className="w-5 h-5 text-brand-purple" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">Slots</h2>
                  <p className="text-sm text-slate-400">Expand your monitoring infrastructure</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {slotPackages.map((pkg) => {
                  const isPopular = pkg.popular;
                  return (
                    <div
                      key={pkg.price}
                      className={`flex flex-col relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border transition-all duration-300 hover:-translate-y-1 ${
                        isPopular
                          ? "border-purple-500 scale-105 shadow-lg shadow-purple-500/20"
                          : "border-slate-700"
                      }`}
                    >
                      {/* Aurora mesh: two purple nodes with inline animation styles */}
                      <div
                        className="pointer-events-none absolute -top-20 -left-20 w-56 h-56 rounded-full bg-purple-500/20 blur-[60px]"
                        style={{ animation: "aurora-drift-a 12s ease-in-out infinite", willChange: "transform, opacity" }}
                      />
                      <div
                        className="pointer-events-none absolute -bottom-20 -right-20 w-56 h-56 rounded-full bg-purple-500/20 blur-[60px]"
                        style={{ animation: "aurora-drift-b 14s ease-in-out infinite", willChange: "transform, opacity" }}
                      />

                      {isPopular && (
                        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500 text-white z-20 whitespace-nowrap">
                          Most popular
                        </span>
                      )}

                      <div className={`relative z-10 flex flex-col flex-1 ${isPopular ? "pt-8" : ""}`}>
                        <div className="flex items-center gap-2 text-slate-300 mb-4">
                          <Server className="w-4 h-4 text-brand-purple" />
                          <span className="text-sm font-medium">
                            {pkg.slots} additional slot{pkg.slots > 1 ? "s" : ""}
                          </span>
                        </div>
                        <p className="text-4xl font-bold text-slate-100">₦{pkg.price}</p>
                        <p className="text-xs text-slate-500 mt-1">One-time purchase</p>
                        <button
                          onClick={() =>
                            handleCheckout({ type: "slot", price: pkg.price, slots: pkg.slots })
                          }
                          className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
                            isPopular
                              ? "bg-purple-500 text-white hover:bg-purple-400"
                              : "border border-slate-600 text-slate-300 hover:bg-slate-700/50"
                          }`}
                        >
                          Checkout
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Premium Packages Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">Premium packages</h2>
                  <p className="text-sm text-slate-400">
                    Luxurious one-time permanent unlocks
                  </p>
                </div>
              </div>
              <div className="grid gap-4 xl:grid-cols-3">
                {premiumPackages.map((pkg) => {
                  return (
                    <div
                      key={pkg.price}
                      className="flex flex-col relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 transition-all duration-300 hover:-translate-y-1 p-6"
                    >
                      {/* Aurora mesh: cyan + purple nebula with inline animation styles */}
                      <div
                        className="pointer-events-none absolute -top-20 -left-20 w-56 h-56 rounded-full bg-cyan-500/15 blur-[60px]"
                        style={{ animation: "aurora-drift-a 12s ease-in-out infinite", willChange: "transform, opacity" }}
                      />
                      <div
                        className="pointer-events-none absolute -bottom-20 -right-20 w-56 h-56 rounded-full bg-purple-500/15 blur-[60px]"
                        style={{ animation: "aurora-drift-b 14s ease-in-out infinite", willChange: "transform, opacity" }}
                      />

                      <div className="relative z-10 flex flex-col flex-1">
                        <div className="flex items-center gap-2 text-slate-300 mb-4">
                          <Crown className="w-4 h-4 text-amber-400" />
                          <span className="text-sm font-medium">{pkg.title}</span>
                        </div>
                        <p className="text-4xl font-bold text-slate-100">₦{pkg.price}</p>
                        <ul className="mt-5 space-y-3 text-slate-300 text-sm">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-brand-cyan flex-shrink-0 mt-0.5" />
                            <span>{pkg.slots} permanent slots</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-brand-cyan flex-shrink-0 mt-0.5" />
                            <span>{pkg.credits} credits</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-brand-cyan flex-shrink-0 mt-0.5" />
                            <span>{pkg.interval}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-brand-cyan flex-shrink-0 mt-0.5" />
                            <span>{pkg.retries}</span>
                          </li>
                        </ul>
                        <button
                          onClick={() =>
                            handleCheckout({ type: "premium", price: pkg.price, tier: pkg.title })
                          }
                          className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors border border-slate-600 text-slate-300 hover:bg-slate-700/50"
                        >
                          Checkout
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
