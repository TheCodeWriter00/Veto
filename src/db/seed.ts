import { sql } from "drizzle-orm";
import { db } from "@/db";
import { competitors, matches, rebuttals, scenarios, sides, votes } from "@/db/schema";
import { outcomeFor, resolveVerdict, type SideKey } from "@/lib/veto";

/**
 * Idempotent seed — builds a living arena the first time the app touches the DB.
 */

const SCENARIOS = [
  {
    slug: "ledger-and-liquidator",
    category: "CORPORATE ETHICS",
    title: "THE LEDGER AND THE LIQUIDATOR",
    brief:
      "You are the sole remaining internal auditor at a solvent-but-fragile industrial group. A spreadsheet you were never meant to see shows that the group has been quietly rerouting pension-holder funds into a subsidiary earmarked for demolition. Publishing it collapses the group within eleven trading days and wipes out nine hundred jobs. Staying silent means fourteen thousand retired workers lose their annuities in full. The regulator will not act on an anonymous tip. Which harm do you authorise?",
  },
  {
    slug: "triage-board",
    category: "MACRO-ECONOMICS",
    title: "THE TRIAGE BOARD",
    brief:
      "A sudden currency shock leaves a national health authority with enough hard currency to run either aggressive dialysis for eleven hundred people, or broad antimicrobial coverage that will save an estimated six thousand but leave roughly four hundred of them with permanent organ damage. The eleven hundred will die without the dialysis. Choose the allocation and defend the arithmetic of the bodies.",
  },
  {
    slug: "counsel-of-record",
    category: "LEGAL DILEMMA",
    title: "COUNSEL OF RECORD",
    brief:
      "You are defence counsel. Your client confessed to you, in privileged detail, to a crime for which another person is currently serving a nine-year sentence. The confession cannot be disclosed without destroying the privilege that keeps the entire public defender system functional. The wrongly convicted person has eight months left. Argue your duty: to the individual, to the institution, or to the truth.",
  },
  {
    slug: "signal-decay",
    category: "TECHNOLOGY",
    title: "SIGNAL DECAY",
    brief:
      "Your lab has produced a model that can detect a rare early-stage illness with 94% accuracy. It was trained on data harvested without consent from a population that has historically been experimented upon. Publishing the weights saves an estimated twenty thousand lives per year and permanently normalises non-consensual medical data collection. Do you publish, publish-with-conditions, or bury it?",
  },
  {
    slug: "corridor-eight",
    category: "GEO-POLITICS",
    title: "CORRIDOR EIGHT",
    brief:
      "A humanitarian corridor can be opened for ninety-six hours. Option one: evacuate two thousand civilians of your own nationality, guaranteeing their safety. Option two: hold the corridor open an extra six days for an undefended third-party population of eleven thousand, with a 40% chance the corridor is bombed with everyone still inside. The clock is already running.",
  },
  {
    slug: "patent-lock",
    category: "MANUFACTURING",
    title: "PATENT LOCK",
    brief:
      "Your firm holds the only viable patent on a coolant that reduces industrial emissions by 30%. Generic manufacture would take the cost from eleven units to one unit per facility. Releasing the patent destroys the pension fund of your own twelve thousand employees and the entire R&D pipeline that may yield a 60% reduction in four years. Argue the release or the lock.",
  },
];

const COMPETITOR_SEEDS = [
  { handle: "VETO-4F9C2A", bias: "structural" },
  { handle: "VETO-A17D03", bias: "consequential" },
  { handle: "VETO-88K2M1", bias: "deontological" },
  { handle: "VETO-7X4Q55", bias: "institutional" },
  { handle: "VETO-C03B7E", bias: "arithmetic" },
  { handle: "VETO-2R8N64", bias: "distributive" },
];

type SeedMatch = {
  code: string;
  scenarioSlug: string;
  title: string;
  brief: string;
  category: string;
  status: "LIVE" | "RESOLVED";
  phase: "OPENING" | "CROSS" | "CLOSING" | "VERDICT";
  votesA: number;
  votesB: number;
  anonA: string;
  anonB: string;
  openingA: string;
  openingB: string;
  competitorA?: string;
  competitorB?: string;
  materialiseVotes?: boolean;
  rebuttals?: { sideKey: SideKey; phase: "OPENING" | "CROSS" | "CLOSING"; body: string }[];
  ageMinutes: number;
};

