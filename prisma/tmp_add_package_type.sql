-- Temporary SQL to add CreditPackage columns and populate seeded rows
ALTER TABLE IF EXISTS pingpong."CreditPackage"
  ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'CREDIT',
  ADD COLUMN IF NOT EXISTS "slots" integer,
  ADD COLUMN IF NOT EXISTS "tier" integer,
  ADD COLUMN IF NOT EXISTS "features" jsonb;

UPDATE pingpong."CreditPackage" SET "type" = 'CREDIT' WHERE id LIKE 'credit-%';
UPDATE pingpong."CreditPackage" SET "type" = 'SLOT' WHERE id LIKE 'slot-%';
UPDATE pingpong."CreditPackage" SET "type" = 'PREMIUM' WHERE id LIKE 'premium-%';

UPDATE pingpong."CreditPackage" SET slots = 1 WHERE id = 'slot-1' AND slots IS NULL;
UPDATE pingpong."CreditPackage" SET slots = 3 WHERE id = 'slot-3' AND slots IS NULL;
UPDATE pingpong."CreditPackage" SET slots = 6 WHERE id = 'slot-6' AND slots IS NULL;

UPDATE pingpong."CreditPackage" SET tier = 1, slots = 5, credits = 500 WHERE id = 'premium-1' AND tier IS NULL;
UPDATE pingpong."CreditPackage" SET tier = 2, slots = 10, credits = 2000 WHERE id = 'premium-2' AND tier IS NULL;
UPDATE pingpong."CreditPackage" SET tier = 3, slots = 15, credits = 7000 WHERE id = 'premium-3' AND tier IS NULL;
