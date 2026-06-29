"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VolleyLoader from "@/components/ui/VolleyLoader";
import {
  Sparkles,
  Coins,
  CreditCard,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Star,
} from "lucide-react";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  createdAt: string;
}

interface UserProfile {
  id: string;
  creditBalance: number;
  email: string;
  username: string;
}

type CheckoutState = "idle" | "processing" | "redirecting";

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>("idle");
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Handle payment callback from Flutterwave redirect
  useEffect(() => {
    const status = searchParams.get("status");
    const txRef = searchParams.get("tx_ref");

    if (status === "successful" || txRef) {
      setMessage("Payment successful! Your credits will be applied shortly.");
    } else if (status === "cancelled") {
      setMessage("Payment was cancelled. You can try again.");
    }
  }, [searchParams]);

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/admin/packages");
      if (!res.ok) throw new Error("Failed to load packages");
      const data = await res.json();
      setPackages(data.packages || []);
    } catch (err: any) {
      console.error("[BILLING] Failed to fetch packages:", err.message);
    }
  }, []);

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
      console.error("[BILLING] Failed to fetch profile:", err.message);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchPackages(), fetchUserProfile()]);
      setLoading(false);
    };
    load();
  }, [fetchPackages, fetchUserProfile]);

  const handlePurchase = async (pkg: CreditPackage) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setCheckoutState("processing");
    setSelectedPackageId(pkg.id);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/admin/initialize-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          userId: user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize payment");
      }

      if (!data.checkoutLink) {
        throw new Error("No checkout link received from payment provider");
      }

      setCheckoutState("redirecting");

      // Redirect to Flutterwave checkout
      window.location.href = data.checkoutLink;
    } catch (err: any) {
      console.error("[BILLING] Purchase error:", err.message);
      setMessage(err.message || "Failed to initialize payment. Please try again.");
      setCheckoutState("idle");
      setSelectedPackageId(null);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar creditBalance={0} />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-20">
              <VolleyLoader size="lg" message="Loading billing information..." />
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
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-2xl bg-brand-cyan/10 p-2.5">
                <CreditCard className="w-6 h-6 text-brand-cyan" />
              </div>
              <h1 className="text-3xl font-bold text-slate-100">Buy Credits</h1>
            </div>
            <p className="text-slate-400 mt-1">
              Purchase credit packages to power your monitor pings. Payments are processed securely via Flutterwave.
            </p>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`mb-6 rounded-2xl border p-4 text-sm ${
              message.includes("successful")
                ? "border-emerald-700 bg-emerald-900/80 text-emerald-200"
                : message.includes("cancelled")
                ? "border-amber-700 bg-amber-900/80 text-amber-200"
                : "border-rose-700 bg-rose-900/80 text-rose-200"
            }`}>
              <div className="flex items-center gap-2">
                {message.includes("successful") ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                )}
                {message}
              </div>
            </div>
          )}

          {/* Processing Overlay */}
          {checkoutState !== "idle" && (
            <div className="mb-6 rounded-2xl border border-brand-cyan/30 bg-slate-900 p-6 text-center">
              <Loader2 className="w-8 h-8 text-brand-cyan animate-spin mx-auto mb-3" />
              <p className="text-slate-200 font-medium">
                {checkoutState === "processing"
                  ? "Initializing payment..."
                  : "Redirecting to payment portal..."}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Please do not close this page.
              </p>
            </div>
          )}

          {/* Current Balance Card */}
          <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-500/10 p-2">
                  <Coins className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Current Balance</p>
                  <p className="text-2xl font-bold text-slate-100">
                    {typeof user?.creditBalance === "number"
                      ? user.creditBalance.toFixed(2)
                      : "0.00"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4" />
                Secured by Flutterwave
              </div>
            </div>
          </div>

          {/* Credit Packages Grid */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-cyan" />
              Credit Packages
            </h2>

            {packages.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
                <Coins className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No credit packages available at this time.</p>
                <p className="text-slate-500 text-sm mt-1">Please check back later or contact support.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg) => {
                  const isProcessing = checkoutState !== "idle" && selectedPackageId === pkg.id;
                  const creditsPerNaira = pkg.credits / pkg.price;

                  return (
                    <div
                      key={pkg.id}
                      className="group relative rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition-all hover:border-brand-cyan/50 hover:shadow-lg hover:shadow-brand-cyan/5"
                    >
                      {/* Value Badge */}
                      <div className="absolute -top-2 -right-2">
                        <div className="rounded-full bg-brand-cyan px-2.5 py-0.5 text-[10px] font-bold text-slate-950">
                          ₦{pkg.price.toLocaleString()}
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="w-4 h-4 text-amber-400" />
                          <h3 className="text-base font-semibold text-slate-100">{pkg.name}</h3>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-slate-100">
                            {pkg.credits.toLocaleString()}
                          </span>
                          <span className="text-sm text-slate-400">credits</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {creditsPerNaira.toFixed(1)} credits per Naira
                        </p>
                      </div>

                      <button
                        onClick={() => handlePurchase(pkg)}
                        disabled={checkoutState !== "idle"}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-cyan px-4 py-2.5 text-sm font-semibold text-slate-950 transition-all hover:bg-brand-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            Purchase Package
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Security Footer */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-300">Secure Payment via Flutterwave</p>
                <p className="text-xs text-slate-500 mt-1">
                  All transactions are encrypted and processed through Flutterwave&apos;s secure payment gateway.
                  We never store your payment details. After successful payment, credits are automatically applied to your account.
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