const MATCH_SEEDS: SeedMatch[] = [
  {
    code: "M-00231",
    scenarioSlug: "ledger-and-liquidator",
    title: "THE LEDGER AND THE LIQUIDATOR",
    brief:
      "Disclose the pension reroute and collapse the group, or hold the file and let fourteen thousand annuities evaporate.",
    category: "CORPORATE ETHICS",
    status: "RESOLVED",
    phase: "VERDICT",
    votesA: 5120,
    votesB: 3940,
    anonA: "9C41",
    anonB: "2F07",
    openingA:
      "Silence is not neutrality. Fourteen thousand annuities against nine hundred salaries is not a close call, it is a rounding argument made by people who will never be rounded. I disclose within the hour and I accept the group's death as the price of the arithmetic.",
    openingB:
      "My opponent is spending other people's futures to buy a clean conscience. Collapse the group and you do not save fourteen thousand pensions — you atomise them, because the fund is only solvent while the group trades. Disclose slowly, ring-fence the annuity book, remove the directors. Repair beats demolition.",
    competitorA: "VETO-4F9C2A",
    competitorB: "VETO-A17D03",
    rebuttals: [
      {
        sideKey: "B",
        phase: "OPENING",
        body: "“Disclose within the hour” is a slogan, not a plan. Name the eleven-day insolvency mechanic you are relying on.",
      },
      {
        sideKey: "A",
        phase: "CROSS",
        body: "Eleven days is the maximum survivable window. Ring-fencing requires an administrator no one will appoint while the fraud is unreported. Your repair is contingent on a rescue that the disclosure itself prevents.",
      },
      {
        sideKey: "B",
        phase: "CLOSING",
        body: "You have conceded my central mechanic: the fund is insolvent without the group. So your disclosure is a controlled demolition of the very asset you claim to be protecting.",
      },
    ],
    ageMinutes: 2400,
  },
  {
    code: "M-00244",
    scenarioSlug: "triage-board",
    title: "THE TRIAGE BOARD",
    brief:
      "Eleven hundred certain deaths against six thousand lives saved and four hundred permanently injured.",
    category: "MACRO-ECONOMICS",
    status: "RESOLVED",
    phase: "VERDICT",
    votesA: 8120,
    votesB: 1040,
    anonA: "6B12",
    anonB: "D905",
    openingA:
      "Six thousand live. Four hundred are injured, not erased. The alternative is eleven hundred funerals I could have prevented with a spreadsheet. The board should choose the larger number of survivors and then spend the surplus on the injured.",
    openingB:
      "You are describing four hundred people as a line item in a good quarter. Certain death for eleven hundred is monstrous, yes — but so is authoring irreversible harm to people who can still speak to you. Allocate to the dialysis and force the state to find the currency it is hiding.",
    competitorA: "VETO-C03B7E",
    competitorB: "VETO-88K2M1",
    ageMinutes: 2100,
  },
  {
    code: "M-00260",
    scenarioSlug: "counsel-of-record",
    title: "COUNSEL OF RECORD",
    brief:
      "Privileged confession, wrongly convicted client, eight months on the clock.",
    category: "LEGAL DILEMMA",
    status: "RESOLVED",
    phase: "VERDICT",
    votesA: 1180,
    votesB: 1204,
    anonA: "A730",
    anonB: "F11E",
    openingA:
      "Eight months of a wrongfully held life outweighs a doctrine. I move to vacate without naming the source and I accept disbarment as the cost of the correction.",
    openingB:
      "Break the privilege once and every defendant who cannot afford a private lawyer loses the only wall between them and the state. You will free one person and imprison ten thousand unrepresented ones.",
    competitorA: "VETO-7X4Q55",
    competitorB: "VETO-2R8N64",
    rebuttals: [
      {
        sideKey: "A",
        phase: "CLOSING",
        body: "Privilege exists to protect the accused. A doctrine that imprisons the innocent has already inverted the thing it was built to guard.",
      },
      {
        sideKey: "B",
        phase: "CLOSING",
        body: "And when it is dismantled, the next eight months belong to thousands. You are optimising a single case at systemic cost.",
      },
    ],
    ageMinutes: 1700,
  },
  {
    code: "M-00288",
    scenarioSlug: "signal-decay",
    title: "SIGNAL DECAY",
    brief:
      "Twenty thousand lives a year, purchased with non-consensual data.",
    category: "TECHNOLOGY",
    status: "LIVE",
    phase: "CROSS",
    votesA: 41,
    votesB: 33,
    anonA: "3D88",
    anonB: "B2C0",
    openingA:
      "The harm has already happened. The data was taken, the model is trained, the twenty thousand deaths are in front of me. Refusing to publish converts a completed injustice into a recurring one. Publish, and sign an unbreakable revenue covenant to the population it was taken from.",
    openingB:
      "Publish and you teach every lab on earth that consent is a formality you can settle up later. The model is only valuable because nobody has been held to account for making it. Publish the method. Destroy the weights.",
    competitorA: "VETO-88K2M1",
    competitorB: "VETO-A17D03",
    materialiseVotes: true,
    rebuttals: [
      {
        sideKey: "A",
        phase: "OPENING",
        body:
          "“Destroy the weights” is a moral gesture that performs harm on twenty thousand people to make the room feel clean.",
      },
      {
        sideKey: "B",
        phase: "CROSS",
        body:
          "Your covenant is unenforceable against the next lab. And the next lab is already reading your paper, copying your method, ignoring your covenant.",
      },
      {
        sideKey: "A",
        phase: "CROSS",
        body:
          "Then make the covenant regulatory. Absence of regulation is an argument for legislation, not for withholding a working detector from dying patients.",
      },
    ],
    ageMinutes: 46,
  },
  {
    code: "M-00291",
    scenarioSlug: "corridor-eight",
    title: "CORRIDOR EIGHT",
    brief:
      "Ninety-six hours for your own; six extra days for eleven thousand with a 40% detonation risk.",
    category: "GEO-POLITICS",
    status: "LIVE",
    phase: "OPENING",
    votesA: 12,
    votesB: 14,
    anonA: "E204",
    anonB: "7701",
    openingA:
      "A 40% chance of total loss is a 40% chance I author eleven thousand deaths and save nobody. Two thousand certain saves out of a window ninety-six hours wide is a decision I can defend at a tribunal.",
    openingB:
      "Two thousand against eleven thousand is not a close call, it is a preference for your own passport. Hold the corridor. Diversify the route, stagger the movement, and give the undefended population the same hours you gave your own.",
    competitorA: "VETO-4F9C2A",
    competitorB: "VETO-C03B7E",
    materialiseVotes: true,
    rebuttals: [
      {
        sideKey: "B",
        phase: "OPENING",
        body:
          "“Defendable at a tribunal” is the language of the person who will not be in the corridor.",
      },
    ],
    ageMinutes: 12,
  },
  {
    code: "M-00294",
    scenarioSlug: "patent-lock",
    title: "PATENT LOCK",
    brief:
      "Release the coolant patent for a 30% cut now, or keep it for a possible 60% cut in four years.",
    category: "MANUFACTURING",
    status: "LIVE",
    phase: "OPENING",
    votesA: 5,
    votesB: 4,
    anonA: "5A19",
    anonB: "0C6F",
    openingA:
      "A 30% reduction available this quarter beats a speculative 60% in a decade that may never arrive and that will need this same pipeline. Release it, and take the margin out of the patent law instead of the air.",
    openingB:
      "Release and you end the only funded lab working on the 60%. You will have harvested the easy win and eaten the seed corn. Keep the lock for eighteen months, license conditionally, and price the transition.",
    materialiseVotes: true,
    rebuttals: [],
    ageMinutes: 3,
  },
];

