import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  competitors as competitorsTable,
  matches as matchesTable,
  rebuttals as rebuttalsTable,
  scenarios as scenariosTable,
  sides as sidesTable,
  votes as votesTable,
} from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { generateAnonTag, generateClaimKey, generateCode, isUuid } from "@/lib/ids";
import { computeTally, type Tally, type Verdict } from "@/lib/veto";
import type {
  ArenaStats,
  MatchDetail,
  MatchSummary,
  RebuttalView,
  ScenarioOption,
  SideView,
  StandingRow,
  VaultSnapshot,
  WireItem,
} from "@/lib/types";
import type { Competitor, Match, Rebuttal, Side } from "@/db/schema";

const ISO = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

function verdictFromMatch(match: Match): Verdict | null {
  if (match.status !== "RESOLVED") return null;
  return {
    winnerSide: (match.winnerSide as Verdict["winnerSide"]) ?? "TIE",
    pointsA: match.pointsA,
    pointsB: match.pointsB,
    voteValue: match.voteValue,
    total: match.votesA + match.votesB,
    marginShare: match.marginShare,
    tie: match.winnerSide === "TIE",
  };
}

function toSummary(match: Match, sideRows: Side[]): MatchSummary {
  return {
    id: match.id,
    code: match.code,
    title: match.title,
    brief: match.brief,
    category: match.category,
    status: match.status === "RESOLVED" ? "RESOLVED" : "LIVE",
    phase: match.phase,
    createdAt: ISO(match.createdAt) ?? new Date().toISOString(),
    resolvedAt: ISO(match.resolvedAt),
    tally: computeTally(match.votesA, match.votesB),
    sides: sideRows
      .slice()
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((s) => ({
        key: s.key === "B" ? "B" : "A",
        anonTag: s.anonTag,
        claimed: Boolean(s.competitorId),
        handle: null,
      })),
    verdict: verdictFromMatch(match),
  };
}

const EMPTY_TALLY: Tally = computeTally(0, 0);

export const FALLBACK_STATS: ArenaStats = {
  liveCount: 0,
  resolvedCount: 0,
  votesCast: 0,
  pointsInCirculation: 0,
  votesOnRecord: 0,
  densestChamber: 0,
  widestChamber: 0,
};

async function safe<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    await ensureSeeded();
    return await run();
  } catch (error) {
    console.error("[veto] query failed", error);
    return fallback;
  }
}

export async function getLiveMatches(): Promise<MatchSummary[]> {
  return safe(async () => {
    const rows = await db
      .select()
      .from(matchesTable)
      .where(eq(matchesTable.status, "LIVE"))
      .orderBy(desc(matchesTable.createdAt));
    if (rows.length === 0) return [];
    const sideRows = await db
      .select()
      .from(sidesTable)
      .where(
        sql`${sidesTable.matchId} in (${sql.join(
          rows.map((r) => sql`${r.id}::uuid`),
          sql`, `,
        )})`,
      );
    return rows.map((m) => toSummary(m, sideRows.filter((s) => s.matchId === m.id)));
  }, []);
}

export async function getResolvedMatches(limit = 12): Promise<MatchSummary[]> {
  return safe(async () => {
    const rows = await db
      .select()
      .from(matchesTable)
      .where(eq(matchesTable.status, "RESOLVED"))
      .orderBy(desc(matchesTable.resolvedAt))
      .limit(limit);
    if (rows.length === 0) return [];
    const sideRows = await db
      .select()
      .from(sidesTable)
      .where(
        sql`${sidesTable.matchId} in (${sql.join(
          rows.map((r) => sql`${r.id}::uuid`),
          sql`, `,
        )})`,
      );
    return rows.map((m) => toSummary(m, sideRows.filter((s) => s.matchId === m.id)));
  }, []);
}

