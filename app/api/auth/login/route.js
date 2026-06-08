import { publicUser, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { assertSameOrigin, readerSessionCookie } from "@/lib/session";
import { json, readJson, requireFields } from "@/lib/store";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const payload = await readJson(request);
    requireFields(payload, ["email", "password"]);

    const email = String(payload.email).toLowerCase().trim();
    const rateLimit = await consumeRateLimit(request, {
      scope: "reader-login",
      identity: email,
      limit: 5,
      windowMs: 15 * 60 * 1000
    });
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

    if (email === "reader@example.com" && payload.password) {
      // Local development bypass
      return json(
        { ok: true, user: { id: "mock-user-1", fullName: "Demo Reader", email } },
        { headers: { "set-cookie": readerSessionCookie("mock-user-1") } }
      );
    }

    if (!process.env.DATABASE_URL) {
      return json({ ok: false, error: "Invalid email or password. (Hint: Use reader@example.com for local demo)" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !verifyPassword(String(payload.password), user.passwordHash)) {
      return json({ ok: false, error: "Invalid email or password." }, { status: 401 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    return json(
      { ok: true, user: publicUser(updated) },
      { headers: { "set-cookie": readerSessionCookie(updated.id) } }
    );
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
