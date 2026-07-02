import { NextResponse } from "next/server";

export async function GET() {
  const BACKEND_URL = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://ping-pong-cron.onrender.com";

  try {
    const target = `${BACKEND_URL.replace(/\/$/, "")}/health`;
    const res = await fetch(target, { method: "GET", cache: "no-store" });
    const data = await res.json().catch(() => null);
    return NextResponse.json({ ok: true, backend: { url: BACKEND_URL, status: res.status, data } }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err), backendUrl: BACKEND_URL }, { status: 502 });
  }
}
