-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Monitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "pingIntervalSecs" INTEGER NOT NULL DEFAULT 60,
    "timeoutMs" INTEGER NOT NULL DEFAULT 10000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "costPerPing" REAL NOT NULL DEFAULT 0.01389,
    "lastPingedAt" DATETIME,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "isOneOff" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Monitor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Monitor" ("costPerPing", "createdAt", "id", "isActive", "lastPingedAt", "pingIntervalSecs", "serviceName", "targetUrl", "timeoutMs", "updatedAt", "userId") SELECT "costPerPing", "createdAt", "id", "isActive", "lastPingedAt", "pingIntervalSecs", "serviceName", "targetUrl", "timeoutMs", "updatedAt", "userId" FROM "Monitor";
DROP TABLE "Monitor";
ALTER TABLE "new_Monitor" RENAME TO "Monitor";
CREATE INDEX "Monitor_userId_idx" ON "Monitor"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
