import type { Metadata } from "next";
import { Suspense } from "react";
import { ResultsView } from "@/components/public/ResultsView";
import { areaLabel, resolveCategorySlug, resolveRegionSlug, searchListings } from "@/lib/data/queries";
import { buildSeedDb } from "@/lib/seed";

export function generateStaticParams() {
  const db = buildSeedDb();
  const out: { region: string; category: string }[] = [];
  for (const r of db.regions) for (const c of db.categories) out.push({ region: r.slug, category: c.slug });
  return out;
}

type Props = { params: Promise<{ region: string; category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region: rs, category: cs } = await params;
  const db = buildSeedDb();
  const r = resolveRegionSlug(rs, db);
  const c = resolveCategorySlug(cs, db);
  if (!r || !c) return { title: "Results", robots: { index: false, follow: true } };
  const place = r.region.type === "area" ? areaLabel(r.region.id, db) : r.region.name;
  const n = searchListings({ categoryId: c.category.id, regionId: r.region.id }, db).length;
  const title = `${c.category.name} in ${place}`;
  const description = n
    ? `Find ${n} ${c.category.name.toLowerCase()} in ${place}. Compare addresses, phone numbers, WhatsApp, timings and get directions.`
    : `Browse ${c.category.name.toLowerCase()} in ${place}.`;
  const canonical = `/${r.region.slug}/${c.category.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
    // Pages with no listings are not worth indexing.
    robots: n ? undefined : { index: false, follow: true },
  };
}

export default async function Page({ params }: Props) {
  const { region, category } = await params;
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10 text-slate-600">Loading results...</div>}>
      <ResultsView regionSlug={region} categorySlug={category} />
    </Suspense>
  );
}
