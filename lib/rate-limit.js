import { createHash } from "node:crypto";
import { prisma } from "./prisma";

const memoryBuckets = new Map();
let setupPromise;

function clientAddress(request) {
  return (
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

async function ensureRateLimitTable() {
  setupPromise ||= (async () => {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
        "key" TEXT PRIMARY KEY,
        "count" INTEGER NOT NULL DEFAULT 0,
        "reset_at" TIMESTAMP(3) NOT NULL,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await prisma.$executeRaw`ALTER TABLE "rate_limit_buckets" ENABLE ROW LEVEL SECURITY`;
    await prisma.$executeRaw`REVOKE ALL ON TABLE "rate_limit_buckets" FROM anon, authenticated`;
  })();
  return setupPromise;
}

function consumeMemoryLimit(key, limit, windowMs) {
  const now = Date.now();
  const existing = memoryBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + windowMs };
    memoryBuckets.set(key, bucket);
    return { allowed: true, remaining: limit - 1, resetAt: new Date(bucket.resetAt) };
  }
  existing.count += 1;
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: new Date(existing.resetAt)
  };
}

export async function consumeRateLimit(request, { scope, identity = "", limit, windowMs }) {
  const rawKey = `${scope}:${clientAddress(request)}:${String(identity).toLowerCase()}`;
  const key = createHash("sha256").update(rawKey).digest("hex");
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  try {
    await ensureRateLimitTable();
    const rows = await prisma.$queryRaw`
      INSERT INTO "rate_limit_buckets" ("key", "count", "reset_at", "updated_at")
      VALUES (${key}, 1, ${resetAt}, CURRENT_TIMESTAMP)
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "rate_limit_buckets"."reset_at" <= ${now} THEN 1
          ELSE "rate_limit_buckets"."count" + 1
        END,
        "reset_at" = CASE
          WHEN "rate_limit_buckets"."reset_at" <= ${now} THEN ${resetAt}
          ELSE "rate_limit_buckets"."reset_at"
        END,
        "updated_at" = CURRENT_TIMESTAMP
      RETURNING "count", "reset_at"
    `;
    const bucket = rows[0];
    return {
      allowed: bucket.count <= limit,
      remaining: Math.max(0, limit - bucket.count),
      resetAt: bucket.reset_at
    };
  } catch {
    console.warn("Database rate limiting unavailable; using local limiter.");
    return consumeMemoryLimit(key, limit, windowMs);
  }
}

export function rateLimitResponse(result) {
  return Response.json(
    { ok: false, error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "cache-control": "no-store",
        "retry-after": String(Math.max(1, Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)))
      }
    }
  );
}
