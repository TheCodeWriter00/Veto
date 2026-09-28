import type { ReactNode } from "react";

export function SectionHead({
  index,
  title,
  note,
  action,
}: {
  index: string;
  title: string;
  note?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5 border-b border-line pb-5">
      <div className="flex items-start gap-4">
        <span className="label mt-1.5">{index}</span>
        <div>
          <h2 className="text-[22px] leading-tight tracking-[-0.02em] text-white sm:text-[26px]">
            {title}
          </h2>
          {note ? <p className="mt-2 max-w-[70ch] text-[13px] text-mute">{note}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-8 bg-white/40" aria-hidden />
      <span className="label-bright">{children}</span>
    </div>
  );
}

export function StatBlock({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="border border-line px-5 py-5">
      <span className="label">{label}</span>
      <div className="data mt-4 text-[26px] leading-none text-white sm:text-[32px]">{value}</div>
      {hint ? <div className="label mt-3 leading-relaxed">{hint}</div> : null}
    </div>
  );
}


