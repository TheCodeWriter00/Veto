import Link from "next/link";
import { CrowdWeightCalculator } from "@/components/CrowdWeightCalculator";
import { LogoGlyph, PrecisionReticle } from "@/components/Logo";
import { MatchCard } from "@/components/MatchCard";
import { LiveWire } from "@/components/LiveWire";
import { Kicker, SectionHead, StatBlock } from "@/components/ui";
import { getArenaStats, getLiveMatches, getResolvedMatches, getWire } from "@/lib/data";
import { formatNumber } from "@/lib/veto";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [live, resolved, stats, wire] = await Promise.all([
    getLiveMatches(),
    getResolvedMatches(4),
    getArenaStats(),
    getWire(8),
  ]);

  return (
    <div className="pb-10">
      {/* ── hero ──────────────────────────────────────────────── */}
      <section className="relative pt-16 sm:pt-24">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <div>
            <Kicker>ANONYMOUS ETHICAL ARENA · STANDARD V</Kicker>
            <h1 className="mt-8 text-[40px] leading-[0.98] tracking-[-0.04em] text-white sm:text-[64px] lg:text-[72px]">
              Two sides.
              <br />
              No names.
              <br />
              <span className="text-mute">No appeal.</span>
            </h1>
            <p className="mt-8 max-w-[58ch] text-[15px] leading-relaxed text-dim">
              Veto drops two unidentified sides onto a digital stage to clash over one genuinely
              difficult decision — a corporate whistleblowing ethics crisis, a macro-economic
              allocation with no clean answer, a legal dilemma where every route is a wound. A side
              may be a lone advocate or a closed collective, and the chamber cannot tell which.
              Nobody in the room knows who anyone is. The audience watches the logic unfold live and
              votes on reasoning alone.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="/arena" className="btn-solid px-6 py-4">
                ENTER THE ARENA →
              </Link>
              <Link
                href="/engine"
                className="label-bright border border-line px-6 py-4 text-dim transition-colors hover:border-line-strong hover:text-white"
              >
                READ THE SCORING ENGINE
              </Link>
            </div>

            <div className="mt-12 grid max-w-[560px] grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
              {[
                { label: "LIVE CHAMBERS", value: formatNumber(stats.liveCount) },
                { label: "VOTES ON RECORD", value: formatNumber(stats.votesOnRecord) },
                { label: "POINTS IN CIRCULATION", value: formatNumber(stats.pointsInCirculation) },
                { label: "NARROWEST CHAMBER", value: formatNumber(stats.densestChamber) },
              ].map((item) => (
                <div key={item.label} className="bg-black px-4 py-4">
                  <span className="label">{item.label}</span>
                  <div className="data mt-3 text-[18px] leading-none text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* emblem card */}
          <div className="panel glow-edge flex flex-col justify-between p-8">
            <div className="flex items-start justify-between">
              <PrecisionReticle size={132} />
              <span className="label text-right">
                MARK NO. 005
                <br />
                ZEROED · UNBIASED
              </span>
            </div>

            <div className="mt-16">
              <span className="label">THE LAW OF THE ROOM</span>
              <p className="mt-5 text-[17px] leading-relaxed text-white">
                Convincing a small, hyper-critical crowd is hard. Convincing a hundred thousand is
                easy. So the math refuses to treat them the same.
              </p>
              <div className="mt-7 space-y-3">
                {[
                  ["CHAMBER OF 4", "1,000 PTS / VOTE"],
                  ["CHAMBER OF 41", `${formatNumber(Math.round(100 / Math.sqrt(41 / 100)))} PTS / VOTE`],
                  ["CHAMBER OF 100", "100 PTS / VOTE"],
                  ["CHAMBER OF 10,000", "10 PTS / VOTE"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-baseline justify-between border-b border-line pb-2.5"
                  >
                    <span className="label">{k}</span>
                    <span className="data text-[12px] text-white">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── wire ─────────────────────────────────────────────── */}
      <section className="mt-20">
        <LiveWire items={wire} />
      </section>

      {/* ── engine ───────────────────────────────────────────── */}
      <section className="mt-20">
        <SectionHead
          index="01"
          title="The scoring engine, in the open."
          note="Drag the chamber size. Watch what a single vote is worth when the room is small — and what it collapses to when the room is the world."
          action={
            <Link href="/engine" className="label-bright border border-line px-4 py-3 transition-colors hover:border-line-strong">
              FULL DERIVATION →
            </Link>
          }
        />
        <div className="mt-6">
          <CrowdWeightCalculator />
        </div>
      </section>

      {/* ── live chambers ────────────────────────────────────── */}
      <section className="mt-20">
        <SectionHead
          index="02"
          title="Chambers in session."
          note="Anonymous sides. Live tallies. Reasoning accruing in public while the vote value decays with every new mind in the room."
          action={
            <Link href="/arena" className="label-bright border border-line px-4 py-3 transition-colors hover:border-line-strong">
              ALL CHAMBERS →
            </Link>
          }
        />
        {live.length === 0 ? (
          <p className="mt-8 text-[13px] text-mute">
            No live chamber right now.{" "}
            <Link href="/arena/new" className="text-white underline underline-offset-4">
              Convene one
            </Link>
            .
          </p>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {live.slice(0, 3).map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>

      {/* ── resolved ─────────────────────────────────────────── */}
      <section className="mt-20">
        <SectionHead
          index="03"
          title="Closed records."
          note="When a chamber dissolves, the payouts are frozen at the point value in force at that instant. The record is final."
          action={
            <Link href="/standings" className="label-bright border border-line px-4 py-3 transition-colors hover:border-line-strong">
              STANDINGS →
            </Link>
          }
        />
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {resolved.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </section>

      {/* ── lifecycle ────────────────────────────────────────── */}
      <section className="mt-20">
        <SectionHead index="04" title="How a match runs." note="No overtime. No rematch. No decorum." />
        <div className="mt-6 grid gap-px border border-line bg-line lg:grid-cols-4">
          {[
            {
              step: "01",
              title: "CONVENE",
              body: "A dossier is written and two sealed keys are minted. Each side receives one. Neither knows the other, and neither knows the chamber.",
            },
            {
              step: "02",
              title: "ARGUE",
              body: "Openings land simultaneously. Cross-examination follows, then closings. Every statement is reasoning and nothing else.",
            },
            {
              step: "03",
              title: "VOTE",
              body: "The chamber reads live and casts one anonymous vote each. Every vote is a hash. There is no profile to attach it to.",
            },
            {
              step: "04",
              title: "DISSOLVE",
              body: "The room closes. Winner takes all votes earned; the runner keeps the smaller pool. Exact tie: split points and dissolvement.",
            },
          ].map((item) => (
            <div key={item.step} className="bg-black p-6">
              <span className="data text-[11px] tracking-[0.3em] text-mute">{item.step}</span>
              <h3 className="label-bright mt-7">{item.title}</h3>
              <p className="mt-4 text-[13px] leading-relaxed text-mute">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── cta ──────────────────────────────────────────────── */}
      <section className="mt-20 border border-line px-6 py-14 text-center sm:px-16">
        <div className="flex justify-center">
          <LogoGlyph size={44} />
        </div>
        <h2 className="mx-auto mt-9 max-w-[24ch] text-[30px] leading-[1.05] tracking-[-0.03em] text-white sm:text-[42px]">
          Bring a decision nobody can settle.
        </h2>
        <p className="mx-auto mt-6 max-w-[62ch] text-[14px] leading-relaxed text-dim">
          Write the dossier, mint two sealed keys, and hand one to each side. The chamber will decide
          what the institutions could not — on the strength of the argument, and nothing else.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Link href="/arena/new" className="btn-solid px-6 py-4">
            CONVENE A MATCH
          </Link>
          <Link
            href="/vault"
            className="label-bright border border-line px-6 py-4 text-dim transition-colors hover:border-line-strong hover:text-white"
          >
            CLAIM A VAULT
          </Link>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-10">
          <StatBlock label="RESOLVED CHAMBERS" value={formatNumber(stats.resolvedCount)} />
          <StatBlock label="POINTS AWARDED" value={formatNumber(stats.pointsInCirculation)} />
          <StatBlock label="WIDEST CHAMBER" value={formatNumber(stats.widestChamber)} />
        </div>
      </section>
    </div>
  );
}
