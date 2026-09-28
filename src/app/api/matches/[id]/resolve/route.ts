import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  competitors as competitorsTable,
  matches as matchesTable,
  sides as sidesTable,
} from "@/db/schema";
import { findMatchRow, getMatchDetail } from "@/lib/data";
import { outcomeFor, resolveVerdict, type SideKey } from "@/lib/veto";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const match = await findMatchRow(id);
  if (!match) {
    return Response.json({ ok: false, error: "No such match in the registry." }, { status: 404 });
  }

  if (match.status === "RESOLVED") {
    const detail = await getMatchDetail(match.id);
    return Response.json({ ok: true, alreadyResolved: true, detail });
  }

  const verdict = resolveVerdict(match.votesA, match.votesB);

  await db
    .update(matchesTable)
    .set({
      status: "RESOLVED",
      phase: "VERDICT",
      voteValue: verdict.voteValue,
      winnerSide: verdict.winnerSide,
      pointsA: verdict.pointsA,
      pointsB: verdict.pointsB,
      marginShare: verdict.marginShare,
      resolvedAt: new Date(),
    })
    .where(eq(matchesTable.id, match.id));

  const sideRows = await db
    .select()
    .from(sidesTable)
    .where(eq(sidesTable.matchId, match.id));

  for (const side of sideRows) {
    const key: SideKey = side.key === "B" ? "B" : "A";
    const outcome = outcomeFor(key, verdict);
    const points = key === "A" ? verdict.pointsA : verdict.pointsB;

    await db
      .update(sidesTable)
      .set({ outcome, points })
      .where(eq(sidesTable.id, side.id));

    if (side.competitorId) {
      await db
        .update(competitorsTable)
        .set({
          totalPoints: sql`${competitorsTable.totalPoints} + ${points}`,
          matchesPlayed: sql`${competitorsTable.matchesPlayed} + 1`,
          wins: sql`${competitorsTable.wins} + ${outcome === "WINNER" ? 1 : 0}`,
          ties: sql`${competitorsTable.ties} + ${outcome === "TIE" ? 1 : 0}`,
          losses: sql`${competitorsTable.losses} + ${outcome === "LOSER" ? 1 : 0}`,
        })
        .where(eq(competitorsTable.id, side.competitorId));
    }
  }

  const detail = await getMatchDetail(match.id);
  return Response.json({ ok: true, verdict, detail });
}
