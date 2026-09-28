import Link from "next/link";
import { VaultLookup } from "@/components/VaultLookup";
import { Kicker, SectionHead } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vault — VETO",
  description: "Open an anonymous vault and read the record of reasoning it holds.",
};

export default function VaultPage() {
  return (
    <div className="pb-10 pt-16">
      <Kicker>ANONYMOUS VAULT</Kicker>
      <h1 className="mt-7 max-w-[28ch] text-[34px] leading-[1.02] tracking-[-0.035em] text-white sm:text-[50px]">
        A record of reasoning, never a person.
      </h1>
      <p className="mt-7 max-w-[78ch] text-[15px] leading-relaxed text-dim">
        Every side in every chamber carries a sealed key. If you hold one, you can bind it to an
        anonymous vault — a handle minted by the system, credited with the points your arguments
        actually earned, and readable by nobody but you. Veto never asks for an email, a name, or a
        login. The vault key is the entire identity.
      </p>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {[
          {
            n: "01",
            t: "CLAIM YOUR SIDE",
            b: "Paste the sealed key you were handed when the match was convened. If you wrote the dossier, you were handed both keys.",
          },
          {
            n: "02",
            t: "BIND A VAULT",
            b: "Binding mints a permanent handle and a vault key. The vault key is disclosed exactly once, on screen. Store it somewhere you control — Veto keeps no recovery path.",
          },
          {
            n: "03",
            t: "READ THE RECORD",
            b: "The vault accumulates points from every match you resolve, alongside your record of wins, ties and losses. It carries no name, no school, and no country.",
          },
        ].map((item) => (
          <div key={item.n} className="border border-line p-6">
            <span className="data text-[11px] tracking-[0.3em] text-mute">{item.n}</span>
            <h2 className="label-bright mt-7">{item.t}</h2>
            <p className="mt-4 text-[13px] leading-relaxed text-mute">{item.b}</p>
          </div>
        ))}
      </div>

      <section className="mt-16">
        <SectionHead
          index="01"
          title="Open a vault."
          note="Keys are matched exactly and case-insensitively. Nothing about the lookup is written to any log beyond the request itself."
        />
        <div className="mt-6">
          <VaultLookup />
        </div>
      </section>

      <section className="mt-16">
        <SectionHead
          index="02"
          title="What a vault will never contain."
          note="Four absences that make the arena worth entering."
        />
        <div className="mt-6 grid gap-px border border-line bg-line md:grid-cols-2">
          {[
            {
              t: "A PERSON",
              b: "There is no field for a legal name, no avatar, no biography, no list of institutions. A vault is a container for points and nothing else.",
            },
            {
              t: "A PURCHASE",
              b: "Points cannot be bought, transferred, or topped up. They appear only when a chamber resolves and pays the pools its voters actually cast.",
            },
            {
              t: "A HISTORY OF LOSING BADLY",
              b: "The runner keeps the smaller pool. A vault that lost a dense room still rises — more slowly, but never to zero.",
            },
            {
              t: "A RECOVERY PATH",
              b: "If the vault key is lost, the vault is lost. That asymmetry is the price of holding no personal data at all.",
            },
          ].map((item) => (
            <div key={item.t} className="bg-black p-6">
              <h3 className="label-bright">{item.t}</h3>
              <p className="mt-4 text-[13px] leading-relaxed text-mute">{item.b}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/arena" className="btn-solid px-5 py-3.5">
            FIND A CHAMBER →
          </Link>
          <Link
            href="/arena/new"
            className="label-bright border border-line px-5 py-3.5 text-dim transition-colors hover:border-line-strong hover:text-white"
          >
            CONVENE A MATCH
          </Link>
        </div>
      </section>
    </div>
  );
}
