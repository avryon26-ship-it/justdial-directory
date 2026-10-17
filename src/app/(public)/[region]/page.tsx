import type { Metadata } from "next";
import { RegionView } from "@/components/public/CategoriesViews";
import { areaLabel, resolveRegionSlug, searchListings } from "@/lib/data/queries";
import { buildSeedDb } from "@/lib/seed";

export function generateStaticParams() {
  return buildSeedDb().regions.map((r) => ({ region: r.slug }));
}

type Props = { params: Promise<{ region: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region: slug } = await params;
  const db = buildSeedDb();
  const res = resolveRegionSlug(slug, db);
  if (!res) return { title: "Place", robots: { index: false, follow: true } };
  const r = res.region;
  const name = r.type === "area" ? areaLabel(r.id, db) : r.name;
  const n = searchListings({ regionId: r.id }, db).length;
  const title = `Businesses in ${name}`;
  const description = `Find ${n} local businesses and services in ${name}: phone numbers, WhatsApp, timings and directions.`;
  return {
    title,
    description,
    alternates: { canonical: `/${r.slug}` },
    openGraph: { title, description, url: `/${r.slug}` },
    robots: n ? undefined : { index: false, follow: true },
  };
}

export default async function Page({ params }: Props) {
  const { region } = await params;
  return <RegionView regionSlug={region} />;
}
