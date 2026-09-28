import { sql } from "drizzle-orm";
import { db } from "@/db";
import { rebuttals, sides as sidesTable } from "@/db/schema";
import { findMatchRow, getMatchDetail } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const claimKey = typeof body?.claimKey === "string" ? body.claimKey.trim().toUpperCase() : "";
  const text = typeof body?.body === "string" ? body.body.trim().slice(0, 2000) : "";

  if (claimKey.length < 8) {
    return Response.json(
      { ok: false, error: "A sealed side key is required to enter the room." },
      { status: 403 },
    );
  }
  if (text.length < 8) {
    return Response.json(
      { ok: false, error: "A statement of at least eight characters is required." },
      { status: 422 },
    );
  }

  const match = await findMatchRow(id);
  if (!match) {
    return Response.json({ ok: false, error: "No such match in the registry." }, { status: 404 });
  }
  if (match.status === "RESOLVED") {
    return Response.json(
      { ok: false, error: "The chamber has dissolved. The record is closed." },
      { status: 409 },
    );
  }

  const sideRows = await db
    .select()
    .from(sidesTable)
    .where(sql`${sidesTable.matchId} = ${match.id}::uuid and ${sidesTable.claimKey} = ${claimKey}`)
    .limit(1);
  const side = sideRows[0];

  if (!side) {
    return Response.json(
      { ok: false, error: "That side key does not open this room." },
      { status: 403 },
    );
  }

  await db.insert(rebuttals).values({
    matchId: match.id,
    sideKey: side.key,
    phase: match.phase,
    body: text,
  });

  const detail = await getMatchDetail(match.id);
  return Response.json({ ok: true, side: side.key, detail });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const match = await findMatchRow(id);
  if (!match) {
    return Response.json({ ok: false, error: "No such match." }, { status: 404 });
  }
  const detail = await getMatchDetail(match.id);
  return Response.json({ ok: true, detail });
}


