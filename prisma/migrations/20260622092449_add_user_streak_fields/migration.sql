-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fluxUserId" TEXT NOT NULL,
    "creditBalance" REAL NOT NULL DEFAULT 100.0,
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "lastClaimedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "creditBalance", "fluxUserId", "id", "updatedAt") SELECT "createdAt", "creditBalance", "fluxUserId", "id", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_fluxUserId_key" ON "User"("fluxUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
