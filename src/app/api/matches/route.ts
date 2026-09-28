import { createMatch, getLiveMatches, getResolvedMatches } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const [live, resolved] = await Promise.all([getLiveMatches(), getResolvedMatches(12)]);
  return Response.json({ ok: true, live, resolved });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return Response.json({ ok: false, error: "Malformed request body." }, { status: 400 });
  }

  const read = (key: string, max: number): string =>
    typeof body[key] === "string" ? (body[key] as string).trim().slice(0, max) : "";

  const title = read("title", 120).toUpperCase();
  const brief = read("brief", 900);
  const category = read("category", 40).toUpperCase() || "OPEN";
  const openingA = read("openingA", 1600);
  const openingB = read("openingB", 1600);
  const scenarioSlug = read("scenarioSlug", 80);

  const problems: string[] = [];
  if (title.length < 4) problems.push("A dossier title of at least four characters is required.");
  if (brief.length < 20) problems.push("The scenario brief must run at least twenty characters.");
  if (openingA.length < 20) problems.push("Side A needs an opening position of substance.");
  if (openingB.length < 20) problems.push("Side B needs an opening position of substance.");

  if (problems.length > 0) {
    return Response.json({ ok: false, errors: problems }, { status: 422 });
  }

  const created = await createMatch({
    title,
    brief,
    category,
    openingA,
    openingB,
    scenarioSlug: scenarioSlug || undefined,
  });

  if (!created) {
    return Response.json(
      { ok: false, error: "The registry could not mint a match code. Retry." },
      { status: 500 },
    );
  }

  return Response.json({ ok: true, ...created }, { status: 201 });
}
