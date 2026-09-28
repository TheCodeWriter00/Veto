import Link from "next/link";
import { LogoLockup } from "@/components/Logo";

const NAV = [
  { href: "/arena", label: "ARENA" },
  { href: "/engine", label: "ENGINE" },
  { href: "/standings", label: "STANDINGS" },
  { href: "/vault", label: "VAULT" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-black/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center" aria-label="Veto — home">
          <LogoLockup size={26} className="opacity-95 transition-opacity group-hover:opacity-100" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="label-bright transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-2 sm:flex">
            <span className="live-dot h-1.5 w-1.5 bg-white" aria-hidden />
            <span className="label">LIVE AUDIT</span>
          </span>
          <Link
            href="/arena/new"
            className="label-bright border border-line-strong px-4 py-2.5 transition-colors hover:bg-white hover:text-black"
          >
            CONVENE
          </Link>
        </div>
      </div>

      <nav className="flex items-center gap-6 overflow-x-auto border-t border-line px-5 py-3 md:hidden">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="label-bright whitespace-nowrap">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
