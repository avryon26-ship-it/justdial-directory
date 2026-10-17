"use client";
import Link from "next/link";
import { Icon } from "@/components/shared/Icon";
import {
  areaLabel, countListingsByCategory, defaultState, districtOf, getCategory, listingPath, popularCategories, recentlyAdded, resultsPath, useDb, useUserLocation,
} from "@/lib/data";
import { siteConfig } from "@/config/site";
import { AZStrip } from "./AZStrip";
import { CategoryCard } from "./CategoryCard";
import { SearchBox } from "./SearchBox";

export function HomeView() {
  const db = useDb();
  const loc = useUserLocation();
  const popular = popularCategories(db, 12);
  const counts = countListingsByCategory(db, true);
  const recent = recentlyAdded(db, 6);
  const district = loc?.areaId ? districtOf(loc.areaId, db) : undefined;
  const regionSlug = district?.slug ?? defaultState(db)?.slug ?? "tamil-nadu";
  const published = db.listings.filter((l) => l.status === "published").length;

  return (
    <>
      <section className="relative overflow-hidden bg-navy text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/30" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-amber-400/10" />
        <div className="relative mx-auto max-w-4xl px-4 pb-14 pt-12 sm:pb-20 sm:pt-16">
          <p className="mx-auto w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">Tamil Nadu business directory</p>
          <h1 className="mt-4 text-center text-3xl font-bold tracking-tight sm:text-5xl">Find trusted <span className="text-amber-300">local businesses</span></h1>
          <p className="mx-auto mt-3 max-w-xl text-center text-base text-slate-300 sm:text-lg">
            Phone numbers, WhatsApp, timings and directions for {published.toLocaleString()} businesses across {db.regions.filter((r) => r.type === "area").length} areas of {siteConfig.regionName}.
          </p>
          <div className="mt-8 text-slate-900">
            <SearchBox />
          </div>
          <dl className="mt-8 grid grid-cols-3 gap-3 text-center">
            {[
              [published.toLocaleString(), "Businesses"],
              [String(db.categories.length), "Categories"],
              [String(db.regions.filter((r) => r.type === "area").length), "Areas"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-xl bg-white/10 px-2 py-3 ring-1 ring-white/10">
                <dd className="text-2xl font-bold text-white sm:text-3xl">{n}</dd>
                <dt className="text-xs uppercase tracking-wide text-slate-300">{l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12" aria-labelledby="az-title">
        <h2 id="az-title" className="border-l-4 border-amber-400 pl-3 text-xl font-semibold text-slate-900">Browse categories A to Z</h2>
        <p className="mb-4 mt-1 text-sm text-slate-600">Pick a letter to see the categories that start with it.</p>
        <AZStrip />
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12" aria-labelledby="pop-title">
        <div className="mb-4 flex items-end justify-between">
          <h2 id="pop-title" className="border-l-4 border-amber-400 pl-3 text-xl font-semibold text-slate-900">Popular categories</h2>
          <Link href="/categories" className="link text-sm">See all</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="popular-categories">
          {popular.map((c) => (
            <CategoryCard key={c.id} category={c} href={resultsPath(regionSlug, c.slug)} count={counts.get(c.id) ?? 0} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12" aria-labelledby="recent-title">
        <h2 id="recent-title" className="mb-4 border-l-4 border-amber-400 pl-3 text-xl font-semibold text-slate-900">Recently added</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="recent-list">
          {recent.map((l) => (
            <li key={l.id}>
              <Link href={listingPath(l, db)} className="card card-hover block h-full p-4">
                <span className="block font-semibold text-slate-900">{l.name}</span>
                <span className="mt-0.5 block text-sm text-slate-600">{getCategory(l.categoryId, db)?.name}</span>
                <span className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                  <Icon name="pin" size={14} className="text-accent" /> {areaLabel(l.areaId, db)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
