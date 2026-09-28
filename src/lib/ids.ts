import { createHash, randomBytes, randomInt } from "node:crypto";

const ALPHABET = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function randomToken(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function generateCode(): string {
  return `M-${String(randomInt(10000, 99999))}`;
}

export function generateAnonTag(): string {
  return randomToken(4);
}

export function generateClaimKey(): string {
  return `CLAIM-${randomToken(12)}`;
}

export function generateHandle(): string {
  return `VETO-${randomToken(6)}`;
}

export function generateVaultKey(): string {
  return `VLT-${randomToken(6)}-${randomToken(6)}`;
}

export function voterHash(matchId: string, voterToken: string): string {
  return createHash("sha256").update(`${matchId}:${voterToken}`).digest("hex");
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
