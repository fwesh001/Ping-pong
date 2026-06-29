import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id: userId } = params;
  const body = await req.json();
  const { creditDelta, slotDelta, role } = body;

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
  if (typeof role === "string") {
    updateData.role = role;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return NextResponse.json({ user: updatedUser });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id: userId } = params;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ message: "User deleted" });
}
