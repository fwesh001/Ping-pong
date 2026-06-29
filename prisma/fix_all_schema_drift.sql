-- ============================================================
-- Fix all schema drift: add missing columns & tables
-- Safe: uses IF NOT EXISTS / IF EXISTS throughout
-- ============================================================

-- User table: missing columns added after init migration
ALTER TABLE pingpong."User" ADD COLUMN IF NOT EXISTS "activeSlots" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pingpong."User" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- Notification table: missing columns
ALTER TABLE pingpong."Notification" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT '';
ALTER TABLE pingpong."Notification" ADD COLUMN IF NOT EXISTS "targetAudience" TEXT NOT NULL DEFAULT 'ALL';
ALTER TABLE pingpong."Notification" ADD COLUMN IF NOT EXISTS "readBy" TEXT[] NOT NULL DEFAULT '{}';
-- Make userId optional (nullable) to match current schema
ALTER TABLE pingpong."Notification" ALTER COLUMN "userId" DROP NOT NULL;

-- SupportTicket table: column renames/additions
-- 'content' was renamed to 'text', and 'browserInfo' was added
ALTER TABLE pingpong."SupportTicket" ADD COLUMN IF NOT EXISTS "text" TEXT NOT NULL DEFAULT '';
ALTER TABLE pingpong."SupportTicket" ADD COLUMN IF NOT EXISTS "browserInfo" TEXT;
-- Copy existing content into text if text is empty
UPDATE pingpong."SupportTicket" SET "text" = "content" WHERE "text" = '' AND "content" IS NOT NULL;

-- Monitor table: missing nextCheckAt column
ALTER TABLE pingpong."Monitor" ADD COLUMN IF NOT EXISTS "nextCheckAt" TIMESTAMP(3);

-- GlobalSettings table: new table not in init migration
CREATE TABLE IF NOT EXISTS pingpong."GlobalSettings" (
    "id" TEXT NOT NULL,
    "creditCostPerPing" DOUBLE PRECISION NOT NULL DEFAULT 0.01389,
    "globalPause" BOOLEAN NOT NULL DEFAULT false,
    "pollIntervalMs" INTEGER NOT NULL DEFAULT 1000,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT NOT NULL DEFAULT '',
    "maintenanceStart" TIMESTAMP(3),
    "maintenanceEnd" TIMESTAMP(3),
    "lockdownNewAccounts" BOOLEAN NOT NULL DEFAULT false,
    "lockdownNewMonitors" BOOLEAN NOT NULL DEFAULT false,
    "lockdownMessage" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GlobalSettings_pkey" PRIMARY KEY ("id")
);

-- CreditPackage table: new table
CREATE TABLE IF NOT EXISTS pingpong."CreditPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditPackage_pkey" PRIMARY KEY ("id")
);

-- Transaction table: new table
CREATE TABLE IF NOT EXISTS pingpong."Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- Create indexes for Transaction
CREATE INDEX IF NOT EXISTS "Transaction_userId_idx" ON pingpong."Transaction"("userId");
CREATE INDEX IF NOT EXISTS "Transaction_packageId_idx" ON pingpong."Transaction"("packageId");

-- Add foreign keys for Transaction (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Transaction_userId_fkey'
        AND table_schema = 'pingpong'
    ) THEN
        ALTER TABLE pingpong."Transaction"
            ADD CONSTRAINT "Transaction_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES pingpong."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Transaction_packageId_fkey'
        AND table_schema = 'pingpong'
    ) THEN
        ALTER TABLE pingpong."Transaction"
            ADD CONSTRAINT "Transaction_packageId_fkey"
            FOREIGN KEY ("packageId") REFERENCES pingpong."CreditPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AuditLog table: new table
CREATE TABLE IF NOT EXISTS pingpong."AuditLog" (
    "id" TEXT NOT NULL,
    "logType" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuditLog_logType_idx" ON pingpong."AuditLog"("logType");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON pingpong."AuditLog"("userId");
