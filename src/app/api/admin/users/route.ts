import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") ?? "200", 10);

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { fluxUserId: { contains: search, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 1000),
    select: {
      id: true,
      fluxUserId: true,
      email: true,
      role: true,
      creditBalance: true,
      monitorSlots: true,
      activeSlots: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ users });
}


export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { userId, creditDelta, slotDelta, role } = body;

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updateData: any = {};
  if (typeof creditDelta === "number") {
    updateData.creditBalance = Number(existingUser.creditBalance) + creditDelta;
  }
  if (typeof slotDelta === "number") {
    updateData.monitorSlots = existingUser.monitorSlots + slotDelta;
  }
  if (role) {
    updateData.role = role;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return NextResponse.json({ user: updatedUser });
}
