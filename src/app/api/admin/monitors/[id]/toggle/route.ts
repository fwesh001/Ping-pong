import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";

// PUT /api/admin/monitors/[id]/toggle — flip isActive
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id: monitorId } = params;

  const monitor = await prisma.monitor.findUnique({ where: { id: monitorId } });
  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  const updatedMonitor = await prisma.monitor.update({
    where: { id: monitorId },
    data: {
      isActive: !monitor.isActive,
      status: !monitor.isActive ? "ACTIVE" : "PAUSED",
    },
  });

  return NextResponse.json({ monitor: updatedMonitor });
}
