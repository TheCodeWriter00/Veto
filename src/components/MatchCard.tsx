import Link from "next/link";
import { formatNumber, formatShare } from "@/lib/veto";
import type { MatchSummary } from "@/lib/types";

export function MatchCard({ match }: { match: MatchSummary }) {
  const { tally, verdict } = match;
  const resolved = match.status === "RESOLVED";
  const shareA = tally.total ? tally.shareA * 100 : 50;
  const shareB = tally.total ? tally.shareB * 100 : 50;

  return (
    <Link
      href={`/arena/${match.id}`}
      className="panel glow-edge group flex flex-col transition-colors hover:border-line-strong"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="data text-[11px] tracking-[0.26em] text-white">{match.code}</span>
          <span className="label truncate">{match.category}</span>
        </div>
        {resolved ? (
          <span className="label-bright">DISSOLVED</span>
        ) : (
          <span className="flex items-center gap-2">
            <span className="live-dot h-1.5 w-1.5 bg-white" aria-hidden />
            <span className="label-bright">LIVE</span>
          </span>
        )}
      </div>

      <div className="flex-1 px-5 py-5">
        <h3 className="data text-[14px] leading-snug text-white">{match.title}</h3>
        <p className="mt-3 line-clamp-3 text-[12px] leading-relaxed text-mute">{match.brief}</p>
      </div>

      <div className="px-5">
        <div className="flex h-2 w-full gap-px overflow-hidden bg-line">
          <div
            className="h-full bg-white transition-all"
            style={{ width: `${Math.max(1, shareA)}%`, opacity: tally.total ? 1 : 0.2 }}
          />
          <div
            className="h-full bg-white transition-all"
            style={{ width: `${Math.max(1, shareB)}%`, opacity: tally.total ? 0.45 : 0.2 }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-px border-t border-line bg-line">
        <Cell label="CHAMBER" value={formatNumber(tally.total)} />
        <Cell
          label="PTS / VOTE"
          value={resolved ? formatNumber(verdict?.voteValue ?? 0) : formatNumber(tally.voteValue)}
        />
        <Cell
          label={resolved ? "WINNER TAKE" : "LEADER"}
          value={
            resolved && verdict
              ? formatNumber(Math.max(verdict.pointsA, verdict.pointsB))
              : tally.leader
                ? `SIDE ${tally.leader}`
                : "—"
          }
        />
      </div>

      <div className="flex items-center justify-between border-t border-line px-5 py-3.5">
        <span className="label">{tally.tier.name} · {tally.tier.density}</span>
        <span className="label">
          {resolved ? `MARGIN ${formatShare(verdict?.marginShare ?? 0)}` : `${match.sides.length} SIDES ANON`}
        </span>
      </div>
    </Link>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-carbon px-4 py-3">
      <span className="label">{label}</span>
      <div className="data mt-2 truncate text-[13px] text-white">{value}</div>
    </div>
  );
}