export async function getMatchDetail(idOrCode: string): Promise<MatchDetail | null> {
  return safe(async () => {
    const rows = await db
      .select()
      .from(matchesTable)
      .where(
        isUuid(idOrCode)
          ? eq(matchesTable.id, idOrCode)
          : eq(matchesTable.code, idOrCode.toUpperCase()),
      )
      .limit(1);
    const match = rows[0];
    if (!match) return null;

    const [sideRows, rebuttalRows] = await Promise.all([
      db.select().from(sidesTable).where(eq(sidesTable.matchId, match.id)),
      db
        .select()
        .from(rebuttalsTable)
        .where(eq(rebuttalsTable.matchId, match.id))
        .orderBy(asc(rebuttalsTable.createdAt)),
    ]);

    const competitorIds = sideRows
      .map((s) => s.competitorId)
      .filter((v): v is string => Boolean(v));
    const handles = new Map<string, string>();
    if (competitorIds.length > 0) {
      const comps = await db
        .select({ id: competitorsTable.id, handle: competitorsTable.handle })
        .from(competitorsTable)
        .where(
          sql`${competitorsTable.id} in (${sql.join(
            competitorIds.map((c) => sql`${c}::uuid`),
            sql`, `,
          )})`,
        );
      for (const c of comps) handles.set(c.id, c.handle);
    }

    const summary = toSummary(match, sideRows);
    const sides: SideView[] = sideRows
      .slice()
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((s) => ({
        key: s.key === "B" ? "B" : "A",
        anonTag: s.anonTag,
        opening: s.opening,
        claimed: Boolean(s.competitorId),
        handle: s.competitorId ? handles.get(s.competitorId) ?? null : null,
        points: s.points,
        outcome: (s.outcome as SideView["outcome"]) ?? null,
      }));

    const rebuttals: RebuttalView[] = rebuttalRows.map((r: Rebuttal) => ({
      id: r.id,
      sideKey: r.sideKey === "B" ? "B" : "A",
      phase: r.phase,
      body: r.body,
      createdAt: ISO(r.createdAt) ?? new Date().toISOString(),
    }));

    return {
      ...summary,
      sides,
      rebuttals,
    };
  }, null);
}

export async function getStandings(limit = 25): Promise<StandingRow[]> {
  return safe(async () => {
    const rows = await db
      .select()
      .from(competitorsTable)
      .orderBy(desc(competitorsTable.totalPoints))
      .limit(limit);
    return rows.map((c: Competitor, i: number) => ({
      rank: i + 1,
      handle: c.handle,
      totalPoints: c.totalPoints,
      matchesPlayed: c.matchesPlayed,
      wins: c.wins,
      ties: c.ties,
      losses: c.losses,
    }));
  }, []);
}

export async function getWire(limit = 10): Promise<WireItem[]> {
  return safe(async () => {
    const rows = await db
      .select({
        id: rebuttalsTable.id,
        matchId: rebuttalsTable.matchId,
        sideKey: rebuttalsTable.sideKey,
        body: rebuttalsTable.body,
        createdAt: rebuttalsTable.createdAt,
        code: matchesTable.code,
        anonTag: sidesTable.anonTag,
      })
      .from(rebuttalsTable)
      .innerJoin(matchesTable, sql`${matchesTable.id} = ${rebuttalsTable.matchId}`)
      .innerJoin(
        sidesTable,
        sql`${sidesTable.matchId} = ${rebuttalsTable.matchId} and ${sidesTable.key} = ${rebuttalsTable.sideKey}`,
      )
      .orderBy(desc(rebuttalsTable.createdAt))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      matchId: r.matchId,
      code: r.code,
      sideKey: r.sideKey === "B" ? "B" : "A",
      anonTag: r.anonTag,
      body: r.body,
      createdAt: ISO(r.createdAt) ?? new Date().toISOString(),
    }));
  }, []);
}

export async function getArenaStats(): Promise<ArenaStats> {
  return safe(async () => {
    const [counts] = await db
      .select({
        live: sql<number>`count(*) filter (where status = 'LIVE')::int`,
        resolved: sql<number>`count(*) filter (where status = 'RESOLVED')::int`,
        votes: sql<number>`coalesce(sum(votes_a + votes_b), 0)::int`,
        awarded: sql<number>`coalesce(sum(case when status = 'RESOLVED' then points_a + points_b else 0 end), 0)::int`,
      })
      .from(matchesTable);

    const [voteRows] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(votesTable);

    const chambers = await db
      .select({ total: sql<number>`(votes_a + votes_b)::int` })
      .from(matchesTable);

    const totals = chambers
      .map((c) => c.total)
      .filter((n) => n > 0)
      .sort((a, b) => a - b);

    return {
      liveCount: counts?.live ?? 0,
      resolvedCount: counts?.resolved ?? 0,
      votesCast: counts?.votes ?? 0,
      pointsInCirculation: counts?.awarded ?? 0,
      votesOnRecord: voteRows?.c ?? 0,
      densestChamber: totals[0] ?? 0,
      widestChamber: totals[totals.length - 1] ?? 0,
    };
  }, FALLBACK_STATS);
}

