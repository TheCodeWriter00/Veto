import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MatchRoom } from "@/components/MatchRoom";
import { getMatchDetail } from "@/lib/data";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = await getMatchDetail(id);
  if (!detail) return { title: "Chamber not found — VETO" };
  return {
    title: `${detail.code} · ${detail.title} — VETO`,
    description: detail.brief.slice(0, 180),
  };
}

export default async function MatchPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await getMatchDetail(id);
  if (!detail) notFound();
  return <MatchRoom initial={detail} />;
}
