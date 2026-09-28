import type { SideKey, Tally, Verdict } from "@/lib/veto";

/** Shared view models — safe to import from client components. */

export type SideView = {
  key: SideKey;
  anonTag: string;
  opening: string;
  claimed: boolean;
  handle: string | null;
  points: number;
  outcome: "WINNER" | "LOSER" | "TIE" | null;
};

export type RebuttalView = {
  id: string;
  sideKey: SideKey;
  phase: string;
  body: string;
  createdAt: string;
};

export type MatchSummary = {
  id: string;
  code: string;
  title: string;
  brief: string;
  category: string;
  status: "LIVE" | "RESOLVED";
  phase: string;
  createdAt: string;
  resolvedAt: string | null;
  tally: Tally;
  sides: { key: SideKey; anonTag: string; claimed: boolean; handle: string | null }[];
  verdict: Verdict | null;
};

export type MatchDetail = Omit<MatchSummary, "sides"> & {
  sides: SideView[];
  rebuttals: RebuttalView[];
};

export type WireItem = {
  id: string;
  matchId: string;
  code: string;
  sideKey: SideKey;
  anonTag: string;
  body: string;
  createdAt: string;
};

export type StandingRow = {
  rank: number;
  handle: string;
  totalPoints: number;
  matchesPlayed: number;
  wins: number;
  ties: number;
  losses: number;
};

export type ArenaStats = {
  liveCount: number;
  resolvedCount: number;
  votesCast: number;
  pointsInCirculation: number;
  votesOnRecord: number;
  densestChamber: number;
  widestChamber: number;
};

export type VaultSide = {
  matchId: string;
  code: string;
  title: string;
  status: "LIVE" | "RESOLVED";
  sideKey: SideKey;
  anonTag: string;
  points: number;
  outcome: "WINNER" | "LOSER" | "TIE" | null;
  votesFor: number;
  votesAgainst: number;
  voteValue: number;
};

export type VaultSnapshot = {
  handle: string;
  totalPoints: number;
  matchesPlayed: number;
  wins: number;
  ties: number;
  losses: number;
  sides: VaultSide[];
};

export type ScenarioOption = {
  slug: string;
  category: string;
  title: string;
  brief: string;
};
