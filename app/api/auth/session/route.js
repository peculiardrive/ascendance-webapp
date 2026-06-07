import { publicAdmin, publicUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminSessionFrom, readerSessionFrom } from "@/lib/session";
import { json } from "@/lib/store";

export async function GET(request) {
  const readerSession = readerSessionFrom(request);
  const adminSession = adminSessionFrom(request);
  const [user, admin] = await Promise.all([
    readerSession
      ? prisma.user.findUnique({ where: { id: readerSession.sub } })
      : null,
    adminSession
      ? prisma.adminUser.findUnique({ where: { id: adminSession.sub } })
      : null
  ]);

  return json({
    ok: true,
    user: publicUser(user),
    admin: publicAdmin(admin)
  });
}
