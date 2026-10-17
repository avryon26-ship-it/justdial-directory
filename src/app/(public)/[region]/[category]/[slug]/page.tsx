import type { Metadata } from "next";
import { DetailView } from "@/components/public/DetailView";
import { areaLabel, getCategory, listingPath, resolveListingSlug } from "@/lib/data/queries";
import { buildSeedDb } from "@/lib/seed";

export function generateStaticParams() {
  const db = buildSeedDb();
  return db.listings.map((l) => {
    const hit = listingPath(l, db).split("/").filter(Boolean);
    return { region: hit[0], category: hit[1], slug: hit[2] };
  });
}

type Props = { params: Promise<{ region: string; category: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = buildSeedDb();
  const hit = resolveListingSlug(slug, db);
  if (!hit) return { title: "Business details", robots: { index: false, follow: true } };
  const l = hit.listing;
  const cat = getCategory(l.categoryId, db)?.name ?? "Business";
  const place = areaLabel(l.areaId, db);
  const title = `${l.name} - ${cat} in ${place}`;
  const description = `${l.name}, ${cat.toLowerCase()} in ${place}. ${l.phones[0] ? `Call ${l.phones[0]}. ` : ""}${l.timings ? `Open ${l.timings}. ` : ""}Address, map and directions.`.slice(0, 300);
  const canonical = listingPath(l, db);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
    robots: l.status === "published" ? undefined : { index: false, follow: false },
  };
}

export default async function Page({ params }: Props) {
  const { region, category, slug } = await params;
  return <DetailView regionSlug={region} categorySlug={category} slug={slug} />;
}
