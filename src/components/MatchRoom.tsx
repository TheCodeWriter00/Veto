"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LogoGlyph } from "@/components/Logo";
import { PHASES, formatDate, formatNumber, formatShare, type SideKey } from "@/lib/veto";
import type { MatchDetail, SideView } from "@/lib/types";

type Flash = { tone: "ok" | "warn" | "err"; text: string };

function voterToken(): string {
  if (typeof window === "undefined") return "server-render-placeholder";
  let token = window.localStorage.getItem("veto:voter");
  if (!token) {
    token =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `tok-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    window.localStorage.setItem("veto:voter", token);
  }
  return token;
}

export function MatchRoom({ initial }: { initial: MatchDetail }) {
  const [detail, setDetail] = useState<MatchDetail>(initial);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [myVote, setMyVote] = useState<SideKey | null>(null);
  const [sideKey, setSideKey] = useState("");
  const [seal, setSeal] = useState<{ handle: string; vaultKey?: string } | null>(null);
  const [rebuttal, setRebuttal] = useState("");
  const [confirmResolve, setConfirmResolve] = useState(false);

  const code = detail.code;
  const resolved = detail.status === "RESOLVED";
  const tally = detail.tally;

  useEffect(() => {
    const savedVote = window.localStorage.getItem(`veto:vote:${initial.id}`);
    if (savedVote === "A" || savedVote === "B") setMyVote(savedVote);
    const savedKey = window.localStorage.getItem(`veto:key:${initial.id}`);
    if (savedKey) setSideKey(savedKey);
  }, [initial.id]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${code}`, { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; detail?: MatchDetail };
      if (data.ok && data.detail) setDetail(data.detail);
    } catch {
      /* the wire dropped; next tick retries */
    }
  }, [code]);

  useEffect(() => {
    if (resolved) return;
    const timer = window.setInterval(() => {
      void refresh();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [refresh, resolved]);

  const castVote = useCallback(
    async (side: SideKey) => {
      setBusy(`vote-${side}`);
      setFlash(null);
      try {
        const res = await fetch(`/api/matches/${code}/vote`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ side, voterToken: voterToken() }),
        });
        const data = (await res.json()) as {
          ok: boolean;
          code?: string;
          error?: string;
          detail?: MatchDetail;
        };
        if (data.detail) setDetail(data.detail);
        if (data.ok) {
          window.localStorage.setItem(`veto:vote:${initial.id}`, side);
          setMyVote(side);
          const value = data.detail?.tally.voteValue ?? tally.voteValue;
          setFlash({
            tone: "ok",
            text: `Vote sealed to SIDE ${side}. In this chamber your vote was worth ${formatNumber(value)} points.`,
          });
        } else {
          setFlash({
            tone: data.code === "ALREADY_CAST" ? "warn" : "err",
            text: data.error ?? "The vote did not register.",
          });
        }
      } catch {
        setFlash({ tone: "err", text: "Transmission failed. Try again." });
      } finally {
        setBusy(null);
      }
    },
    [code, initial.id, tally.voteValue],
  );

  const act = useCallback(
    async (path: string, body: Record<string, unknown>, label: string, okText: string) => {
      setBusy(label);
      setFlash(null);
      try {
        const res = await fetch(`/api/matches/${code}${path}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as {
          ok: boolean;
          error?: string;
          detail?: MatchDetail;
        };
        if (data.detail) setDetail(data.detail);
        setFlash({
          tone: data.ok ? "ok" : "err",
          text: data.ok ? okText : data.error ?? "Rejected.",
        });
        return data;
      } catch {
        setFlash({ tone: "err", text: "Transmission failed." });
        return null;
      } finally {
        setBusy(null);
      }
    },
    [code],
  );

  const submitRebuttal = useCallback(async () => {
    if (!sideKey.trim()) {
      setFlash({ tone: "err", text: "Paste the sealed side key to speak in this room." });
      return;
    }
    if (rebuttal.trim().length < 8) {
      setFlash({ tone: "err", text: "A statement needs at least eight characters." });
      return;
    }
    const data = await act(
      "/rebuttal",
      { claimKey: sideKey.trim().toUpperCase(), body: rebuttal.trim() },
      "rebuttal",
      "Statement entered into the record.",
    );
    if (data?.ok) {
      window.localStorage.setItem(`veto:key:${initial.id}`, sideKey.trim().toUpperCase());
      setRebuttal("");
    }
  }, [act, initial.id, rebuttal, sideKey]);

  const sealVault = useCallback(async () => {
    if (!sideKey.trim()) {
      setFlash({ tone: "err", text: "Paste the sealed side key you were issued." });
      return;
    }
    setBusy("seal");
    setFlash(null);
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ claimKey: sideKey.trim().toUpperCase() }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        note?: string;
        handle?: string;
        vaultKey?: string;
        alreadyClaimed?: boolean;
      };
      if (!data.ok) {
        setFlash({ tone: "err", text: data.error ?? "The key was rejected." });
        return;
      }
      window.localStorage.setItem(`veto:key:${initial.id}`, sideKey.trim().toUpperCase());
      setSeal({ handle: data.handle ?? "—", vaultKey: data.vaultKey });
      setFlash({
        tone: data.vaultKey ? "ok" : "warn",
        text: data.vaultKey
          ? "Vault minted. Copy the key now — it is disclosed once."
          : data.note ?? "This side already belongs to an anonymous vault.",
      });
      void refresh();
    } catch {
      setFlash({ tone: "err", text: "Transmission failed." });
    } finally {
      setBusy(null);
    }
  }, [initial.id, refresh, sideKey]);

  const sides = useMemo(
    () => ({
      A: detail.sides.find((s) => s.key === "A"),
      B: detail.sides.find((s) => s.key === "B"),
    }),
    [detail.sides],
  );

  const voteValueNow = tally.voteValue;
  const shareA = Math.round(tally.shareA * 1000) / 10;
  const shareB = Math.round(tally.shareB * 1000) / 10;

  const pointsFor = (side: SideKey) => {
    if (detail.verdict) {
      return side === "A" ? detail.verdict.pointsA : detail.verdict.pointsB;
    }
    return side === "A" ? tally.pointsA : tally.pointsB;
  };

  return (
    <div className="pt-10">
      {/* ── registry bar ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div className="flex items-center gap-4">
          <Link href="/arena" className="label-bright hover:text-white">
            ← ARENA
          </Link>
          <span className="h-4 w-px bg-white/20" aria-hidden />
          <span className="data text-[11px] tracking-[0.28em] text-white">{detail.code}</span>
          <span className="label">{detail.category}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="label">PHASE {detail.phase}</span>
          {resolved ? (
            <span className="label-bright border border-line-strong px-3 py-1.5">DISSOLVED</span>
          ) : (
            <span className="flex items-center gap-2 border border-line-strong px-3 py-1.5">
              <span className="live-dot h-1.5 w-1.5 bg-white" aria-hidden />
              <span className="label-bright">LIVE</span>
            </span>
          )}
        </div>
      </div>

      {/* ── the dossier ────────────────────────────────────────── */}
      <section className="pt-10">
        <div className="flex items-start gap-5">
          <LogoGlyph size={30} className="mt-2 hidden shrink-0 sm:block" />
          <div>
            <span className="label">SCENARIO · IDENTITY WITHHELD FROM BOTH SIDES</span>
            <h1 className="mt-5 max-w-[26ch] text-[34px] leading-[1.05] tracking-[-0.03em] text-white sm:text-[46px]">
              {detail.title}
            </h1>
            <p className="mt-4 max-w-[70ch] text-[12px] leading-relaxed text-mute">
              A side may be one advocate or a closed collective — the room cannot tell, and is not
              permitted to guess. Every vote is a hash. Only the sealed keys know who is speaking,
              and they are never asked to say.
            </p>
            <p className="mt-6 max-w-[74ch] border-l border-line-strong pl-5 text-[15px] leading-relaxed text-dim">
              {detail.brief}
            </p>
          </div>
        </div>
      </section>

      {/* ── the chamber ────────────────────────────────────────── */}
      <section className="mt-12 panel glow-edge">
        <div className="grid grid-cols-2 gap-px border-b border-line bg-line sm:grid-cols-4">
          <ChamberCell label="CHAMBER SIZE" value={formatNumber(tally.total)} hint={tally.tier.name} />
          <ChamberCell
            label="POINTS PER VOTE"
            value={String(voteValueNow)}
            hint={tally.tier.density}
          />
          <ChamberCell label="MARGIN" value={tally.total ? formatShare(tally.marginShare) : "—"} hint={`${formatNumber(tally.margin)} VOTES APART`} />
          <ChamberCell
            label={resolved ? "OUTCOME" : "PROJECTED"}
            value={
              resolved
                ? detail.verdict?.tie
                  ? "EXACT TIE"
                  : `SIDE ${detail.verdict?.winnerSide}`
                : tally.total === 0
                  ? "—"
                  : tally.tie
                    ? "DEADLOCK"
                    : `SIDE ${tally.leader} LEADS`
            }
            hint={resolved ? "SEALED" : "LIVE PROJECTION"}
          />
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex items-baseline justify-between">
            <span className="data text-[13px] tracking-[0.2em] text-white">
              SIDE A · {sides.A?.anonTag ?? "----"}
            </span>
            <span className="data text-[13px] tracking-[0.2em] text-white">
              {sides.B?.anonTag ?? "----"} · SIDE B
            </span>
          </div>
          <div className="mt-4 flex h-3 w-full gap-px overflow-hidden bg-line">
            <div
              className="h-full bg-white transition-all duration-700"
              style={{ width: `${Math.max(tally.total ? 1 : 50, shareA)}%`, opacity: tally.total ? 1 : 0.18 }}
            />
            <div
              className="h-full bg-white transition-all duration-700"
              style={{ width: `${Math.max(tally.total ? 1 : 50, shareB)}%`, opacity: tally.total ? 0.45 : 0.18 }}
            />
          </div>
          <div className="mt-4 flex justify-between">
            <span className="data text-[11px] text-dim">
              {formatNumber(tally.votesA)} VOTES · {shareA.toFixed(1)}% ·{" "}
              <span className="text-white">{formatNumber(pointsFor("A"))} PTS</span>
            </span>
            <span className="data text-[11px] text-dim">
              <span className="text-white">{formatNumber(pointsFor("B"))} PTS</span> ·{" "}
              {shareB.toFixed(1)}% · {formatNumber(tally.votesB)} VOTES
            </span>
          </div>
        </div>
      </section>

      {flash ? (
        <div
          className={`rise mt-5 border px-4 py-3 text-[13px] ${
            flash.tone === "ok"
              ? "border-line-strong text-white"
              : flash.tone === "warn"
                ? "border-line-strong text-dim"
                : "border-white/40 text-dim"
          }`}
        >
          <span className="label mr-3">{flash.tone === "ok" ? "ACCEPTED" : flash.tone === "warn" ? "NOTICE" : "REJECTED"}</span>
          {flash.text}
        </div>
      ) : null}

      {/* ── sides + vote ───────────────────────────────────────── */}
      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        {(["A", "B"] as SideKey[]).map((key) => (
          <SideCard
            key={key}
            side={sides[key]}
            sideKey={key}
            votes={key === "A" ? tally.votesA : tally.votesB}
            points={pointsFor(key)}
            voteValue={voteValueNow}
            resolved={resolved}
            tie={Boolean(detail.verdict?.tie)}
            won={detail.verdict ? detail.verdict.winnerSide === key : false}
            myVote={myVote}
            busy={busy}
            onVote={castVote}
            total={tally.total}
          />
        ))}
      </section>

      {/* ── the room ───────────────────────────────────────────── */}
      <section className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="panel glow-edge">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="label-bright">THE ROOM</span>
              <span className="label">{detail.rebuttals.length} ENTRIES</span>
            </div>
            <span className="label">LOGIC UNFOLDS LIVE · VOTERS READ IN REAL TIME</span>
          </div>

          <div className="max-h-[520px] space-y-5 overflow-y-auto p-5">
            {detail.rebuttals.length === 0 ? (
              <p className="text-[13px] leading-relaxed text-mute">
                The floor is empty. Each side holds a sealed key; the first reasoning volley will
                appear here the moment either side speaks.
              </p>
            ) : (
              detail.rebuttals.map((entry, index) => (
                <article key={entry.id} className="rise" style={{ animationDelay: `${index * 20}ms` }}>
                  <div className="flex items-center gap-3">
                    <span className="data text-[10px] tracking-[0.24em] text-white">
                      SIDE {entry.sideKey}
                    </span>
                    <span className="label">{entry.phase}</span>
                    <span className="h-3 w-px bg-white/15" aria-hidden />
                    <span className="label">{formatDate(entry.createdAt)}</span>
                  </div>
                  <p className="mt-3 max-w-[72ch] border-l border-line pl-4 text-[14px] leading-relaxed text-dim">
                    {entry.body}
                  </p>
                </article>
              ))
            )}
          </div>

          <div className="border-t border-line p-5">
            <span className="label">SPEAK WITH YOUR SEALED SIDE KEY</span>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                value={sideKey}
                onChange={(event) => setSideKey(event.target.value.toUpperCase())}
                placeholder="CLAIM-XXXXXXXXXXXX"
                className="data w-full border border-line bg-black px-3 py-3 text-[12px] tracking-[0.12em] outline-none focus:border-line-strong sm:max-w-[280px]"
              />
              <textarea
                value={rebuttal}
                onChange={(event) => setRebuttal(event.target.value)}
                placeholder="Enter your rebuttal. Reasoning only — no identity, no credentials."
                rows={3}
                className="min-h-[88px] w-full resize-y border border-line bg-black px-3 py-3 text-[13px] leading-relaxed outline-none focus:border-line-strong"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <ActionButton
                onClick={submitRebuttal}
                disabled={resolved || busy === "rebuttal"}
                variant="solid"
              >
                {busy === "rebuttal" ? "TRANSMITTING…" : "ENTER STATEMENT"}
              </ActionButton>
              <ActionButton onClick={sealVault} disabled={busy === "seal"}>
                {busy === "seal" ? "SEALING…" : "BIND ANONYMOUS VAULT"}
              </ActionButton>
              <span className="label">KEY STAYS LOCAL TO THIS BROWSER</span>
            </div>

            {seal ? (
              <div className="rise mt-4 border border-line-strong px-4 py-4">
                <span className="label">ANONYMOUS VAULT</span>
                <div className="data mt-3 text-[13px] text-white">{seal.handle}</div>
                {seal.vaultKey ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <code className="data border border-line px-3 py-2 text-[12px] text-white">
                      {seal.vaultKey}
                    </code>
                    <ActionButton
                      onClick={() => {
                        void navigator.clipboard?.writeText(seal.vaultKey ?? "");
                        setFlash({ tone: "ok", text: "Vault key copied to clipboard." });
                      }}
                    >
                      COPY
                    </ActionButton>
                  </div>
                ) : (
                  <p className="mt-3 text-[13px] text-mute">
                    This side is already bound. Vault keys are never re-disclosed.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-5">
          <div className="panel glow-edge">
            <div className="border-b border-line px-5 py-4">
              <span className="label-bright">RESOLUTION CONTROL</span>
            </div>
            <div className="p-5">
              <span className="label">PHASE</span>
              <div className="mt-3 grid grid-cols-2 gap-px border border-line bg-line">
                {PHASES.map((phase) => (
                  <button
                    key={phase}
                    type="button"
                    disabled={resolved || busy === "phase"}
                    onClick={() =>
                      void act("/phase", { phase }, "phase", `Phase advanced to ${phase}.`)
                    }
                    className={`data px-3 py-3 text-[10px] tracking-[0.22em] transition-colors disabled:opacity-40 ${
                      detail.phase === phase
                        ? "bg-white text-black"
                        : "bg-carbon text-dim hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    {phase}
                  </button>
                ))}
              </div>

              <div className="rule my-6" />

              {resolved ? (
                <div>
                  <span className="label">FINAL AWARD</span>
                  <div className="mt-4 space-y-3">
                    {(["A", "B"] as SideKey[]).map((key) => (
                      <div
                        key={key}
                        className="flex items-center justify-between border border-line px-4 py-3"
                      >
                        <span className="data text-[11px] tracking-[0.22em] text-dim">
                          SIDE {key}
                          <span className="ml-3 text-white">
                            {sides[key]?.outcome ?? "—"}
                          </span>
                        </span>
                        <span className="data text-[15px] text-white">
                          {formatNumber(pointsFor(key))}
                          <span className="text-mute"> PTS</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 border-l border-line-strong pl-4 text-[13px] leading-relaxed text-mute">
                    {detail.verdict?.tie
                      ? "Exact mathematical tie. Both sides keep their split points. No overtime — the room simply dissolved."
                      : `The chamber closed at ${formatNumber(tally.total)} votes, each worth ${formatNumber(detail.verdict?.voteValue ?? 0)} points. The margin was ${formatShare(detail.verdict?.marginShare ?? 0)} of the room.`}
                  </p>
                </div>
              ) : (
                <div>
                  <span className="label">DISSOLVE</span>
                  <p className="mt-3 text-[13px] leading-relaxed text-mute">
                    Resolving freezes the chamber at{" "}
                    <span className="text-white">{formatNumber(tally.total)}</span> votes and pays
                    both pools at <span className="text-white">{voteValueNow}</span> points per
                    vote. This cannot be reversed.
                  </p>
                  {confirmResolve ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <ActionButton
                        variant="solid"
                        disabled={busy === "resolve"}
                        onClick={() => {
                          setConfirmResolve(false);
                          void act("/resolve", {}, "resolve", "Chamber dissolved. Awards paid.");
                        }}
                      >
                        {busy === "resolve" ? "SEALING…" : "CONFIRM DISSOLUTION"}
                      </ActionButton>
                      <ActionButton onClick={() => setConfirmResolve(false)}>CANCEL</ActionButton>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <ActionButton variant="solid" onClick={() => setConfirmResolve(true)}>
                        DISSOLVE THE ROOM
                      </ActionButton>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="panel glow-edge p-5">
            <span className="label">THE ARITHMETIC IN FORCE</span>
            <dl className="mt-4 space-y-3">
              <Row k="c(n) = √(n / 100)" v={`√(${formatNumber(tally.total)} / 100) = ${Math.sqrt(Math.max(1, tally.total) / 100).toFixed(3)}`} />
              <Row k="v(n) = 100 / c(n)" v={`${voteValueNow} PTS PER VOTE`} />
              <Row
                k="WINNER TAKE"
                v={`${formatNumber(Math.max(tally.votesA, tally.votesB))} × ${voteValueNow} = ${formatNumber(Math.max(tally.pointsA, tally.pointsB))}`}
              />
              <Row
                k="RUNNER KEEP"
                v={`${formatNumber(Math.min(tally.votesA, tally.votesB))} × ${voteValueNow} = ${formatNumber(Math.min(tally.pointsA, tally.pointsB))}`}
              />
            </dl>
            <p className="mt-5 text-[12px] leading-relaxed text-mute">
              A lesser chamber is hyper-dense: fewer minds, larger consequence per vote. A mass
              chamber dilutes the same reasoning across thousands. Veto pays for the difficulty of
              persuasion, not the size of the crowd.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ChamberCell({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-carbon px-5 py-4">
      <span className="label">{label}</span>
      <div className="data mt-3 text-2xl leading-none text-white">{value}</div>
      <div className="label mt-2">{hint}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2.5">
      <dt className="label">{k}</dt>
      <dd className="data text-[12px] text-white">{v}</dd>
    </div>
  );
}

function SideCard({
  side,
  sideKey,
  votes,
  points,
  voteValue,
  resolved,
  tie,
  won,
  myVote,
  busy,
  onVote,
  total,
}: {
  side: SideView | undefined;
  sideKey: SideKey;
  votes: number;
  points: number;
  voteValue: number;
  resolved: boolean;
  tie: boolean;
  won: boolean;
  myVote: SideKey | null;
  busy: string | null;
  onVote: (side: SideKey) => void;
  total: number;
}) {
  if (!side) return null;
  const mine = myVote === sideKey;
  const votedElsewhere = myVote !== null && !mine;
  const disabled = resolved || mine || votedElsewhere || busy === `vote-${sideKey}`;

  return (
    <article
      className={`panel glow-edge flex flex-col ${
        resolved && won ? "border-white/45" : ""
      }`}
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="data text-[11px] tracking-[0.26em] text-white">SIDE {sideKey}</span>
          <span className="label">{side.anonTag}</span>
        </div>
        <div className="flex items-center gap-3">
          {side.claimed ? (
            <span className="label-bright border border-line-strong px-2.5 py-1">
              VAULT {side.handle ?? "BOUND"}
            </span>
          ) : (
            <span className="label border border-line px-2.5 py-1">UNBOUND</span>
          )}
          {side.outcome ? <span className="label-bright">{side.outcome}</span> : null}
        </div>
      </div>

      <div className="flex-1 px-5 py-5">
        <span className="label">OPENING POSITION</span>
        <p className="mt-3 border-l border-line pl-4 text-[14px] leading-relaxed text-dim">
          {side.opening}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-px border-t border-line bg-line">
        <Mini label="VOTES" value={formatNumber(votes)} />
        <Mini label="SHARE" value={total ? `${((votes / total) * 100).toFixed(1)}%` : "—"} />
        <Mini label={resolved ? "AWARDED" : "PROJECTED"} value={formatNumber(points)} />
      </div>

      <div className="border-t border-line p-5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onVote(sideKey)}
          className={`w-full border px-4 py-4 text-center transition-colors ${
            mine
              ? "border-white bg-white text-black"
              : disabled
                ? "border-line text-mute"
                : "border-line-strong text-white hover:bg-white hover:text-black"
          }`}
        >
          <span className="data text-[11px] tracking-[0.28em]">
            {mine
              ? `YOUR VOTE IS LOCKED TO ${sideKey}`
              : votedElsewhere
                ? "ALREADY VOTED — ONE MIND, ONE VOTE"
                : resolved
                  ? "CHAMBER DISSOLVED"
                  : busy === `vote-${sideKey}`
                    ? "CASTING…"
                    : `CAST ANONYMOUS VOTE · ${voteValue} PTS`}
          </span>
        </button>
        <div className="mt-3 flex justify-between">
          <span className="label">NO IDENTITY REQUIRED</span>
          <span className="label">{tie ? "TIE PENDING" : ""}</span>
        </div>
      </div>
    </article>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-carbon px-4 py-3.5">
      <span className="label">{label}</span>
      <div className="data mt-2 text-[15px] text-white">{value}</div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = "ghost",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "ghost" | "solid";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        variant === "solid"
          ? "btn-solid px-4 py-3"
          : "label-bright border border-line px-4 py-3 text-dim transition-colors hover:border-line-strong hover:text-white disabled:opacity-40"
      }
    >
      {children}
    </button>
  );
}
