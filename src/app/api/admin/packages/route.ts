import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  // support optional filtering by type: ?type=CREDIT|SLOT|PREMIUM
  const type = req.nextUrl.searchParams.get("type");
  const where = type ? { type } : undefined;

  const packages = await prisma.creditPackage.findMany({
    where: where as any,
    orderBy: { price: "asc" },
  });

  return NextResponse.json({ packages });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { name, credits, price, type = "CREDIT", slots, tier, features } = body;

  if (!name || typeof price !== "number") {
    return NextResponse.json({ error: "name and price (number) are required" }, { status: 400 });
  }

  // type-specific validation
  if (type === "CREDIT") {
    if (typeof credits !== "number") {
      return NextResponse.json({ error: "credits (number) is required for CREDIT packages" }, { status: 400 });
    }
  }

  if (type === "SLOT") {
    if (typeof slots !== "number") {
      return NextResponse.json({ error: "slots (number) is required for SLOT packages" }, { status: 400 });
    }
  }

  if (type === "PREMIUM") {
    if (typeof credits !== "number" || typeof slots !== "number") {
      return NextResponse.json({ error: "credits and slots (numbers) are required for PREMIUM packages" }, { status: 400 });
    }
  }

  const data: any = { name, price, type };
  if (typeof credits === "number") data.credits = credits;
  if (typeof slots === "number") data.slots = slots;
  if (typeof tier === "number") data.tier = tier;
  if (features) data.features = features;

  const pkg = await prisma.creditPackage.create({ data });
  return NextResponse.json({ package: pkg }, { status: 201 });
}
