"use client";

import { useState } from "react";
import { formatNumber, formatShare } from "@/lib/veto";
import type { VaultSnapshot } from "@/lib/types";

export function VaultLookup() {
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vault, setVault] = useState<VaultSnapshot | null>(null);

  async function lookup() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vaultKey: key }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; vault?: VaultSnapshot };
      if (!data.ok || !data.vault) {
        setError(data.error ?? "No vault carries that key.");
        setVault(null);
        return;
      }
      setVault(data.vault);
    } catch {
      setError("Transmission failed.");
    } finally {
      setBusy(false);
    }
  }

  const record = vault
    ? `${vault.wins}W · ${vault.ties}T · ${vault.losses}L`
    : "—";

  return (
    <div className="panel glow-edge">
      <div className="border-b border-line px-5 py-4">
        <span className="label-bright">VAULT LOOKUP</span>
      </div>
      <div className="p-5">
        <span className="label">PASTE ANONYMOUS VAULT KEY</span>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            value={key}
            onChange={(event) => setKey(event.target.value.toUpperCase())}
            placeholder="VLT-XXXXXX-XXXXXX"
            className="data w-full border border-line bg-black px-3 py-3 text-[13px] tracking-[0.14em] outline-none focus:border-line-strong"
          />
          <button
            type="button"
            onClick={lookup}
            disabled={busy || key.trim().length < 6}
            className="btn-solid shrink-0 px-5 py-3"
          >
            {busy ? "OPENING…" : "OPEN VAULT"}
          </button>
        </div>

        {error ? (
          <p className="mt-4 border-l border-line-strong pl-4 text-[13px] text-dim">{error}</p>
        ) : null}

        {vault ? (
          <div className="rise mt-7">
            <div className="grid gap-px border border-line bg-line sm:grid-cols-4">
              <Stat label="HANDLE" value={vault.handle} />
              <Stat label="TOTAL POINTS" value={formatNumber(vault.totalPoints)} />
              <Stat label="CHAMBERS" value={formatNumber(vault.matchesPlayed)} />
              <Stat label="RECORD" value={record} />
            </div>

            <div className="mt-7">
              <span className="label">SIDE HISTORY</span>
              {vault.sides.length === 0 ? (
                <p className="mt-4 text-[13px] text-mute">
                  This vault has not yet been bound to a side in any chamber.
                </p>
              ) : (
                <div className="mt-4 border border-line">
                  <div className="hidden grid-cols-[1.6fr_0.5fr_0.6fr_0.6fr_0.7fr_0.6fr] gap-3 border-b border-line px-4 py-3 sm:grid">
                    {["DOSSIER", "SIDE", "VOTES", "VALUE", "POINTS", "OUTCOME"].map((head) => (
                      <span key={head} className="label">
                        {head}
                      </span>
                    ))}
                  </div>
                  {vault.sides.map((row) => (
                    <div
                      key={`${row.matchId}-${row.sideKey}`}
                      className="grid grid-cols-2 gap-3 border-b border-line px-4 py-3 last:border-b-0 sm:grid-cols-[1.6fr_0.5fr_0.6fr_0.6fr_0.7fr_0.6fr]"
                    >
                      <span className="data truncate text-[12px] text-white">{row.code}</span>
                      <span className="data text-[12px] text-dim">{row.sideKey}</span>
                      <span className="data text-[12px] text-dim">
                        {formatNumber(row.votesFor)} / {formatNumber(row.votesAgainst)}
                      </span>
                      <span className="data text-[12px] text-dim">{formatNumber(row.voteValue)}</span>
                      <span className="data text-[12px] text-white">{formatNumber(row.points)}</span>
                      <span className="data text-[12px] text-dim">
                        {row.outcome ?? (row.status === "LIVE" ? "PENDING" : "—")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="mt-6 border-l border-line-strong pl-4 text-[13px] leading-relaxed text-mute">
              A vault is a record of reasoning, never a person. Points here accrue only from votes
              the chamber cast — nothing in this table is purchasable or transferable, and nothing
              in it carries a name.
            </p>
            <dl className="mt-6 grid gap-px border border-line bg-line sm:grid-cols-3">
              <Stat
                label="POINTS PER CHAMBER"
                value={formatNumber(vault.matchesPlayed ? vault.totalPoints / vault.matchesPlayed : 0)}
              />
              <Stat
                label="WIN RATE"
                value={
                  vault.matchesPlayed
                    ? formatShare(Math.round((vault.wins / vault.matchesPlayed) * 10000), 1)
                    : "—"
                }
              />
              <Stat
                label="DENSITY POSITION"
                value={`${vault.sides.filter((s) => s.voteValue >= 200).length} HYPER-DENSE`}
              />
            </dl>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-carbon px-4 py-4">
      <span className="label">{label}</span>
      <div className="data mt-3 truncate text-[15px] text-white">{value}</div>
    </div>
  );
}
