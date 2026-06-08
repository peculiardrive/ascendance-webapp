import { publicUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, readerSessionFrom } from "@/lib/session";
import { json } from "@/lib/store";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const userId = readerSessionFrom(request)?.sub;
    if (!userId) {
      return json({ ok: false, error: "Missing user session." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return json({ ok: false, error: "User not found." }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: 50 } }
    });

    return json({ ok: true, user: publicUser(updated) });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
