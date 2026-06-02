import { json, readState, writeState } from "@/lib/store";

export async function GET() {
  return json({ ok: true, state: await readState() });
}

export async function PUT(request) {
  const payload = await request.json();
  await writeState(payload);
  return json({ ok: true, savedAt: new Date().toISOString() });
}
