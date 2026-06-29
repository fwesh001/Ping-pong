import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const logType = searchParams.get("type");
  const userId = searchParams.get("userId");

  const where: any = {};
  if (logType) where.logType = logType;
  if (userId) where.userId = userId;

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: Math.min(limit, 500),
  });

  return NextResponse.json({ logs });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { logType, action, details, userId } = body;

  if (!logType || !action) {
    return NextResponse.json(
      { error: "logType and action are required" },
      { status: 400 }
    );
  }

  const log = await prisma.auditLog.create({
    data: {
      logType,
      action,
      details: details ?? null,
      userId: userId ?? null,
    },
  });

  return NextResponse.json({ log }, { status: 201 });
}
