import { getScenarios } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const scenarios = await getScenarios();
  return Response.json({ ok: true, scenarios });
}
