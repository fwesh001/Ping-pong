import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let settings = await prisma.globalSettings.findFirst();
  if (!settings) {
    settings = await prisma.globalSettings.create({
      data: {
        creditCostPerPing: 0.01389,
        globalPause: false,
        pollIntervalMs: 1000,
        maintenanceMode: false,
        maintenanceMessage: "",
        lockdownNewAccounts: false,
        lockdownNewMonitors: false,
        lockdownMessage: "",
      },
    });
  }

  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const {
    creditCostPerPing,
    globalPause,
    pollIntervalMs,
    maintenanceMode,
    maintenanceMessage,
    maintenanceStart,
    maintenanceEnd,
    lockdownNewAccounts,
    lockdownNewMonitors,
    lockdownMessage,
  } = body;

  let settings = await prisma.globalSettings.findFirst();
  if (!settings) {
    settings = await prisma.globalSettings.create({
      data: {
        creditCostPerPing: typeof creditCostPerPing === "number" ? creditCostPerPing : 0.01389,
        globalPause: typeof globalPause === "boolean" ? globalPause : false,
        pollIntervalMs: typeof pollIntervalMs === "number" ? pollIntervalMs : 1000,
        maintenanceMode: typeof maintenanceMode === "boolean" ? maintenanceMode : false,
        maintenanceMessage: typeof maintenanceMessage === "string" ? maintenanceMessage : "",
        maintenanceStart: maintenanceStart ? new Date(maintenanceStart) : null,
        maintenanceEnd: maintenanceEnd ? new Date(maintenanceEnd) : null,
        lockdownNewAccounts: typeof lockdownNewAccounts === "boolean" ? lockdownNewAccounts : false,
        lockdownNewMonitors: typeof lockdownNewMonitors === "boolean" ? lockdownNewMonitors : false,
        lockdownMessage: typeof lockdownMessage === "string" ? lockdownMessage : "",
      },
    });
  } else {
    settings = await prisma.globalSettings.update({
      where: { id: settings.id },
      data: {
        creditCostPerPing: typeof creditCostPerPing === "number" ? creditCostPerPing : settings.creditCostPerPing,
        globalPause: typeof globalPause === "boolean" ? globalPause : settings.globalPause,
        pollIntervalMs: typeof pollIntervalMs === "number" ? pollIntervalMs : settings.pollIntervalMs,
        maintenanceMode: typeof maintenanceMode === "boolean" ? maintenanceMode : settings.maintenanceMode,
        maintenanceMessage: typeof maintenanceMessage === "string" ? maintenanceMessage : settings.maintenanceMessage,
        maintenanceStart: maintenanceStart ? new Date(maintenanceStart) : settings.maintenanceStart,
        maintenanceEnd: maintenanceEnd ? new Date(maintenanceEnd) : settings.maintenanceEnd,
        lockdownNewAccounts: typeof lockdownNewAccounts === "boolean" ? lockdownNewAccounts : settings.lockdownNewAccounts,
        lockdownNewMonitors: typeof lockdownNewMonitors === "boolean" ? lockdownNewMonitors : settings.lockdownNewMonitors,
        lockdownMessage: typeof lockdownMessage === "string" ? lockdownMessage : settings.lockdownMessage,
      },
    });
  }

  return NextResponse.json({ settings });
}
