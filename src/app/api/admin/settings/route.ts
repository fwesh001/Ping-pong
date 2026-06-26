import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let settings = await prisma.siteSettings.findFirst();
  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: {
        creditCostPerPing: 0.01389,
        globalPause: false,
      },
    });
  }

  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { creditCostPerPing, globalPause } = body;

  let settings = await prisma.siteSettings.findFirst();
  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: {
        creditCostPerPing: typeof creditCostPerPing === "number" ? creditCostPerPing : 0.01389,
        globalPause: typeof globalPause === "boolean" ? globalPause : false,
      },
    });
  } else {
    settings = await prisma.siteSettings.update({
      where: { id: settings.id },
      data: {
        creditCostPerPing: typeof creditCostPerPing === "number" ? creditCostPerPing : settings.creditCostPerPing,
        globalPause: typeof globalPause === "boolean" ? globalPause : settings.globalPause,
      },
    });
  }

  return NextResponse.json({ settings });
}