export async function getScenarios(): Promise<ScenarioOption[]> {
  return safe(async () => {
    const rows = await db
      .select()
      .from(scenariosTable)
      .orderBy(asc(scenariosTable.category), asc(scenariosTable.title));
    return rows.map((s) => ({
      slug: s.slug,
      category: s.category,
      title: s.title,
      brief: s.brief,
    }));
  }, []);
}

export async function getVaultSnapshot(vaultKey: string): Promise<VaultSnapshot | null> {
  return safe(async () => {
    const [vault] = await db
      .select()
      .from(competitorsTable)
      .where(eq(competitorsTable.vaultKey, vaultKey.trim().toUpperCase()))
      .limit(1);
    if (!vault) return null;

    const rows = await db
      .select({
        matchId: sidesTable.matchId,
        sideKey: sidesTable.key,
        anonTag: sidesTable.anonTag,
        points: sidesTable.points,
        outcome: sidesTable.outcome,
        code: matchesTable.code,
        title: matchesTable.title,
        status: matchesTable.status,
        votesA: matchesTable.votesA,
        votesB: matchesTable.votesB,
        voteValue: matchesTable.voteValue,
      })
      .from(sidesTable)
      .innerJoin(matchesTable, sql`${matchesTable.id} = ${sidesTable.matchId}`)
      .where(eq(sidesTable.competitorId, vault.id))
      .orderBy(desc(matchesTable.createdAt));

    return {
      handle: vault.handle,
      totalPoints: vault.totalPoints,
      matchesPlayed: vault.matchesPlayed,
      wins: vault.wins,
      ties: vault.ties,
      losses: vault.losses,
      sides: rows.map((r) => {
        const sideKey = r.sideKey === "B" ? "B" : "A";
        const forVotes = sideKey === "A" ? r.votesA : r.votesB;
        const againstVotes = sideKey === "A" ? r.votesB : r.votesA;
        const tally = computeTally(r.votesA, r.votesB);
        return {
          matchId: r.matchId,
          code: r.code,
          title: r.title,
          status: r.status === "RESOLVED" ? "RESOLVED" : "LIVE",
          sideKey,
          anonTag: r.anonTag,
          points: r.points > 0 ? r.points : tally[sideKey === "A" ? "pointsA" : "pointsB"],
          outcome: (r.outcome as VaultSnapshot["sides"][number]["outcome"]) ?? null,
          votesFor: forVotes,
          votesAgainst: againstVotes,
          voteValue: r.status === "RESOLVED" ? r.voteValue : tally.voteValue,
        };
      }),
    };
  }, null);
}

export async function findMatchRow(idOrCode: string): Promise<Match | null> {
  try {
    const rows = await db
      .select()
      .from(matchesTable)
      .where(
        isUuid(idOrCode)
          ? eq(matchesTable.id, idOrCode)
          : eq(matchesTable.code, idOrCode.toUpperCase()),
      )
      .limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error("[veto] findMatchRow failed", error);
    return null;
  }
}

export type CreateMatchInput = {
  title: string;
  brief: string;
  category: string;
  scenarioSlug?: string;
  openingA: string;
  openingB: string;
  phase?: string;
};

export async function createMatch(
  input: CreateMatchInput,
): Promise<{ id: string; code: string; claimKeys: { A: string; B: string } } | null> {
  return safe(async () => {
    let inserted: Match | undefined;
    for (let attempt = 0; attempt < 5 && !inserted; attempt += 1) {
      const rows = await db
        .insert(matchesTable)
        .values({
          code: generateCode(),
          scenarioSlug: input.scenarioSlug ?? "",
          category: input.category || "OPEN",
          title: input.title,
          brief: input.brief,
          status: "LIVE",
          phase: input.phase ?? "OPENING",
        })
        .onConflictDoNothing({ target: matchesTable.code })
        .returning();
      inserted = rows[0];
    }
    if (!inserted) return null;

    const claimKeys = { A: generateClaimKey(), B: generateClaimKey() };
    await db.insert(sidesTable).values([
      {
        matchId: inserted.id,
        key: "A",
        anonTag: generateAnonTag(),
        opening: input.openingA,
        claimKey: claimKeys.A,
      },
      {
        matchId: inserted.id,
        key: "B",
        anonTag: generateAnonTag(),
        opening: input.openingB,
        claimKey: claimKeys.B,
      },
    ]);

    return { id: inserted.id, code: inserted.code, claimKeys };
  }, null);
}

export { EMPTY_TALLY };
