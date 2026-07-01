import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/store/checkout
 * - Verifies session via `getSession()`
 * - Proxies the checkout payload to an external BACKEND_URL when configured
 * - Forwards the backend response back to the client
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getSession();
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = await req.json();

    const BACKEND_URL = process.env.BACKEND_URL;
    if (!BACKEND_URL) {
      return NextResponse.json(
        { error: "BACKEND_URL not configured. Set BACKEND_URL to proxy checkout calls." },
        { status: 501 }
      );
    }

    // Proxy to backend checkout endpoint, forwarding the session token as Bearer
    const target = `${BACKEND_URL.replace(/\/$/, "")}/store/checkout`;
    const proxied = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    // Try to parse JSON from backend and forward it
    const text = await proxied.text();
    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, { status: proxied.status });
    } catch (e) {
      // Not JSON — forward raw text
      return new NextResponse(text, { status: proxied.status, headers: { "Content-Type": proxied.headers.get("content-type") || "text/plain" } });
    }
  } catch (err: any) {
    console.error("/api/store/checkout error:", err?.message || err);
    return NextResponse.json({ error: "Checkout proxy failed" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  return NextResponse.json({
    message: "Store checkout is not configured yet. Paystack integration will be added soon.",
    data: body,
  }, { status: 501 });
}
