"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VolleyLoader from "@/components/ui/VolleyLoader";
import {
  Sparkles,
  Coins,
  CreditCard,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Star,
} from "lucide-react";

interface UserProfile {
  id: string;
  creditBalance: number;
  email: string;
  username: string;
}

type CheckoutState = "idle" | "processing" | "redirecting";

const creditPackages = [
  { id: "credit-50", name: "Starter Pack", credits: 50, price: 500, perCredit: "₦10 / credit" },
  { id: "credit-110", name: "Most Popular", credits: 110, price: 1000, perCredit: "₦9.09 / credit", popular: true },
  { id: "credit-300", name: "Value Pack", credits: 300, price: 2000, perCredit: "₦6.67 / credit" },
  { id: "credit-1500", name: "Mega Pack", credits: 1500, price: 5000, perCredit: "₦3.33 / credit" },
];

const slotPackages = [
  { id: "slot-1", name: "1 Slot Add-on", slots: 1, price: 550 },
  { id: "slot-3", name: "3 Slot Add-on", slots: 3, price: 1500, popular: true },
  { id: "slot-6", name: "6 Slot Add-on", slots: 6, price: 2500 },
];

const premiumPackages = [
  {
    id: "premium-1",
    name: "Tier 1",
    price: 2500,
    slots: 5,
    credits: 500,
    interval: "1-minute ping interval",
    retries: "Max 1 retry",
  },
  {
    id: "premium-2",
    name: "Tier 2",
    price: 7500,
    slots: 10,
    credits: 2000,
    interval: "30-second heartbeats",
    retries: "Up to 2 retries",
    popular: true,
  },
  {
    id: "premium-3",
    name: "Tier 3",
    price: 10500,
    slots: 15,
    credits: 7000,
    interval: "10-second heartbeats",
    retries: "Priority cron queue",
    extra: "Priority cron execution at the top of the cycle",
  },
];

