"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const OPTIONS = [
  { id: "credit-50", label: "50 credits (₦500)" },
  { id: "credit-110", label: "110 credits (₦1000)" },
  { id: "credit-300", label: "300 credits (₦2000)" },
  { id: "credit-1500", label: "1500 credits (₦5000)" },
  { id: "slot-1", label: "1 slot (₦550)" },
  { id: "slot-3", label: "3 slots (₦1500)" },
  { id: "slot-6", label: "6 slots (₦2500)" },
  { id: "premium-1", label: "Tier 1 (₦2500)" },
  { id: "premium-2", label: "Tier 2 (₦7500)" },
  { id: "premium-3", label: "Tier 3 (₦10500)" },
];

export default function TestCheckoutPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [packageId, setPackageId] = useState<string>(OPTIONS[0].id);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    // try to fetch current user (same approach as store page)
    fetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) throw new Error("Not authenticated");
        return r.json();
      })
      .then((data) => setUserId(data.user?.id ?? null))
      .catch(() => setUserId(null));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setLoading(true);
    try {
      if (!userId) throw new Error("You must be logged in to run this test.");
      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, userId, source: "web" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Checkout failed");
      if (data.checkoutLink) {
        // redirect to Flutterwave checkout
        window.location.href = data.checkoutLink;
        return;
      }
      setResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResult(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar creditBalance={0} />
      <main className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Test Checkout (Flutterwave)</h1>
        <p className="text-sm text-slate-400 mb-6">This page posts directly to <code>/api/store/checkout</code>. You must be logged in.</p>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium mb-1">Package</label>
            <select value={packageId} onChange={(e) => setPackageId(e.target.value)} className="w-full p-2 rounded border bg-slate-900">
              {OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Authenticated user</label>
            <div className="p-2 rounded border bg-slate-900">{userId ?? "Not logged in"}</div>
          </div>

          <div>
            <button disabled={loading} className="px-4 py-2 rounded bg-cyan-500 text-slate-900 font-semibold">
              {loading ? "Creating checkout..." : "Start checkout"}
            </button>
          </div>
        </form>

        {result && (
          <pre className="mt-6 p-4 rounded bg-slate-800 text-sm whitespace-pre-wrap">{result}</pre>
        )}
      </main>
      <Footer />
    </>
  );
}
