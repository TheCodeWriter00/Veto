import { getVaultSnapshot } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const vaultKey = typeof body?.vaultKey === "string" ? body.vaultKey.trim() : "";
  if (vaultKey.length < 6) {
    return Response.json({ ok: false, error: "Enter a vault key." }, { status: 400 });
  }
  const snapshot = await getVaultSnapshot(vaultKey);
  if (!snapshot) {
    return Response.json({ ok: false, error: "No vault carries that key." }, { status: 404 });
  }
  return Response.json({ ok: true, vault: snapshot });
}
