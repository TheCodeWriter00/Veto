import Link from "next/link";
import { LogoGlyph } from "@/components/Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto w-full max-w-[1180px] px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <LogoGlyph size={22} />
              <span className="label-bright">VETO</span>
            </div>
            <p className="mt-5 max-w-[34ch] text-[13px] leading-relaxed text-mute">
              Two unidentified sides. One complex decision. An anonymous chamber voting live on
              reasoning alone. Identity carries no weight here — only the arithmetic of argument.
            </p>
          </div>

          <FooterColumn
            title="ARENA"
            links={[
              { href: "/arena", label: "Live chambers" },
              { href: "/arena", label: "Closed records" },
              { href: "/arena/new", label: "Convene a match" },
            ]}
          />
          <FooterColumn
            title="MECHANICS"
            links={[
              { href: "/engine", label: "Crowd weighting" },
              { href: "/engine", label: "Point ladder" },
              { href: "/engine", label: "Resolution law" },
            ]}
          />
          <FooterColumn
            title="IDENTITY"
            links={[
              { href: "/standings", label: "Anonymous standings" },
              { href: "/vault", label: "Vault lookup" },
              { href: "/vault", label: "Seal a side key" },
            ]}
          />
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="label">
            NO NAMES · NO RANK · NO APPEAL · THE ROOM JUST DISSOLVES
          </span>
          <span className="label">© {new Date().getFullYear()} VETO STANDARD</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <span className="label">{title}</span>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            <Link
              href={link.href}
              className="text-[13px] text-dim transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
