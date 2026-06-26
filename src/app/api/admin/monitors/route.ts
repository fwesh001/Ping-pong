import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const monitors = await prisma.monitor.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fluxUserId: true,
        },
      },
    },
  });

  return NextResponse.json({ monitors });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { monitorId, isActive, status } = body;
  if (!monitorId) {
    return NextResponse.json({ error: "Monitor ID is required" }, { status: 400 });
  }

  const updateData: any = {};
  if (typeof isActive === "boolean") updateData.isActive = isActive;
  if (typeof status === "string") updateData.status = status;

  const monitor = await prisma.monitor.findUnique({ where: { id: monitorId } });
  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  const updatedMonitor = await prisma.monitor.update({
    where: { id: monitorId },
    data: updateData,
  });

  return NextResponse.json({ monitor: updatedMonitor });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only super admins can delete monitors" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const monitorId = searchParams.get("id");
  if (!monitorId) {
    return NextResponse.json({ error: "Monitor ID is required" }, { status: 400 });
  }

  const monitor = await prisma.monitor.findUnique({ where: { id: monitorId } });
  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  await prisma.monitor.delete({ where: { id: monitorId } });
  return NextResponse.json({ message: "Monitor permanently deleted" });
}
