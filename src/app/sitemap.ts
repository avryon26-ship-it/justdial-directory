import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { buildSeedDb } from "@/lib/seed";
import { categoriesByLetter, districtOf, getCategory, listDistricts, listingPath, listStates } from "@/lib/data/queries";

/** Built from the seed data. A real backend would build this from the database. */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const db = buildSeedDb();
  const base = siteUrl();
  const now = new Date("2026-09-01");
  const urls: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, priority: 1 },
    { url: `${base}/categories`, lastModified: now, priority: 0.8 },
    { url: `${base}/regions`, lastModified: now, priority: 0.8 },
  ];
  for (const letter of categoriesByLetter(db).keys()) urls.push({ url: `${base}/categories/${letter.toLowerCase()}`, lastModified: now, priority: 0.6 });
  for (const s of listStates(db)) urls.push({ url: `${base}/${s.slug}`, lastModified: now, priority: 0.7 });
  const stateSlug = listStates(db)[0]?.slug ?? "tamil-nadu";
  const combos = new Set<string>();
  for (const l of db.listings) {
    if (l.status !== "published") continue;
    const d = districtOf(l.areaId, db);
    const c = getCategory(l.categoryId, db);
    if (!d || !c) continue;
    combos.add(`${d.slug}/${c.slug}`);
    combos.add(`${stateSlug}/${c.slug}`);
    urls.push({ url: `${base}${listingPath(l, db)}`, lastModified: new Date(l.updatedAt), priority: 0.5 });
  }
  for (const d of listDistricts(db)) urls.push({ url: `${base}/${d.slug}`, lastModified: now, priority: 0.7 });
  for (const combo of combos) urls.push({ url: `${base}/${combo}`, lastModified: now, priority: 0.7 });
  return urls;
}
