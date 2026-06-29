import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const status = searchParams.get("status");
  const userId = searchParams.get("userId");

  const where: any = {};
  if (status) where.status = status;
  if (userId) where.userId = userId;

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 500),
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fluxUserId: true,
        },
      },
      package: {
        select: {
          id: true,
          name: true,
          credits: true,
          price: true,
        },
      },
    },
  });

  return NextResponse.json({ transactions });
}
