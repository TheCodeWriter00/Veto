import { eq } from "drizzle-orm";
import { db } from "@/db";
import { matches as matchesTable } from "@/db/schema";
import { findMatchRow, getMatchDetail } from "@/lib/data";
import { PHASES, type Phase } from "@/lib/veto";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const next = typeof body?.phase === "string" ? body.phase.toUpperCase() : "";

  if (!PHASES.includes(next as Phase)) {
    return Response.json(
      { ok: false, error: `Phase must be one of ${PHASES.join(", ")}.` },
      { status: 422 },
    );
  }

  const match = await findMatchRow(id);
  if (!match) {
    return Response.json({ ok: false, error: "No such match in the registry." }, { status: 404 });
  }
  if (match.status === "RESOLVED") {
    return Response.json({ ok: false, error: "The record is closed." }, { status: 409 });
  }

  await db
    .update(matchesTable)
    .set({ phase: next })
    .where(eq(matchesTable.id, match.id));

  const detail = await getMatchDetail(match.id);
  return Response.json({ ok: true, phase: next, detail });
}
