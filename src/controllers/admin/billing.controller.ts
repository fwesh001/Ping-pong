import { type Request, type Response } from "express";
import prisma from "@/lib/db";
import { logAdminAction } from "@/utils/audit";

function getActingUserId(req: Request): string | null {
  const value = req.headers["x-admin-user-id"];
  return typeof value === "string" ? value : null;
}

export async function listCreditPackages(_req: Request, res: Response) {
  const packages = await prisma.creditPackage.findMany({
    orderBy: { createdAt: "desc" },
  });

  return res.json({ packages });
}

export async function createCreditPackage(req: Request, res: Response) {
  const body = req.body as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name : undefined;
  const credits = typeof body.credits === "number" ? body.credits : undefined;
  const price = typeof body.price === "number" ? body.price : undefined;

  if (!name || typeof credits !== "number" || typeof price !== "number") {
    return res.status(400).json({ error: "name, credits (number), and price (number) are required" });
  }

  const pkg = await prisma.creditPackage.create({ data: { name, credits, price } });

  await logAdminAction(
    getActingUserId(req),
    "SYS_EVNT",
    "PACKAGE_CREATE",
    `Created credit package "${name}": ${credits} credits for $${price}`
  );

  return res.status(201).json({ package: pkg });
}

export async function updateCreditPackage(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "Package ID is required" });
  }

  const body = req.body as Record<string, unknown>;
  const existing = await prisma.creditPackage.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Package not found" });
  }

  const updateData: Record<string, unknown> = {};
  if (typeof body.name === "string") updateData.name = body.name;
  if (typeof body.credits === "number") updateData.credits = body.credits;
  if (typeof body.price === "number") updateData.price = body.price;

  const pkg = await prisma.creditPackage.update({
    where: { id },
    data: updateData,
  });

  await logAdminAction(
    getActingUserId(req),
    "SYS_EVNT",
    "PACKAGE_UPDATE",
    `Updated credit package ${id}: ${Object.keys(updateData).join(", ")}`
  );

  return res.json({ package: pkg });
}

export async function deleteCreditPackage(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "Package ID is required" });
  }

  const existing = await prisma.creditPackage.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Package not found" });
  }

  await prisma.creditPackage.delete({ where: { id } });
  await logAdminAction(
    getActingUserId(req),
    "SYS_EVNT",
    "PACKAGE_DELETE",
    `Deleted credit package ${id} (${existing.name})`
  );

  return res.json({ message: "Package permanently deleted" });
}

export async function listTransactions(req: Request, res: Response) {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
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
          },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return res.json({
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