export default function BillingPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const checkoutAvailable = false;

  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to load profile");
      }
      const data = await res.json();
      setUser({
        id: data.user.id,
        creditBalance: data.user.creditBalance,
        email: data.user.email,
        username: data.user.username,
      });
    } catch (err: any) {
      console.error("[STORE] Failed to fetch profile:", err.message);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchUserProfile();
      setLoading(false);
    };
    load();
  }, [fetchUserProfile]);

  if (loading) {
    return (
      <>
        <Navbar creditBalance={0} />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-20">
              <VolleyLoader size="lg" message="Loading store information..." />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar creditBalance={user?.creditBalance ?? 0} />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-2xl bg-brand-cyan/10 p-2.5">
                <CreditCard className="w-6 h-6 text-brand-cyan" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-100">Store</h1>
                <p className="text-slate-400 mt-1 max-w-2xl">
                  Purchase credits, lift your monitor limit, or upgrade to premium performance packages.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8 rounded-3xl border border-rose-600/30 bg-rose-900/80 p-5 text-sm text-rose-100 shadow-sm shadow-rose-500/10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-300" />
                Checkout is not ready yet. Paystack integration will be connected soon.
              </p>
              <p className="text-slate-300/80">All store cards are visible for product planning and pricing validation.</p>
            </div>
          </div>

          <div className="mb-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-cyan" /> Credits
                </h2>
                <p className="text-slate-400 text-sm mt-1">Fast consumable power for your monitors.</p>
              </div>
              <div className="rounded-full bg-slate-800/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                Most popular: ₦1000 for 110 credits
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {creditPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/95 p-6 transition duration-300 ease-out hover:-translate-y-1 hover:border-brand-cyan/40 hover:shadow-[0_24px_90px_-50px_rgba(14,165,233,0.7)] ${pkg.popular ? "border-brand-cyan/30 bg-slate-900/100" : ""}`}
                >
                  {pkg.popular ? (
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-cyan/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-cyan animate-pulse">
                      Most popular
                    </div>
                  ) : null}
                  <div className="mb-5">
                    <p className="text-sm text-slate-400 uppercase tracking-[0.2em]">{pkg.name}</p>
                    <div className="mt-3 flex items-end gap-2">
                      <p className="text-4xl font-bold text-slate-100">{pkg.credits.toLocaleString()}</p>
                      <span className="text-sm text-slate-500">credits</span>
                    </div>
                  </div>
                  <div className="mb-6 flex items-center justify-between gap-3 rounded-3xl bg-slate-950/80 px-4 py-3">
                    <span className="text-sm text-slate-300">Price</span>
                    <span className="text-lg font-semibold text-slate-100">₦{pkg.price.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-6">{pkg.perCredit}</p>
                  <button
                    disabled={!checkoutAvailable}
                    className="w-full rounded-2xl bg-slate-700/90 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Checkout soon
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-400" /> Slots
                </h2>
                <p className="text-slate-400 text-sm mt-1">Expand your active monitoring infrastructure.</p>
              </div>
              <div className="rounded-full bg-slate-800/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                Most popular: ₦1500 for 3 slots
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {slotPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/95 p-6 transition duration-300 ease-out hover:-translate-y-1 hover:border-amber-400/40 hover:shadow-[0_24px_90px_-50px_rgba(245,158,11,0.7)] ${pkg.popular ? "border-amber-400/30 bg-slate-900/100" : ""}`}
                >
                  {pkg.popular ? (
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-300 animate-pulse">
                      Most popular
                    </div>
                  ) : null}
                  <div className="mb-5">
                    <p className="text-sm text-slate-400 uppercase tracking-[0.2em]">{pkg.name}</p>
                    <div className="mt-3 flex items-end gap-2">
                      <p className="text-4xl font-bold text-slate-100">{pkg.slots}</p>
                      <span className="text-sm text-slate-500">slot{pkg.slots > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <div className="mb-6 flex items-center justify-between gap-3 rounded-3xl bg-slate-950/80 px-4 py-3">
                    <span className="text-sm text-slate-300">One-time price</span>
                    <span className="text-lg font-semibold text-slate-100">₦{pkg.price.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-6">Purchase more monitor capacity instantly.</p>
                  <button
                    disabled={!checkoutAvailable}
                    className="w-full rounded-2xl bg-slate-700/90 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Checkout soon
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-400" /> Premium packages
                </h2>
                <p className="text-slate-400 text-sm mt-1">One-time upgrades for better scaling, speed, and reliability.</p>
              </div>
              <div className="rounded-full bg-slate-800/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                Most popular: Tier 2 at ₦7500
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {premiumPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/95 p-6 transition duration-300 ease-out hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-[0_24px_90px_-50px_rgba(168,85,247,0.7)] ${pkg.popular ? "border-violet-400/30 bg-slate-900/100" : ""}`}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-400 uppercase tracking-[0.2em]">{pkg.name}</p>
                      <p className="text-3xl font-bold text-slate-100">₦{pkg.price.toLocaleString()}</p>
                    </div>
                    {pkg.popular ? (
                      <div className="rounded-full bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-violet-300 animate-pulse">
                        Most popular
                      </div>
                    ) : null}
                  </div>
                  <ul className="mb-6 space-y-3 text-sm text-slate-300">
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400" /> {pkg.slots} active monitor slots
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400" /> {pkg.credits} credits
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400" /> {pkg.interval}
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400" /> {pkg.retries}
                    </li>
                    {pkg.extra ? (
                      <li className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-400" /> {pkg.extra}
                      </li>
                    ) : null}
                  </ul>
                  <button
                    disabled={!checkoutAvailable}
                    className="w-full rounded-2xl bg-slate-700/90 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Checkout soon
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-300">Secure Store Preview</p>
                <p className="text-xs text-slate-500 mt-1">
                  Store checkout is currently disabled while we finish payment integration. The visual pricing and package lineup are ready for review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
