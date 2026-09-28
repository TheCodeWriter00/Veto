/**
 * VETO — the crowd-weighted scoring engine.
 *
 * The core insight: convincing a small, hyper-critical crowd is difficult, so
 * each vote in a lesser audience is hyper-dense. Sweeping a mass audience is
 * easier, so each vote is diluted.
 *
 *   crowd factor  c(n) = sqrt(n / REFERENCE_CROWD)
 *   vote value    v(n) = round(BASE_VOTE_POINTS / c(n)) = round(BASE * sqrt(REF/n))
 *
 * With REFERENCE_CROWD = 100 and BASE_VOTE_POINTS = 100:
 *     1 vote   -> 1,000 points per vote   (clandestine, hyper-dense)
 *     4 votes  ->   500 points per vote
 *    25 votes  ->   200 points per vote
 *   100 votes  ->   100 points per vote   (the balanced chamber)
 *   10,000 votes ->  10 points per vote
 * 1,000,000 votes ->   1 point  per vote  (broadcast, diluted)
 *
 * Resolution rules:
 *   - Winner takes every vote they earned as direct points.
 *   - Loser is not wiped out: they keep the smaller pool they pulled.
 *   - Exact mathematical tie: both walk with their split points. No overtime.
 */

export const REFERENCE_CROWD = 100;
export const BASE_VOTE_POINTS = 100;
export const MAX_VOTE_POINTS = 1000;
export const MIN_VOTE_POINTS = 1;

export const PHASES = ["OPENING", "CROSS", "CLOSING", "VERDICT"] as const;
export type Phase = (typeof PHASES)[number];

export type SideKey = "A" | "B";

export type AudienceTier = {
  key: string;
  name: string;
  density: string;
  note: string;
};

const TIERS: { max: number; tier: AudienceTier }[] = [
  {
    max: 25,
    tier: {
      key: "clandestine",
      name: "CLANDESTINE",
      density: "HYPER-DENSE",
      note: "A handful of minds. Every vote carries maximum weight.",
    },
  },
  {
    max: 100,
    tier: {
      key: "narrow",
      name: "NARROW",
      density: "DENSE",
      note: "A narrow chamber of close readers. Votes stay expensive.",
    },
  },
  {
    max: 500,
    tier: {
      key: "open",
      name: "OPEN",
      density: "BALANCED",
      note: "The calibrated chamber. One vote is worth one baseline unit.",
    },
  },
  {
    max: 5000,
    tier: {
      key: "mass",
      name: "MASS",
      density: "DILUTED",
      note: "A broad room. Individual reasoning is diluted across thousands.",
    },
  },
  {
    max: Number.POSITIVE_INFINITY,
    tier: {
      key: "broadcast",
      name: "BROADCAST",
      density: "BROAD",
      note: "A sweep of the world. Volume replaces density.",
    },
  },
];

export const UNFORMED_TIER: AudienceTier = {
  key: "unformed",
  name: "UNFORMED",
  density: "—",
  note: "The chamber has not convened. No vote has been cast.",
};

export function audienceTier(n: number): AudienceTier {
  if (!Number.isFinite(n) || n <= 0) return UNFORMED_TIER;
  for (const step of TIERS) {
    if (n < step.max) return step.tier;
  }
  return TIERS[TIERS.length - 1].tier;
}

export const TIER_LADDER = TIERS.map((t) => ({
  tier: t.tier,
  upper: t.max,
}));

export function crowdFactor(n: number): number {
  const size = n <= 0 ? 1 : n;
  return Math.sqrt(size / REFERENCE_CROWD);
}

export function voteValue(n: number): number {
  const raw = BASE_VOTE_POINTS / crowdFactor(n);
  const clamped = Math.min(MAX_VOTE_POINTS, Math.max(MIN_VOTE_POINTS, raw));
  return Math.round(clamped);
}

export type Tally = {
  votesA: number;
  votesB: number;
  total: number;
  voteValue: number;
  pointsA: number;
  pointsB: number;
  tie: boolean;
  leader: SideKey | null;
  margin: number;
  /** margin as basis points of the whole chamber (0..10000) */
  marginShare: number;
  shareA: number;
  shareB: number;
  tier: AudienceTier;
};

export function computeTally(votesA: number, votesB: number): Tally {
  const a = Math.max(0, Math.floor(Number.isFinite(votesA) ? votesA : 0));
  const b = Math.max(0, Math.floor(Number.isFinite(votesB) ? votesB : 0));
  const total = a + b;
  const value = voteValue(total);
  const tie = total > 0 && a === b;
  const leader: SideKey | null = total === 0 || a === b ? null : a > b ? "A" : "B";
  const margin = Math.abs(a - b);
  return {
    votesA: a,
    votesB: b,
    total,
    voteValue: value,
    pointsA: a * value,
    pointsB: b * value,
    tie,
    leader,
    margin,
    marginShare: total === 0 ? 0 : Math.round((margin / total) * 10000),
    shareA: total === 0 ? 0.5 : a / total,
    shareB: total === 0 ? 0.5 : b / total,
    tier: audienceTier(total),
  };
}

export type Verdict = {
  winnerSide: SideKey | "TIE";
  pointsA: number;
  pointsB: number;
  voteValue: number;
  total: number;
  marginShare: number;
  tie: boolean;
};

export function resolveVerdict(votesA: number, votesB: number): Verdict {
  const t = computeTally(votesA, votesB);
  const winnerSide: SideKey | "TIE" = t.tie ? "TIE" : t.leader === "B" ? "B" : "A";
  return {
    winnerSide,
    pointsA: t.pointsA,
    pointsB: t.pointsB,
    voteValue: t.voteValue,
    total: t.total,
    marginShare: t.marginShare,
    tie: t.tie,
  };
}

export function outcomeFor(side: SideKey, verdict: Verdict): "WINNER" | "LOSER" | "TIE" {
  if (verdict.tie) return "TIE";
  return verdict.winnerSide === side ? "WINNER" : "LOSER";
}

const numberFormat = new Intl.NumberFormat("en-US");

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return numberFormat.format(Math.round(n));
}

export function formatShare(basisPoints: number, digits = 1): string {
  return `${((basisPoints / 10000) * 100).toFixed(digits)}%`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().replace("T", " ").slice(0, 16) + "Z";
}

/** Project points across a range of audience sizes — powers the calculator. */
export function projectionSeries(share: number, sizes: number[]) {
  return sizes.map((n) => {
    const t = computeTally(Math.round(n * share), n - Math.round(n * share));
    return { audience: n, voteValue: t.voteValue, totalPoints: t.pointsA + t.pointsB };
  });
}

export const DEFAULT_AUDIENCE_SCALE = [
  4, 6, 9, 14, 21, 32, 48, 70, 100, 150, 220, 320, 460, 680, 1000, 1500, 2200, 3200,
  4600, 6800, 10000, 15000, 22000, 32000, 46000, 68000, 100000, 220000, 460000, 1000000,
];
