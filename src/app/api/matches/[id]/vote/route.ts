import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { matches as matchesTable, votes } from "@/db/schema";
import { findMatchRow, getMatchDetail } from "@/lib/data";
import { voterHash } from "@/lib/ids";
import type { SideKey } from "@/lib/veto";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const side: SideKey | null =
    body?.side === "A" ? "A" : body?.side === "B" ? "B" : null;
  const token = typeof body?.voterToken === "string" ? body.voterToken.slice(0, 128) : "";

  if (!side || token.length < 8) {
    return Response.json(
      { ok: false, error: "A vote requires a side and an anonymous voter token." },
      { status: 400 },
    );
  }

  const match = await findMatchRow(id);
  if (!match) {
    return Response.json({ ok: false, error: "No such match in the registry." }, { status: 404 });
  }
  if (match.status === "RESOLVED") {
    return Response.json(
      { ok: false, code: "SEALED", error: "The chamber has dissolved. Votes are sealed." },
      { status: 409 },
    );
  }

  const hash = voterHash(match.id, token);

  const inserted = await db
    .insert(votes)
    .values({ matchId: match.id, sideKey: side, voterHash: hash })
    .onConflictDoNothing({ target: [votes.matchId, votes.voterHash] })
    .returning({ id: votes.id });

  if (inserted.length === 0) {
    const detail = await getMatchDetail(match.id);
    return Response.json(
      {
        ok: false,
        code: "ALREADY_CAST",
        error: "This token has already voted in this chamber. One reasoning mind, one vote.",
        detail,
      },
      { status: 409 },
    );
  }

  await db
    .update(matchesTable)
    .set(
      side === "A"
        ? { votesA: sql`${matchesTable.votesA} + 1` }
        : { votesB: sql`${matchesTable.votesB} + 1` },
    )
    .where(eq(matchesTable.id, match.id));

  const detail = await getMatchDetail(match.id);
  return Response.json({ ok: true, side, detail });
}
