import { getMatchDetail } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const detail = await getMatchDetail(id);
  if (!detail) {
    return Response.json({ ok: false, error: "No such match in the registry." }, { status: 404 });
  }
  return Response.json({ ok: true, detail, serverTime: new Date().toISOString() });
}
