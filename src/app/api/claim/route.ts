import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { competitors as competitorsTable, sides as sidesTable } from "@/db/schema";
import { generateHandle, generateVaultKey } from "@/lib/ids";

export const dynamic = "force-dynamic";

/**
 * Claim an anonymous vault against a sealed side key.
 * The vault key is disclosed exactly once, at creation.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const claimKey = typeof body?.claimKey === "string" ? body.claimKey.trim().toUpperCase() : "";
  const vaultKey = typeof body?.vaultKey === "string" ? body.vaultKey.trim().toUpperCase() : "";

  if (claimKey.length < 8) {
    return Response.json({ ok: false, error: "A sealed side key is required." }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(sidesTable)
    .where(eq(sidesTable.claimKey, claimKey))
    .limit(1);
  const side = rows[0];

  if (!side) {
    return Response.json(
      { ok: false, error: "That side key is not in the registry." },
      { status: 404 },
    );
  }

  if (side.competitorId) {
    const comps = await db
      .select({ handle: competitorsTable.handle })
      .from(competitorsTable)
      .where(eq(competitorsTable.id, side.competitorId))
      .limit(1);
    return Response.json({
      ok: true,
      alreadyClaimed: true,
      handle: comps[0]?.handle ?? null,
      side: side.key,
      note: "This side is already bound to an anonymous vault.",
    });
  }

  if (vaultKey) {
    const existing = await db
      .select()
      .from(competitorsTable)
      .where(eq(competitorsTable.vaultKey, vaultKey))
      .limit(1);
    if (!existing[0]) {
      return Response.json({ ok: false, error: "No vault carries that key." }, { status: 404 });
    }
    await db
      .update(sidesTable)
      .set({ competitorId: existing[0].id })
      .where(eq(sidesTable.id, side.id));
    return Response.json({
      ok: true,
      linked: true,
      handle: existing[0].handle,
      side: side.key,
    });
  }

  const created = await db
    .insert(competitorsTable)
    .values({ handle: generateHandle(), vaultKey: generateVaultKey() })
    .returning();

  const vault = created[0];
  if (!vault) {
    return Response.json({ ok: false, error: "Vault creation failed." }, { status: 500 });
  }

  await db
    .update(sidesTable)
    .set({ competitorId: vault.id })
    .where(eq(sidesTable.id, side.id));

  return Response.json({
    ok: true,
    created: true,
    handle: vault.handle,
    vaultKey: vault.vaultKey,
    side: side.key,
    note: "Store this vault key. It is disclosed once and never again.",
  });
}

export async function GET() {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sidesTable)
    .where(sql`competitor_id is not null`);
  return Response.json({ ok: true, claimedSides: row?.count ?? 0 });
}
