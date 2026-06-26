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
