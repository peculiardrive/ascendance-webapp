ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "verification_code_hash" TEXT,
ADD COLUMN IF NOT EXISTS "verification_expires_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "verification_attempts" INTEGER NOT NULL DEFAULT 0;
