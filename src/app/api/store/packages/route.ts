import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

const FALLBACK_PACKAGES = [
  { id: "credit-50", name: "50 credits", credits: 50, price: 500, type: "CREDIT" },
  { id: "credit-110", name: "110 credits", credits: 110, price: 1000, type: "CREDIT" },
  { id: "credit-300", name: "300 credits", credits: 300, price: 2000, type: "CREDIT" },
  { id: "credit-1500", name: "1500 credits", credits: 1500, price: 5000, type: "CREDIT" },
  { id: "slot-1", name: "1 slot", slots: 1, price: 550, type: "SLOT" },
  { id: "slot-3", name: "3 slots", slots: 3, price: 1500, type: "SLOT" },
  { id: "slot-6", name: "6 slots", slots: 6, price: 2500, type: "SLOT" },
  { id: "premium-1", name: "Tier 1", credits: 500, slots: 5, tier: 1, price: 2500, type: "PREMIUM" },
  { id: "premium-2", name: "Tier 2", credits: 2000, slots: 10, tier: 2, price: 7500, type: "PREMIUM" },
  { id: "premium-3", name: "Tier 3", credits: 7000, slots: 15, tier: 3, price: 10500, type: "PREMIUM" },
];

export async function GET() {
  try {
    const packages = await prisma.creditPackage.findMany({ orderBy: { price: "asc" } });
    return NextResponse.json({ packages });
  } catch (err: any) {
    // If the DB schema is not yet migrated (missing columns) or DB is unreachable,
    // return a safe static fallback so build/prerender can complete.
    if (err instanceof Prisma.PrismaClientKnownRequestError || err?.message) {
      console.warn("/api/store/packages: falling back to static packages due to DB error", err?.message || err);
      return NextResponse.json({ packages: FALLBACK_PACKAGES });
    }
    return NextResponse.json({ packages: FALLBACK_PACKAGES });
  }
}
