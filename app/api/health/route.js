import { json } from "@/lib/store";

export function GET() {
  return json({
    ok: true,
    app: "Ascendance WebApp",
    runtime: "Next.js App Router",
    now: new Date().toISOString()
  });
}
