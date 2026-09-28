import { getArenaStats, getStandings } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const [standings, stats] = await Promise.all([getStandings(50), getArenaStats()]);
  return Response.json({ ok: true, standings, stats });
}
