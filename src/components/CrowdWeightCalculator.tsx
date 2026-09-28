"use client";

import { useMemo, useState } from "react";
import {
  REFERENCE_CROWD,
  TIER_LADDER,
  computeTally,
  formatNumber,
  formatShare,
  voteValue,
} from "@/lib/veto";

const PRESETS = [3, 12, 41, 100, 480, 2400, 18000, 240000, 1000000];

function toPosition(n: number, max: number): number {
  const clamped = Math.max(1, Math.min(max, n));
  return (Math.log10(clamped) / Math.log10(max)) * 100;
}

export function CrowdWeightCalculator({ compact = false }: { compact?: boolean }) {
  const [audience, setAudience] = useState(41);
  const [shareA, setShareA] = useState(58);

  const model = useMemo(() => {
    const votesA = Math.round((audience * shareA) / 100);
    const votesB = audience - votesA;
    const tally = computeTally(votesA, votesB);
    return { votesA, votesB, tally };
  }, [audience, shareA]);

  const { tally } = model;

  const curve = useMemo(() => {
    const samples: { n: number; v: number }[] = [];
    for (let i = 0; i <= 120; i += 1) {
      const n = Math.round(10 ** (i / 20));
      samples.push({ n, v: voteValue(n) });
    }
    return samples;
  }, []);

  const marker = toPosition(tally.total || 1, 1_000_000);

  return (
    <div className="panel glow-edge">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="label-bright">CROWD-WEIGHT INDEX</span>
          <span className="label hidden sm:inline">v(n) = 100 · √(100 / n)</span>
        </div>
        <span className="label">REFERENCE CHAMBER {REFERENCE_CROWD} VOTERS = 100 PTS / VOTE</span>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.15fr_1fr]">
        {/* left: controls + readout */}
        <div className="border-line p-5 lg:border-r">
          <div className="flex items-end justify-between">
            <div>
              <span className="label">CHAMBER SIZE</span>
              <div className="data mt-2 text-4xl leading-none text-white sm:text-5xl">
                {formatNumber(audience)}
              </div>
            </div>
            <div className="text-right">
              <span className="label">POINTS PER VOTE</span>
              <div className="data mt-2 text-4xl leading-none text-white sm:text-5xl">
                {formatNumber(tally.voteValue)}
              </div>
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(toPosition(audience, 1_000_000) * 10)}
            onChange={(event) => {
              const pos = Number(event.target.value) / 10;
              const next = Math.round(10 ** ((pos / 100) * 6));
              setAudience(Math.max(1, next));
            }}
            aria-label="Chamber size"
            className="mt-6 h-1 w-full appearance-none bg-white/15 accent-white"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAudience(preset)}
                className={`data border px-2.5 py-1.5 text-[10px] tracking-[0.18em] transition-colors ${
                  audience === preset
                    ? "border-white bg-white text-black"
                    : "border-line text-dim hover:border-line-strong hover:text-white"
                }`}
              >
                {formatNumber(preset)}
              </button>
            ))}
          </div>

          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between">
              <span className="label">
                SPLIT · A {model.votesA} / B {model.votesB}
              </span>
              <span className="data text-[11px] text-dim">{shareA}% / {100 - shareA}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={shareA}
              onChange={(event) => setShareA(Number(event.target.value))}
              aria-label="Vote split"
              className="h-1 w-full appearance-none bg-white/15 accent-white"
            />
          </div>

          <div className="mt-8 grid grid-cols-2 gap-px border border-line bg-line">
            <Cell label="CHAMBER CLASS" value={tally.tier.name} hint={tally.tier.density} />
            <Cell
              label="DECISION"
              value={
                tally.total === 0
                  ? "—"
                  : tally.tie
                    ? "EXACT TIE"
                    : `SIDE ${tally.leader}`
              }
              hint={tally.tie ? "SPLIT POINTS, ROOM DISSOLVES" : `MARGIN ${formatShare(tally.marginShare)}`}
            />
            <Cell
              label="WINNER'S TAKE"
              value={formatNumber(Math.max(tally.pointsA, tally.pointsB))}
              hint="ALL VOTES EARNED, PAID DIRECT"
            />
            <Cell
              label="RUNNER'S KEEP"
              value={formatNumber(Math.min(tally.pointsA, tally.pointsB))}
              hint="SMALLER POOL, NOT WIPED OUT"
            />
          </div>

          <p className="mt-5 border-l border-line-strong pl-4 text-[13px] leading-relaxed text-mute">
            {tally.tier.note}
          </p>
        </div>

        {/* right: curve + ladder */}
        <div className="p-5">
          <span className="label">POINT VALUE DECAY ACROSS THE AUDIENCE LOG</span>

          <div className="relative mt-6 h-[132px] w-full">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
              {[25, 50, 75].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="0.4"
                />
              ))}
              <polyline
                points={curve
                  .map((point) => {
                    const x = toPosition(point.n, 1_000_000);
                    const y = 100 - (Math.log10(point.v) / Math.log10(1000)) * 100;
                    return `${x},${Math.max(2, Math.min(98, y))}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="#ffffff"
                strokeWidth="0.9"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={marker}
                y1="0"
                x2={marker}
                y2="100"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="0.4"
                strokeDasharray="2 2"
              />
            </svg>
            <div
              className="absolute top-0 h-full w-[6px] -translate-x-1/2 bg-white"
              style={{ left: `${marker}%`, opacity: 0.9 }}
              aria-hidden
            />
          </div>

          <div className="mt-2 flex justify-between">
            <span className="label">1</span>
            <span className="label">1M VOTERS</span>
          </div>

          {!compact ? (
            <div className="mt-7">
              <span className="label">THE LADDER</span>
              <div className="mt-4 space-y-px">
                {TIER_LADDER.map(({ tier, upper }) => {
                  const active = tier.key === tally.tier.key;
                  const sample = Number.isFinite(upper) ? Math.max(1, Math.round(upper * 0.5)) : 1_000_000;
                  return (
                    <div
                      key={tier.key}
                      className={`flex items-center justify-between gap-3 border px-3 py-2.5 transition-colors ${
                        active
                          ? "border-white/70 bg-white/[0.06]"
                          : "border-line hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex min-w-0 items-baseline gap-3">
                        <span className="data w-16 shrink-0 text-[10px] tracking-[0.2em] text-dim">
                          {formatNumber(sample)}
                        </span>
                        <span className="label-bright truncate">{tier.name}</span>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <span className="label hidden sm:inline">{tier.density}</span>
                        <span className="data text-[12px] text-white">
                          {formatNumber(voteValue(sample))}
                          <span className="text-mute"> /VOTE</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-carbon px-4 py-4">
      <span className="label">{label}</span>
      <div className="data mt-3 truncate text-xl text-white">{value}</div>
      <div className="label mt-2 leading-relaxed">{hint}</div>
    </div>
  );
}
