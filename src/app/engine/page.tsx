import Link from "next/link";
import { CrowdWeightCalculator } from "@/components/CrowdWeightCalculator";
import { Kicker, SectionHead } from "@/components/ui";
import { TIER_LADDER, computeTally, formatNumber, formatShare, voteValue } from "@/lib/veto";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "The Engine — VETO",
  description:
    "The Crowd-Weight Index: how Veto converts anonymous votes into points, and why a small chamber pays more.",
};

const SAMPLE = computeTally(27, 14);

const LADDER = TIER_LADDER.map(({ tier, upper }) => {
  const sample = Number.isFinite(upper) ? Math.max(1, Math.round(upper * 0.5)) : 1_000_000;
  return { tier, upper, sample, value: voteValue(sample), total: sample * voteValue(sample) };
});

const LAWS = [
  {
    n: "I",
    t: "THE WINNER TAKES EVERY VOTE THEY EARNED",
    b: "Direct points. No multiplier on top of the pool, no cascade from the loser's votes. The winning argument is paid exactly what the chamber actually handed it.",
  },
  {
    n: "II",
    t: "THE RUNNER IS NEVER WIPED OUT",
    b: "The losing side keeps points equal to the smaller pool it pulled. A minority argument that survived cross-examination still holds value — it just holds less of it.",
  },
  {
    n: "III",
    t: "DENSITY DECAYS WITH THE CROWD",
    b: "Every new mind in the room lowers the value of every existing vote. The chamber is priced continuously, not pooled at the end.",
  },
  {
    n: "IV",
    t: "EXACT TIES DISSOLVE THE ROOM",
    b: "A mathematically perfect split pays both sides their split points and ends the match. There is no overtime, no sudden vote, no adjudicator. The room simply dissolves.",
  },
  {
    n: "V",
    t: "IDENTITY IS NEVER AN INPUT",
    b: "Nothing in this formula reads a name. It reads a chamber size and two anonymous pools. There is no field in which popularity could be entered.",
  },
];

