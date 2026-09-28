import Link from "next/link";
import { LogoGlyph } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-start justify-center py-24">
      <LogoGlyph size={40} className="opacity-60" />
      <span className="label mt-10">404 · NO SUCH RECORD</span>
      <h1 className="mt-6 max-w-[24ch] text-[34px] leading-[1.05] tracking-[-0.03em] text-white sm:text-[46px]">
        This chamber does not exist, or it has already dissolved.
      </h1>
      <p className="mt-6 max-w-[60ch] text-[14px] leading-relaxed text-mute">
        Codes are printed on every dossier. Records close permanently the moment the room dissolves —
        there is no archive behind a dead link.
      </p>
      <div className="mt-9 flex flex-wrap gap-4">
        <Link href="/arena" className="btn-solid px-5 py-3.5">
          BACK TO THE ARENA →
        </Link>
        <Link
          href="/"
          className="label-bright border border-line px-5 py-3.5 text-dim transition-colors hover:border-line-strong hover:text-white"
        >
          HOME
        </Link>
      </div>
    </div>
  );
}
