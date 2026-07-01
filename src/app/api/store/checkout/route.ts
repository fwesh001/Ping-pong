import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Validate auth and return early if not authenticated
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const payload = await req.json();

  const BACKEND_URL = process.env.BACKEND_URL;
  if (!BACKEND_URL) {
    return NextResponse.json(
      { message: "Store checkout is not configured yet. Paystack integration will be added soon.", data: payload },
      { status: 501 }
    );
  }

  // Proxy to configured backend, forwarding session token as Bearer
  try {
    const token = await getSession();
    const target = `${BACKEND_URL.replace(/\/$/, "")}/store/checkout`;
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
      return NextResponse.json(json, { status: proxied.status });
    } catch (e) {
      return new NextResponse(text, { status: proxied.status, headers: { "Content-Type": proxied.headers.get("content-type") || "text/plain" } });
    }
  } catch (err: any) {
    console.error("/api/store/checkout proxy error:", err?.message || err);
    return NextResponse.json({ error: "Checkout proxy failed" }, { status: 500 });
  }
}
