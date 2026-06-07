import { assertSameOrigin, clearAdminSessionCookie } from "@/lib/session";
import { json } from "@/lib/store";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    return json(
      { ok: true },
      { headers: { "set-cookie": clearAdminSessionCookie() } }
    );
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
