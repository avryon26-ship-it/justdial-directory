"use client";
import Link from "next/link";
import {
  ALPHABET, areaIdsIn, areaLabel, categoriesByLetter, countListingsByCategory, defaultState, getCategory, listAreas, listCategories,
  listDistricts, listStates, listingPath, recentlyAdded, resolveRegionSlug, resultsPath, searchListings, useDb,
} from "@/lib/data";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { CategoryCard } from "./CategoryCard";
import { NotFoundBlock } from "./NotFoundBlock";

function LetterNav({ active }: { active?: string }) {
  const db = useDb();
  const has = categoriesByLetter(db);
  return (
    <nav aria-label="Jump to letter" className="flex flex-wrap gap-1.5">
      {ALPHABET.map((l) =>
        has.has(l) ? (
          <Link
            key={l}
            href={`/categories/${l.toLowerCase()}`}
            aria-current={active === l ? "page" : undefined}
            className={`grid h-11 w-11 place-items-center rounded-lg border text-sm font-semibold ${active === l ? "border-accent bg-accent text-white" : "border-slate-300 bg-white hover:border-accent hover:text-accent"}`}
          >
            {l}
          </Link>
        ) : (
          <span key={l} aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-lg border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-400">
            {l}
          </span>
        ),
      )}
    </nav>
  );
}

export function CategoriesIndexView() {
  const db = useDb();
  const groups = categoriesByLetter(db);
  const counts = countListingsByCategory(db, true);
  const slug = defaultState(db)?.slug ?? "tamil-nadu";
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Categories" }]} />
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">All categories A to Z</h1>
      <p className="mb-5 mt-1 text-slate-600">{listCategories(db).length} categories. Choose a letter or scroll down.</p>
      <LetterNav />
      <div className="mt-8 space-y-8">
        {[...groups.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([letter, cats]) => (
            <section key={letter} aria-labelledby={`l-${letter}`}>
              <h2 id={`l-${letter}`} className="mb-3 text-xl font-semibold">
                <Link href={`/categories/${letter.toLowerCase()}`} className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-white">
                  {letter}
                </Link>
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cats.map((c) => (
                  <li key={c.id}>
                    <CategoryCard category={c} href={resultsPath(slug, c.slug)} count={counts.get(c.id) ?? 0} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </div>
    </div>
  );
}

export function LetterView({ letter }: { letter: string }) {
  const db = useDb();
  const L = letter.toUpperCase();
  const cats = categoriesByLetter(db).get(L) ?? [];
  const counts = countListingsByCategory(db, true);
  const slug = defaultState(db)?.slug ?? "tamil-nadu";
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {cats.length === 0 && <meta name="robots" content="noindex" />}
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Categories", href: "/categories" }, { label: L }]} />
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Categories starting with {L}</h1>
      <div className="my-5">
        <LetterNav active={L} />
      </div>
      {cats.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="letter-categories">
          {cats.map((c) => (
            <li key={c.id}>
              <CategoryCard category={c} href={resultsPath(slug, c.slug)} count={counts.get(c.id) ?? 0} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="card p-6 text-slate-700">No categories start with {L} yet. Try another letter above.</p>
      )}
    </div>
  );
}

export function RegionsIndexView() {
  const db = useDb();
  const states = listStates(db);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Places" }]} />
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Browse by place</h1>
      <div className="mt-6 space-y-10">
        {states.map((s) => (
          <section key={s.id} aria-labelledby={`s-${s.id}`}>
            <h2 id={`s-${s.id}`} className="mb-4 text-xl font-semibold">
              <Link href={`/${s.slug}`} className="hover:text-accent">{s.name}</Link>
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {listDistricts(db, s.id).map((d) => {
                const n = searchListings({ regionId: d.id }, db).length;
                return (
                  <div key={d.id} className="card p-4">
                    <h3 className="font-semibold">
                      <Link href={`/${d.slug}`} className="hover:text-accent hover:underline">{d.name}</Link>{" "}
                      <span className="text-sm font-normal text-slate-600">({n})</span>
                    </h3>
                    <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                      {listAreas(db, d.id).map((a) => (
                        <li key={a.id}><Link href={`/${a.slug}`} className="link">{a.name}</Link></li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/** /[region]: every category with listings in this state, district or area. */
export function RegionView({ regionSlug }: { regionSlug: string }) {
  const db = useDb();
  const res = resolveRegionSlug(regionSlug, db);
  if (!res) return <NotFoundBlock title="We could not find this place" text="The link may be old or mistyped. Try browsing the places we cover." />;
  const region = res.region;
  const hits = searchListings({ regionId: region.id }, db);
  const byCat = new Map<string, number>();
  for (const h of hits) byCat.set(h.listing.categoryId, (byCat.get(h.listing.categoryId) ?? 0) + 1);
  const cats = listCategories(db).filter((c) => byCat.has(c.id));
  const pathSlug = region.type === "area" ? (db.regions.find((r) => r.id === region.parentId)?.slug ?? region.slug) : region.slug;
  const subAreas = region.type === "district" ? listAreas(db, region.id) : [];
  const ids = areaIdsIn(region.id, db);
  const recent = recentlyAdded({ ...db, listings: db.listings.filter((l) => ids.has(l.areaId)) }, 4);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {hits.length === 0 && <meta name="robots" content="noindex" />}
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Places", href: "/regions" }, { label: region.name }]} />
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Businesses in {region.type === "area" ? areaLabel(region.id, db) : region.name}</h1>
      <p className="mt-1 text-slate-600">{hits.length} businesses in {cats.length} categories.</p>
      {subAreas.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Areas">
          {subAreas.map((a) => (
            <li key={a.id}><Link href={`/${a.slug}`} className="chip px-3 py-1.5 text-sm hover:bg-slate-200">{a.name}</Link></li>
          ))}
        </ul>
      )}
      {cats.length ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => (
            <li key={c.id}>
              <CategoryCard category={c} count={byCat.get(c.id)} href={resultsPath(pathSlug, c.slug, { area: region.type === "area" ? region.slug : undefined })} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="card mt-6 p-6 text-slate-700">No published businesses here yet.</p>
      )}
      {recent.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Recently added here</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {recent.map((l) => (
              <li key={l.id}>
                <Link className="card card-hover block p-4 font-medium" href={listingPath(l, db)}>
                  {l.name}
                  <span className="block text-sm font-normal text-slate-600">{getCategory(l.categoryId, db)?.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
