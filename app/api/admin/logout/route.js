import { assertSameOrigin, clearAdminChallengeCookie, clearAdminSessionCookie } from "@/lib/session";
import { json } from "@/lib/store";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const headers = new Headers();
    headers.append("set-cookie", clearAdminSessionCookie());
    headers.append("set-cookie", clearAdminChallengeCookie());
    return json({ ok: true }, { headers });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
