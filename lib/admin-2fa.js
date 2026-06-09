import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { prisma } from "./prisma";

const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
let setupPromise;

function twoFactorSecret() {
  const secret = process.env.ADMIN_2FA_SECRET || process.env.SESSION_SECRET || process.env.VERIFICATION_CODE_PEPPER;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_2FA_SECRET or SESSION_SECRET is not configured.");
  }
  return secret || "ascendance-local-admin-2fa-secret";
}

function hashCode(challengeId, code) {
  return createHmac("sha256", twoFactorSecret())
    .update(`${challengeId}:${String(code).trim()}`)
    .digest("hex");
}

function safeEqualHex(actualHex, expectedHex) {
  const actual = Buffer.from(actualHex || "", "hex");
  const expected = Buffer.from(expectedHex || "", "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function ensureChallengeTable() {
  setupPromise ||= (async () => {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "admin_two_factor_challenges" (
        "id" TEXT PRIMARY KEY,
        "admin_id" TEXT NOT NULL,
        "code_hash" TEXT NOT NULL,
        "expires_at" TIMESTAMP(3) NOT NULL,
        "attempts" INTEGER NOT NULL DEFAULT 0,
        "consumed_at" TIMESTAMP(3),
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "admin_two_factor_challenges_admin_id_idx"
      ON "admin_two_factor_challenges" ("admin_id")
    `;
    await prisma.$executeRaw`ALTER TABLE "admin_two_factor_challenges" ENABLE ROW LEVEL SECURITY`;
    await prisma.$executeRaw`REVOKE ALL ON TABLE "admin_two_factor_challenges" FROM anon, authenticated`;
  })();
  return setupPromise;
}

export async function createAdminChallenge(adminId) {
  await ensureChallengeTable();
  const id = randomUUID();
  const code = process.env.RESEND_API_KEY ? String(randomInt(100000, 1000000)) : "123456";
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);

  await prisma.$transaction([
    prisma.$executeRaw`
      UPDATE "admin_two_factor_challenges"
      SET "consumed_at" = CURRENT_TIMESTAMP
      WHERE "admin_id" = ${adminId}
        AND "consumed_at" IS NULL
    `,
    prisma.$executeRaw`
      INSERT INTO "admin_two_factor_challenges"
        ("id", "admin_id", "code_hash", "expires_at", "attempts", "created_at")
      VALUES
        (${id}, ${adminId}, ${hashCode(id, code)}, ${expiresAt}, 0, CURRENT_TIMESTAMP)
    `
  ]);

  return { id, code, expiresAt };
}

export async function revokeAdminChallenge(challengeId) {
  await ensureChallengeTable();
  await prisma.$executeRaw`
    UPDATE "admin_two_factor_challenges"
    SET "consumed_at" = CURRENT_TIMESTAMP
    WHERE "id" = ${challengeId}
      AND "consumed_at" IS NULL
  `;
}

export async function verifyAdminChallenge({ challengeId, adminId, code }) {
  await ensureChallengeTable();
  const rows = await prisma.$queryRaw`
    SELECT "id", "admin_id", "code_hash", "expires_at", "attempts", "consumed_at"
    FROM "admin_two_factor_challenges"
    WHERE "id" = ${challengeId}
      AND "admin_id" = ${adminId}
    LIMIT 1
  `;
  const challenge = rows[0];

  if (!challenge || challenge.consumed_at || challenge.expires_at <= new Date()) {
    return { ok: false, error: "The authentication code has expired. Log in again." };
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many incorrect codes. Log in again." };
  }

  if (!safeEqualHex(hashCode(challengeId, code), challenge.code_hash)) {
    await prisma.$executeRaw`
      UPDATE "admin_two_factor_challenges"
      SET "attempts" = "attempts" + 1
      WHERE "id" = ${challengeId}
        AND "consumed_at" IS NULL
    `;
    return { ok: false, error: "Invalid authentication code." };
  }

  const consumed = await prisma.$queryRaw`
    UPDATE "admin_two_factor_challenges"
    SET "consumed_at" = CURRENT_TIMESTAMP
    WHERE "id" = ${challengeId}
      AND "admin_id" = ${adminId}
      AND "consumed_at" IS NULL
      AND "expires_at" > CURRENT_TIMESTAMP
      AND "attempts" < ${MAX_ATTEMPTS}
    RETURNING "id"
  `;
  return consumed.length ? { ok: true } : { ok: false, error: "The authentication code is no longer valid." };
}