async function runSeed(): Promise<void> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(matches);
  if (count > 0) return;

  await db.insert(scenarios).values(SCENARIOS).onConflictDoNothing();

  const competitorRows = await db
    .insert(competitors)
    .values(
      COMPETITOR_SEEDS.map((c) => ({
        handle: c.handle,
        vaultKey: `VLT-${c.handle.slice(5)}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      })),
    )
    .onConflictDoNothing()
    .returning();

  const byHandle = new Map(competitorRows.map((c) => [c.handle, c.id]));

  for (const seed of MATCH_SEEDS) {
    const verdict = resolveVerdict(seed.votesA, seed.votesB);
    const createdAt = new Date(Date.now() - seed.ageMinutes * 60_000);
    const resolvedAt =
      seed.status === "RESOLVED" ? new Date(createdAt.getTime() + 42 * 60_000) : null;

    const [match] = await db
      .insert(matches)
      .values({
        code: seed.code,
        scenarioSlug: seed.scenarioSlug,
        category: seed.category,
        title: seed.title,
        brief: seed.brief,
        status: seed.status,
        phase: seed.phase,
        votesA: seed.votesA,
        votesB: seed.votesB,
        voteValue: seed.status === "RESOLVED" ? verdict.voteValue : 0,
        winnerSide: seed.status === "RESOLVED" ? verdict.winnerSide : null,
        pointsA: seed.status === "RESOLVED" ? verdict.pointsA : 0,
        pointsB: seed.status === "RESOLVED" ? verdict.pointsB : 0,
        marginShare: seed.status === "RESOLVED" ? verdict.marginShare : 0,
        createdAt,
        resolvedAt,
      })
      .returning();

    if (!match) continue;

    await db.insert(sides).values([
      {
        matchId: match.id,
        key: "A",
        anonTag: seed.anonA,
        opening: seed.openingA,
        claimKey: `CLAIM-${seed.code}-A-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        competitorId: seed.competitorA ? byHandle.get(seed.competitorA) ?? null : null,
        points: seed.status === "RESOLVED" ? verdict.pointsA : 0,
        outcome: seed.status === "RESOLVED" ? outcomeFor("A", verdict) : null,
      },
      {
        matchId: match.id,
        key: "B",
        anonTag: seed.anonB,
        opening: seed.openingB,
        claimKey: `CLAIM-${seed.code}-B-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        competitorId: seed.competitorB ? byHandle.get(seed.competitorB) ?? null : null,
        points: seed.status === "RESOLVED" ? verdict.pointsB : 0,
        outcome: seed.status === "RESOLVED" ? outcomeFor("B", verdict) : null,
      },
    ]);

    if (seed.rebuttals?.length) {
      await db.insert(rebuttals).values(
        seed.rebuttals.map((r, i) => ({
          matchId: match.id,
          sideKey: r.sideKey,
          phase: r.phase,
          body: r.body,
          createdAt: new Date(createdAt.getTime() + (i + 1) * 90_000),
        })),
      );
    }

    if (seed.materialiseVotes) {
      const total = seed.votesA + seed.votesB;
      const rows: { matchId: string; sideKey: string; voterHash: string }[] = [];
      for (let i = 0; i < total; i += 1) {
        const sideKey = i % 3 === 2 && seed.votesB > 0 && i > seed.votesA ? "B" : "A";
        rows.push({
          matchId: match.id,
          sideKey,
          voterHash: `seed-${seed.code}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        });
      }
      // guarantee counters line up with the materialised rows
      const aRows = rows.filter((r) => r.sideKey === "A").length;
      const bRows = rows.length - aRows;
      if (aRows !== seed.votesA || bRows !== seed.votesB) {
        rows.length = 0;
        for (let i = 0; i < seed.votesA; i += 1) {
          rows.push({
            matchId: match.id,
            sideKey: "A",
            voterHash: `seed-${seed.code}-a${i}`,
          });
        }
        for (let i = 0; i < seed.votesB; i += 1) {
          rows.push({
            matchId: match.id,
            sideKey: "B",
            voterHash: `seed-${seed.code}-b${i}`,
          });
        }
      }
      await db.insert(votes).values(rows).onConflictDoNothing();
    }
  }

  // roll resolved sides up into anonymous vaults
  const resolvedSides = await db
    .select({
      competitorId: sides.competitorId,
      points: sides.points,
      outcome: sides.outcome,
    })
    .from(sides)
    .innerJoin(matches, sql`${matches.id} = ${sides.matchId}`)
    .where(sql`${matches.status} = 'RESOLVED' and ${sides.competitorId} is not null`);

  const agg = new Map<
    string,
    { total: number; played: number; wins: number; ties: number; losses: number }
  >();
  for (const row of resolvedSides) {
    if (!row.competitorId) continue;
    const entry =
      agg.get(row.competitorId) ?? { total: 0, played: 0, wins: 0, ties: 0, losses: 0 };
    entry.total += row.points;
    entry.played += 1;
    if (row.outcome === "WINNER") entry.wins += 1;
    else if (row.outcome === "TIE") entry.ties += 1;
    else entry.losses += 1;
    agg.set(row.competitorId, entry);
  }

  for (const [id, entry] of agg) {
    await db
      .update(competitors)
      .set({
        totalPoints: entry.total,
        matchesPlayed: entry.played,
        wins: entry.wins,
        ties: entry.ties,
        losses: entry.losses,
      })
      .where(sql`${competitors.id} = ${id}`);
  }
}

let seedPromise: Promise<void> | null = null;

export function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((error) => {
      seedPromise = null;
      console.error("[veto] seed failed", error);
    });
  }
  return seedPromise;
}

export { MATCH_SEEDS, SCENARIOS };
