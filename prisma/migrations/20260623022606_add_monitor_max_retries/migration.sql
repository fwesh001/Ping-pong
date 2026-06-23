-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Monitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "scheduleMode" TEXT NOT NULL DEFAULT 'RECURRING',
    "pingIntervalSecs" INTEGER,
    "timeoutMs" INTEGER NOT NULL DEFAULT 10000,
    "maxRetries" INTEGER NOT NULL DEFAULT 0,
    "activeDays" TEXT,
    "executeTime" TEXT,
    "executeDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "costPerPing" REAL NOT NULL DEFAULT 0.01389,
    "lastPingedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Monitor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Monitor" ("activeDays", "costPerPing", "createdAt", "executeDate", "executeTime", "id", "isActive", "isCompleted", "lastPingedAt", "pingIntervalSecs", "scheduleMode", "serviceName", "status", "targetUrl", "timeoutMs", "updatedAt", "userId") SELECT "activeDays", "costPerPing", "createdAt", "executeDate", "executeTime", "id", "isActive", "isCompleted", "lastPingedAt", "pingIntervalSecs", "scheduleMode", "serviceName", "status", "targetUrl", "timeoutMs", "updatedAt", "userId" FROM "Monitor";
DROP TABLE "Monitor";
ALTER TABLE "new_Monitor" RENAME TO "Monitor";
CREATE INDEX "Monitor_userId_idx" ON "Monitor"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
