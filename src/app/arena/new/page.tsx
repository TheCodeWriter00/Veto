import Link from "next/link";
import { CreateMatchForm } from "@/components/CreateMatchForm";
import { Kicker } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Convene — VETO",
  description: "Write a dossier and mint two sealed anonymous side keys.",
};

export default function NewMatchPage() {
  return (
    <div className="pb-10 pt-16">
      <Kicker>CONVENE</Kicker>
      <h1 className="mt-7 max-w-[30ch] text-[34px] leading-[1.02] tracking-[-0.035em] text-white sm:text-[50px]">
        Write the dossier. Mint two sealed keys. Hand one to each side.
      </h1>
      <p className="mt-7 max-w-[76ch] text-[15px] leading-relaxed text-dim">
        A good Veto dossier has no comfortable exit: two harms that cannot both be avoided, a
        constraint that forbids the obvious compromise, and stakes large enough that the reasoning has
        to carry real weight. Nothing about either side travels with the argument — no names, no
        seniority, no credentials. Only the sealed key opens the room.
      </p>

      <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_1fr_1fr]">
        {[
          {
            n: "01",
            t: "START FROM THE LIBRARY",
            b: "Load a pre-built dilemma — whistleblowing ledgers, triage arithmetic, privileged confessions — or write a custom crisis from scratch.",
          },
          {
            n: "02",
            t: "MINT SEALED KEYS",
            b: "Veto issues two keys on convention. Each key lets one side post statements. Binding a key to an anonymous vault is optional and irreversible.",
          },
          {
            n: "03",
            t: "OPEN THE ROOM",
            b: "The chamber begins at zero votes — hyper-dense, every vote worth a thousand points. The value decays as minds arrive.",
          },
        ].map((item) => (
          <div key={item.n} className="border border-line p-6">
            <span className="data text-[11px] tracking-[0.3em] text-mute">{item.n}</span>
            <h2 className="label-bright mt-7">{item.t}</h2>
            <p className="mt-4 text-[13px] leading-relaxed text-mute">{item.b}</p>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <CreateMatchForm />
      </div>

      <p className="mt-8 text-[13px] text-mute">
        Not sure yet?{" "}
        <Link href="/arena" className="text-white underline underline-offset-4">
          Read a live chamber
        </Link>{" "}
        or{" "}
        <Link href="/engine" className="text-white underline underline-offset-4">
          study the scoring engine
        </Link>
        .
      </p>
    </div>
  );
}
