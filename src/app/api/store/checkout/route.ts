import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Validate auth and return early if not authenticated
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const payload = await req.json();

  const BACKEND_URL = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://ping-pong-cron.onrender.com";

  // Proxy to configured backend, forwarding session token as Bearer
  try {
    const token = await getSession();
    const target = `${BACKEND_URL.replace(/\/$/, "")}/store/checkout`;
    console.log(`/api/store/checkout proxy ->`, target);
    const proxied = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(payload),
    });
    const text = await proxied.text();
    try {
      const json = JSON.parse(text);
      if (!proxied.ok) {
        console.error("/api/store/checkout proxied error:", proxied.status, json);
      }
      return NextResponse.json(json, { status: proxied.status });
    } catch (e) {
      if (!proxied.ok) {
        console.error("/api/store/checkout proxied error (text):", proxied.status, text);
      }
      return new NextResponse(text, { status: proxied.status, headers: { "Content-Type": proxied.headers.get("content-type") || "text/plain" } });
    }
  } catch (err: any) {
    console.error("/api/store/checkout proxy error:", err?.response?.data || err?.message || err);
    return NextResponse.json({ error: "Checkout proxy failed" }, { status: 500 });
  }
}
