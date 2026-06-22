import { prisma } from "@/lib/prisma";
import { readerSessionFrom } from "@/lib/session";
import { json, readJson, requireFields } from "@/lib/store";

export async function POST(request) {
  try {
    const payload = await readJson(request);
    requireFields(payload, ["action"]);

    const session = readerSessionFrom(request);
    const userId = session?.sub || null;

    let email = payload.email || null;
    if (userId && !email) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });
      if (user) {
        email = user.email;
      }
    }

    const userAgent = request.headers.get("user-agent") || "";
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    const device = isMobile ? "Mobile" : "Desktop";

    const activity = await prisma.userActivity.create({
      data: {
        userId,
        email,
        action: payload.action,
        details: payload.details || {},
        device
      }
    });

    return json({ ok: true, activity });
  } catch (error) {
    console.error("Failed to log activity:", error);
    return json({ ok: false, error: error.message }, { status: 400 });
  }
}
