import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") ?? "100", 10);

  const where: any = {};
  if (type) where.type = type;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { message: { contains: search, mode: "insensitive" } },
    ];
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 500),
  });

  return NextResponse.json({ notifications });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { title, type, message, targetAudience, userId } = body;

  if (!title || !message) {
    return NextResponse.json({ error: "title and message are required" }, { status: 400 });
  }

  // If targetAudience is an email (SPECIFIC), look up the user
  let resolvedUserId: string | null = userId ?? null;
  let resolvedAudience = targetAudience ?? "ALL";

  if (targetAudience && targetAudience !== "ALL" && targetAudience.includes("@")) {
    const user = await prisma.user.findFirst({ where: { email: targetAudience } });
    if (user) {
      resolvedUserId = user.id;
      resolvedAudience = "INDIVIDUAL";
    } else {
      return NextResponse.json({ error: "User with that email not found" }, { status: 404 });
    }
  }

  const notification = await prisma.notification.create({
    data: {
      title,
      type: type ?? "SYSTEM",
      message,
      targetAudience: resolvedAudience,
      readBy: [],
      userId: resolvedUserId,
    },
  });

  return NextResponse.json({ notification }, { status: 201 });
}
