import Link from "next/link";
import { MatchCard } from "@/components/MatchCard";
import { Kicker, SectionHead } from "@/components/ui";
import { getArenaStats, getLiveMatches, getResolvedMatches } from "@/lib/data";
import { formatNumber } from "@/lib/veto";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Arena — VETO",
  description: "Live anonymous chambers and closed records.",
};

export default async function ArenaPage() {
  const [live, resolved, stats] = await Promise.all([
    getLiveMatches(),
    getResolvedMatches(18),
    getArenaStats(),
  ]);

  return (
    <div className="pb-10 pt-16">
      <Kicker>ARENA</Kicker>
      <h1 className="mt-7 max-w-[26ch] text-[34px] leading-[1.02] tracking-[-0.035em] text-white sm:text-[50px]">
        Every chamber currently open, and every room that already dissolved.
      </h1>
      <p className="mt-7 max-w-[72ch] text-[15px] leading-relaxed text-dim">
        Two unidentified sides — each one a lone advocate or a closed collective, and the room cannot
        tell which — clash over a single irreconcilable decision. Read the reasoning, then cast one
        anonymous vote. The value of that vote is set by how few of you are in the room: the smaller
        the chamber, the denser every reason becomes.
      </p>

      <div className="mt-12 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
        {[
          { label: "LIVE", value: formatNumber(stats.liveCount) },
          { label: "RESOLVED", value: formatNumber(stats.resolvedCount) },
          { label: "VOTES CAST", value: formatNumber(stats.votesCast) },
          { label: "POINTS AWARDED", value: formatNumber(stats.pointsInCirculation) },
        ].map((item) => (
          <div key={item.label} className="bg-black px-5 py-5">
            <span className="label">{item.label}</span>
            <div className="data mt-3 text-[22px] leading-none text-white">{item.value}</div>
          </div>
        ))}
      </div>

      <section className="mt-16">
        <SectionHead
          index="01"
          title="Open chambers."
          note="Live tallies update as the chamber reads. Voting is one mind, one vote, no identity recorded."
          action={
            <Link
              href="/arena/new"
              className="label-bright border border-line px-4 py-3 transition-colors hover:border-line-strong"
            >
              CONVENE →
            </Link>
          }
        />
        {live.length === 0 ? (
          <p className="mt-8 text-[13px] text-mute">
            Nothing on the stage. The arena is quiet — convene a match and let the room speak.
          </p>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {live.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-16">
        <SectionHead
          index="02"
          title="Closed records."
          note="Dated, sealed, and priced at the point value in force when the room dissolved."
        />
        {resolved.length === 0 ? (
          <p className="mt-8 text-[13px] text-mute">No chamber has dissolved yet.</p>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {resolved.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
