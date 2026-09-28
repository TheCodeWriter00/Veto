"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ScenarioOption } from "@/lib/types";

type Receipt = { code: string; id: string; claimKeys: { A: string; B: string } };

export function CreateMatchForm() {
  const [library, setLibrary] = useState<ScenarioOption[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [category, setCategory] = useState("OPEN");
  const [openingA, setOpeningA] = useState("");
  const [openingB, setOpeningB] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void fetch("/api/scenarios", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { ok: boolean; scenarios?: ScenarioOption[] }) => {
        if (alive && data.ok && data.scenarios) setLibrary(data.scenarios);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  function applyScenario(slug: string) {
    if (!slug) {
      setSelected("");
      return;
    }
    const found = library.find((s) => s.slug === slug);
    if (!found) return;
    setSelected(slug);
    setTitle(found.title);
    setBrief(found.brief);
    setCategory(found.category);
  }

  async function submit() {
    setBusy(true);
    setErrors([]);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          brief,
          category,
          openingA,
          openingB,
          scenarioSlug: selected,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        errors?: string[];
        error?: string;
        code?: string;
        id?: string;
        claimKeys?: { A: string; B: string };
      };
      if (!data.ok) {
        setErrors(data.errors ?? [data.error ?? "The registry refused the request."]);
        return;
      }
      if (data.code && data.id && data.claimKeys) {
        setReceipt({ code: data.code, id: data.id, claimKeys: data.claimKeys });
      }
    } catch {
      setErrors(["Transmission failed. Retry."]);
    } finally {
      setBusy(false);
    }
  }

  if (receipt) {
    return (
      <div className="panel glow-edge rise">
        <div className="border-b border-line px-5 py-4">
          <span className="label-bright">MATCH CONVENED · KEYS SEALED</span>
        </div>
        <div className="p-6">
          <div className="data text-3xl tracking-[0.16em] text-white">{receipt.code}</div>
          <p className="mt-4 max-w-[62ch] text-[13px] leading-relaxed text-mute">
            The room is live and completely anonymous. Hand one sealed key to each side and nothing
            else. Neither side learns who the other is — and neither does the chamber. Keys are
            disclosed once, here, and never again.
          </p>

          <div className="mt-6 grid gap-px border border-line bg-line sm:grid-cols-2">
            {(["A", "B"] as const).map((side) => (
              <div key={side} className="bg-carbon p-5">
                <span className="label">SIDE {side} · SEALED KEY</span>
                <div className="data mt-3 break-all text-[13px] text-white">
                  {receipt.claimKeys[side]}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(receipt.claimKeys[side]);
                    setCopied(side);
                    window.setTimeout(() => setCopied(null), 1600);
                  }}
                  className="label-bright mt-4 border border-line px-3 py-2 transition-colors hover:border-line-strong"
                >
                  {copied === side ? "COPIED" : "COPY KEY"}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={`/arena/${receipt.id}`} className="btn-solid px-4 py-3">
              ENTER THE ROOM →
            </Link>
            <button
              type="button"
              onClick={() => {
                setReceipt(null);
                setTitle("");
                setBrief("");
                setOpeningA("");
                setOpeningB("");
                setSelected("");
                setCategory("OPEN");
              }}
              className="label-bright border border-line px-4 py-3 text-dim transition-colors hover:border-line-strong hover:text-white"
            >
              CONVENE ANOTHER
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel glow-edge">
      <div className="border-b border-line px-5 py-4">
        <span className="label-bright">NEW DOSSIER</span>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_1.5fr]">
        <div className="border-line p-5 lg:border-r">
          <span className="label">DILEMMA LIBRARY</span>
          <div className="mt-4 max-h-[420px] space-y-px overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => applyScenario("")}
              className={`w-full border px-3 py-3 text-left text-[12px] transition-colors ${
                selected === "" ? "border-white/70 bg-white/[0.06] text-white" : "border-line text-dim hover:text-white"
              }`}
            >
              CUSTOM — WRITE YOUR OWN
            </button>
            {library.map((scenario) => (
              <button
                key={scenario.slug}
                type="button"
                onClick={() => applyScenario(scenario.slug)}
                className={`w-full border px-3 py-3 text-left transition-colors ${
                  selected === scenario.slug
                    ? "border-white/70 bg-white/[0.06]"
                    : "border-line hover:bg-white/[0.02]"
                }`}
              >
                <span className="label">{scenario.category}</span>
                <div className="data mt-2 text-[12px] text-white">{scenario.title}</div>
              </button>
            ))}
            {library.length === 0 ? <p className="label pt-3">LOADING REGISTRY…</p> : null}
          </div>
        </div>

        <div className="p-5">
          <div className="grid gap-5">
            <Field label="DOSSIER TITLE">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="THE THIRD PARTY CLAUSE"
                className="w-full border border-line bg-black px-3 py-3 text-[14px] outline-none focus:border-line-strong"
              />
            </Field>

            <Field label="CATEGORY">
              <input
                value={category}
                onChange={(event) => setCategory(event.target.value.toUpperCase())}
                placeholder="CORPORATE ETHICS"
                className="data w-full border border-line bg-black px-3 py-3 text-[12px] tracking-[0.16em] outline-none focus:border-line-strong"
              />
            </Field>

            <Field label="THE SCENARIO — AS DIFFICULT AS YOU CAN MAKE IT">
              <textarea
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
                rows={6}
                placeholder="State the crisis, the constraints, and the two irreconcilable harms. Leave no comfortable exit."
                className="w-full resize-y border border-line bg-black px-3 py-3 text-[13px] leading-relaxed outline-none focus:border-line-strong"
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="SIDE A — OPENING POSITION">
                <textarea
                  value={openingA}
                  onChange={(event) => setOpeningA(event.target.value)}
                  rows={6}
                  placeholder="Side A's first argument. Reasoned, unsentimental, no identity."
                  className="w-full resize-y border border-line bg-black px-3 py-3 text-[13px] leading-relaxed outline-none focus:border-line-strong"
                />
              </Field>
              <Field label="SIDE B — OPENING POSITION">
                <textarea
                  value={openingB}
                  onChange={(event) => setOpeningB(event.target.value)}
                  rows={6}
                  placeholder="Side B's counter-position. Attack the mechanism, not the person."
                  className="w-full resize-y border border-line bg-black px-3 py-3 text-[13px] leading-relaxed outline-none focus:border-line-strong"
                />
              </Field>
            </div>

            {errors.length > 0 ? (
              <ul className="border border-line-strong px-4 py-3">
                {errors.map((error) => (
                  <li key={error} className="data text-[12px] leading-relaxed text-dim">
                    — {error}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="btn-solid px-5 py-3.5"
              >
                {busy ? "SEALING…" : "CONVENE & MINT SEALED KEYS"}
              </button>
              <span className="label">CHAMBER STARTS AT ZERO VOTES · HYPER-DENSE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="mt-3">{children}</div>
    </label>
  );
}
