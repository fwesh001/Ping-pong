-- CreateTable
CREATE TABLE "pingpong"."User" (
    "id" TEXT NOT NULL,
    "fluxUserId" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "creditBalance" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "monitorSlots" INTEGER NOT NULL DEFAULT 2,
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "lastClaimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pingpong"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SYSTEM',
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pingpong"."SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pingpong"."SiteSettings" (
    "id" TEXT NOT NULL,
    "creditCostPerPing" DOUBLE PRECISION NOT NULL DEFAULT 0.01389,
    "globalPause" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pingpong"."Monitor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "scheduleMode" TEXT NOT NULL DEFAULT 'RECURRING',
    "pingIntervalSecs" INTEGER,
    "timeoutMs" INTEGER NOT NULL DEFAULT 10000,
    "maxRetries" INTEGER NOT NULL DEFAULT 0,
    "activeDays" TEXT,
    "executeTime" TEXT,
    "executeDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "costPerPing" DOUBLE PRECISION NOT NULL DEFAULT 0.01389,
    "lastPingedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Monitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pingpong"."PingLog" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "responseTimeMs" INTEGER,
    "statusCode" INTEGER,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pingpong"."DailyCreditClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyCreditClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_fluxUserId_key" ON "pingpong"."User"("fluxUserId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "pingpong"."Notification"("userId");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "pingpong"."SupportTicket"("userId");

-- CreateIndex
CREATE INDEX "Monitor_userId_idx" ON "pingpong"."Monitor"("userId");

-- CreateIndex
CREATE INDEX "PingLog_monitorId_idx" ON "pingpong"."PingLog"("monitorId");

-- CreateIndex
CREATE INDEX "PingLog_userId_idx" ON "pingpong"."PingLog"("userId");

-- CreateIndex
CREATE INDEX "DailyCreditClaim_userId_idx" ON "pingpong"."DailyCreditClaim"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCreditClaim_userId_claimedAt_key" ON "pingpong"."DailyCreditClaim"("userId", "claimedAt");

-- AddForeignKey
ALTER TABLE "pingpong"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "pingpong"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pingpong"."SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "pingpong"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pingpong"."Monitor" ADD CONSTRAINT "Monitor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "pingpong"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pingpong"."PingLog" ADD CONSTRAINT "PingLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "pingpong"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pingpong"."PingLog" ADD CONSTRAINT "PingLog_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "pingpong"."Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pingpong"."DailyCreditClaim" ADD CONSTRAINT "DailyCreditClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "pingpong"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
