import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * VETO — data model.
 *
 * Everything is designed around one principle: identity never travels with a
 * performance. Competitors are anonymous vaults, sides are anonymous tags, and
 * a vote is a hash. Only reasoning is public.
 */

export const scenarios = pgTable("scenarios", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  brief: text("brief").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const competitors = pgTable("competitors", {
  id: uuid("id").defaultRandom().primaryKey(),
  handle: text("handle").notNull().unique(),
  vaultKey: text("vault_key").notNull().unique(),
  totalPoints: integer("total_points").notNull().default(0),
  matchesPlayed: integer("matches_played").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  ties: integer("ties").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),
    scenarioSlug: text("scenario_slug").notNull().default(""),
    category: text("category").notNull().default("GENERAL"),
    title: text("title").notNull(),
    brief: text("brief").notNull(),
    /** LIVE | RESOLVED */
    status: text("status").notNull().default("LIVE"),
    /** OPENING | CROSS | CLOSING | VERDICT */
    phase: text("phase").notNull().default("OPENING"),
    votesA: integer("votes_a").notNull().default(0),
    votesB: integer("votes_b").notNull().default(0),
    /** point value per vote locked at resolution */
    voteValue: integer("vote_value").notNull().default(0),
    /** A | B | TIE */
    winnerSide: text("winner_side"),
    pointsA: integer("points_a").notNull().default(0),
    pointsB: integer("points_b").notNull().default(0),
    /** margin as basis points of the chamber (0..10000) */
    marginShare: integer("margin_share").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [index("matches_status_idx").on(t.status)],
);

export const sides = pgTable(
  "sides",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    /** A | B */
    key: text("key").notNull(),
    /** anonymous serial shown to the chamber, e.g. "9C41" */
    anonTag: text("anon_tag").notNull(),
    opening: text("opening").notNull(),
    /** secret key used by the anonymous competitor to enter the room */
    claimKey: text("claim_key").notNull().unique(),
    competitorId: uuid("competitor_id").references(() => competitors.id, {
      onDelete: "set null",
    }),
    points: integer("points").notNull().default(0),
    /** WINNER | LOSER | TIE */
    outcome: text("outcome"),
  },
  (t) => [uniqueIndex("sides_match_key_idx").on(t.matchId, t.key)],
);

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    /** A | B */
    sideKey: text("side_key").notNull(),
    /** sha-256(matchId:voterToken) — a vote, never a person */
    voterHash: text("voter_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("votes_match_voter_idx").on(t.matchId, t.voterHash)],
);

export const rebuttals = pgTable(
  "rebuttals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    /** A | B */
    sideKey: text("side_key").notNull(),
    phase: text("phase").notNull().default("OPENING"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("rebuttals_match_idx").on(t.matchId)],
);

export type Scenario = typeof scenarios.$inferSelect;
export type Competitor = typeof competitors.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Side = typeof sides.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type Rebuttal = typeof rebuttals.$inferSelect;
