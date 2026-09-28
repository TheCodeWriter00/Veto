import Link from "next/link";
import type { WireItem } from "@/lib/types";

export function LiveWire({ items }: { items: WireItem[] }) {
  if (items.length === 0) {
    return (
      <div className="panel flex items-center gap-4 px-5 py-4">
        <span className="label-bright">WIRE</span>
        <span className="label">NO STATEMENTS ON RECORD</span>
      </div>
    );
  }

  const doubled = [...items, ...items];

  return (
    <div className="panel relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center bg-[#060607] px-5">
        <span className="flex items-center gap-2">
          <span className="live-dot h-1.5 w-1.5 bg-white" aria-hidden />
          <span className="label-bright">WIRE</span>
        </span>
      </div>
      <div className="flex w-max marquee-track">
        {doubled.map((item, index) => (
          <Link
            key={`${item.id}-${index}`}
            href={`/arena/${item.matchId}`}
            className="flex items-baseline gap-3 border-r border-line px-6 py-4 transition-colors hover:bg-white/[0.03]"
          >
            <span className="data shrink-0 text-[10px] tracking-[0.24em] text-white">
              {item.code} · SIDE {item.sideKey}
            </span>
            <span className="max-w-[46ch] truncate text-[12px] text-mute">{item.body}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