export default function EnginePage() {
  return (
    <div className="pb-10 pt-16">
      <Kicker>THE SCORING ENGINE</Kicker>
      <h1 className="mt-7 max-w-[28ch] text-[34px] leading-[1.02] tracking-[-0.035em] text-white sm:text-[52px]">
        The Crowd-Weight Index.
      </h1>
      <p className="mt-7 max-w-[78ch] text-[15px] leading-relaxed text-dim">
        Most competitive systems reward scale. Veto inverts it: the harder the room is to convince,
        the more a single convinced mind is worth. A chamber of four is hyper-dense — every vote
        carries the weight of everything that could have been said. A chamber of a million is a
        broadcast, and a broadcast pays in volume, not density.
      </p>

      {/* formula */}
      <section className="mt-16">
        <SectionHead
          index="01"
          title="The formula."
          note="Four terms. No hidden coefficients, no editorial weighting, no discretionary adjustment after the fact."
        />
        <div className="mt-6 panel glow-edge">
          <div className="grid gap-px border-b border-line bg-line md:grid-cols-3">
            {[
              { k: "n", v: "CHAMBER SIZE", d: "Distinct anonymous votes cast in the match." },
              { k: "c(n)", v: "CROWD FACTOR", d: "√(n / 100) — the sublinear dilution of a crowd." },
              { k: "v(n)", v: "POINT VALUE", d: "round(100 / c(n)), capped at 1,000 and floored at 1." },
            ].map((row) => (
              <div key={row.k} className="bg-carbon px-6 py-6">
                <span className="data text-[20px] text-white">{row.k}</span>
                <div className="label mt-4">{row.v}</div>
                <p className="mt-3 text-[12px] leading-relaxed text-mute">{row.d}</p>
              </div>
            ))}
          </div>

          <div className="p-6">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <span className="label">DERIVATION</span>
                <ol className="mt-5 space-y-4">
                  {[
                    "Fix a reference chamber of 100 voters. One vote in that room is worth 100 points — the baseline unit of argument.",
                    "Define the crowd factor as the square root of the chamber's size relative to the reference: c(n) = √(n / 100).",
                    "Divide the baseline by the crowd factor: v(n) = 100 / c(n) = 100 · √(100 / n). The value decays as the room grows.",
                    "Award each side its own pool multiplied by v(n), then settle the decision: higher pool wins outright, equal pools dissolve the room.",
                  ].map((step, index) => (
                    <li key={step} className="flex gap-4">
                      <span className="data shrink-0 text-[11px] text-mute">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[13px] leading-relaxed text-dim">{step}</span>
                    </li>
                  ))}
                </ol>

                <div className="mt-7 border border-line px-5 py-5">
                  <span className="label">WHY A SQUARE ROOT</span>
                  <p className="mt-4 text-[13px] leading-relaxed text-mute">
                    A linear decay would collapse too fast — a crowded match would pay almost
                    nothing and the form would reward empty rooms. A flat curve would erase the
                    advantage of a hard room entirely. The square root halves the crowd&apos;s
                    leverage: to halve the value of a vote you need to quadruple the audience. It is
                    steep enough to make a small room matter and gentle enough to keep a large one
                    playable.
                  </p>
                </div>
              </div>

              <div>
                <span className="label">IMPORTANT CONSEQUENCE</span>
                <p className="mt-5 text-[13px] leading-relaxed text-dim">
                  Density falls with crowd size, but the <span className="text-white">total points
                  available</span> still rises. Total = n · v(n) = 100 · √(100n). A large chamber
                  cannot make any single vote expensive, but it still distributes more points in
                  absolute terms.
                </p>
                <div className="mt-6 border border-line">
                  <div className="grid grid-cols-3 gap-px border-b border-line bg-line">
                    {["CHAMBER", "PTS / VOTE", "TOTAL POOL"].map((h) => (
                      <div key={h} className="bg-carbon px-4 py-3">
                        <span className="label">{h}</span>
                      </div>
                    ))}
                  </div>
                  {LADDER.map((row) => (
                    <div
                      key={row.tier.key}
                      className="grid grid-cols-3 gap-px border-b border-line bg-line last:border-b-0"
                    >
                      <div className="bg-black px-4 py-3">
                        <span className="data text-[12px] text-white">{formatNumber(row.sample)}</span>
                      </div>
                      <div className="bg-black px-4 py-3">
                        <span className="data text-[12px] text-white">{formatNumber(row.value)}</span>
                      </div>
                      <div className="bg-black px-4 py-3">
                        <span className="data text-[12px] text-dim">{formatNumber(row.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="label mt-4">
                  THE POINT OF THE DESIGN: A DENSE MINORITY ARGUMENT OUTSCORES A SHALLOW MAJORITY
                  SWEEP
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* worked example */}
      <section className="mt-16">
        <SectionHead
          index="02"
          title="A resolved chamber, worked out in full."
          note="Forty-one anonymous voters in the room. Side A pulled twenty-seven. Side B pulled fourteen. Nothing else is entered into the machine."
        />
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr_1fr]">
          <div className="border border-line p-6">
            <span className="label">STEP 1 · CROWD FACTOR</span>
            <div className="data mt-5 text-[15px] text-white">c(41) = √(41 / 100)</div>
            <div className="data mt-2 text-[15px] text-dim">c(41) = {Math.sqrt(41 / 100).toFixed(3)}</div>
            <p className="mt-5 text-[12px] leading-relaxed text-mute">
              A chamber of forty-one is smaller than the reference hundred, so the crowd factor drops
              below one. Fewer minds, more weight per mind.
            </p>
          </div>
          <div className="border border-line p-6">
            <span className="label">STEP 2 · POINT VALUE</span>
            <div className="data mt-5 text-[15px] text-white">
              v(41) = 100 / {Math.sqrt(41 / 100).toFixed(3)}
            </div>
            <div className="data mt-2 text-[28px] text-white">{SAMPLE.voteValue} PTS / VOTE</div>
            <p className="mt-5 text-[12px] leading-relaxed text-mute">
              Every single vote in this room is worth {SAMPLE.voteValue} points. A hundredth voter
              would have been worth {voteValue(42)}. The price moves with every arrival.
            </p>
          </div>
          <div className="border border-line p-6">
            <span className="label">STEP 3 · PAYOUT</span>
            <div className="data mt-5 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-dim">SIDE A · 27 × {SAMPLE.voteValue}</span>
                <span className="text-[15px] text-white">{formatNumber(SAMPLE.pointsA)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-dim">SIDE B · 14 × {SAMPLE.voteValue}</span>
                <span className="text-[15px] text-white">{formatNumber(SAMPLE.pointsB)}</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-2">
                <span className="text-[13px] text-dim">MARGIN</span>
                <span className="text-[15px] text-white">{formatShare(SAMPLE.marginShare)}</span>
              </div>
            </div>
            <p className="mt-5 text-[12px] leading-relaxed text-mute">
              Side A wins outright and keeps all {formatNumber(SAMPLE.pointsA)} points it earned.
              Side B is not wiped out: it holds {formatNumber(SAMPLE.pointsB)} points for the
              minority reasoning it defended.
            </p>
          </div>
        </div>
      </section>

      {/* ladder in full */}
      <section className="mt-16">
        <SectionHead
          index="03"
          title="The audience ladder."
          note="Five chamber classes. There is nothing between them — the class is a function of raw size, computed continuously and displayed for the room."
        />
        <div className="mt-6 border border-line">
          <div className="hidden grid-cols-[0.7fr_1fr_1fr_1.6fr_0.9fr] gap-4 border-b border-line px-5 py-4 md:grid">
            {["CLASS", "CHAMBER", "DENSITY", "WHAT IT MEANS", "PTS / VOTE"].map((h) => (
              <span key={h} className="label">
                {h}
              </span>
            ))}
          </div>
          {LADDER.map((row) => (
            <div
              key={row.tier.key}
              className="grid gap-3 border-b border-line px-5 py-5 last:border-b-0 md:grid-cols-[0.7fr_1fr_1fr_1.6fr_0.9fr] md:gap-4"
            >
              <span className="label-bright">{row.tier.name}</span>
              <span className="data text-[12px] text-dim">
                {Number.isFinite(row.upper)
                  ? `UNDER ${formatNumber(row.upper)}`
                  : `${formatNumber(5000)}+`}
              </span>
              <span className="label">{row.tier.density}</span>
              <span className="text-[12px] leading-relaxed text-mute">{row.tier.note}</span>
              <span className="data text-[13px] text-white">{formatNumber(row.value)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* laws */}
      <section className="mt-16">
        <SectionHead index="04" title="The five laws of resolution." />
        <div className="mt-6 grid gap-px border border-line bg-line lg:grid-cols-2 xl:grid-cols-3">
          {LAWS.map((law) => (
            <div key={law.n} className="bg-black p-6">
              <span className="data text-[11px] tracking-[0.3em] text-mute">{law.n}</span>
              <h3 className="label-bright mt-6 leading-relaxed">{law.t}</h3>
              <p className="mt-4 text-[13px] leading-relaxed text-mute">{law.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* calculator */}
      <section className="mt-16">
        <SectionHead
          index="05"
          title="Interrogate the machine yourself."
          note="Move the chamber. Move the split. Nothing is hidden — the same function that pays out is the same function on this screen."
        />
        <div className="mt-6">
          <CrowdWeightCalculator />
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/arena" className="btn-solid px-5 py-3.5">
            PUT IT TO A CHAMBER →
          </Link>
          <Link
            href="/standings"
            className="label-bright border border-line px-5 py-3.5 text-dim transition-colors hover:border-line-strong hover:text-white"
          >
            ANONYMOUS STANDINGS
          </Link>
        </div>
      </section>
    </div>
  );
}
