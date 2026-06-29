import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const packages = await prisma.creditPackage.findMany({
    orderBy: { price: "asc" },
  });

  return NextResponse.json({ packages });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { name, credits, price } = body;

  if (!name || typeof credits !== "number" || typeof price !== "number") {
    return NextResponse.json({ error: "name, credits (number), and price (number) are required" }, { status: 400 });
  }

  const pkg = await prisma.creditPackage.create({
    data: { name, credits, price },
  });

  return NextResponse.json({ package: pkg }, { status: 201 });
}
