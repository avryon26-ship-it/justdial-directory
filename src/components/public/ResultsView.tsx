"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { Breadcrumbs, type Crumb } from "@/components/shared/Breadcrumbs";
import {
  areaLabel, defaultState, districtOf, getRegion, listAreas, listCategoriesAZ, listDistricts, listStates, nearbyAreas, nearbyDistricts,
  popularCategories, resolveCategorySlug, resolveRegionSlug, resolveWhere, resultsPath, searchListings, stateOf, useDb, useUserLocation,
  type SearchParams,
} from "@/lib/data";
import type { Region } from "@/lib/types";
import { siteConfig } from "@/config/site";
import { ListingCard } from "./ListingCard";
import { LocationButton } from "./LocationButton";
import { NotFoundBlock } from "./NotFoundBlock";

/**
 * Category results page (/[region]/[category]) and free search page (/search?q=&where=).
 * `categorySlug === null` means free search.
 */
export function ResultsView({ regionSlug, categorySlug }: { regionSlug: string; categorySlug: string | null }) {
  const db = useDb();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const loc = useUserLocation();
  const searchMode = categorySlug === null;
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = sp.get("q") ?? "";
  const whereParam = sp.get("where") ?? "";
  const areaParam = sp.get("area") ?? "";
  const openNow = sp.get("open") === "1";
  const hasPhone = sp.get("phone") === "1";
  const hasWa = sp.get("wa") === "1";
  const sortParam = sp.get("sort");

  /* ---- resolve places and category (old slugs are redirected) ---- */
  const regionRes = searchMode
    ? whereParam
      ? (resolveRegionSlug(whereParam, db) ?? (() => { const r = resolveWhere(whereParam, db); return r ? { region: r, isOld: false } : null; })())
      : null
    : resolveRegionSlug(regionSlug, db);
  const catRes = searchMode ? null : resolveCategorySlug(categorySlug!, db);
  const region = regionRes?.region ?? null;
  const category = catRes?.category ?? null;

  const areaFromParam = areaParam ? resolveRegionSlug(areaParam, db)?.region : undefined;
  const area: Region | null = region?.type === "area" ? region : areaFromParam?.type === "area" ? areaFromParam : null;
  const district: Region | null = area ? (districtOf(area.id, db) ?? null) : region?.type === "district" ? region : null;
  const state: Region | null = (district ? stateOf(district.id, db) : region?.type === "state" ? region : defaultState(db)) ?? null;

  useEffect(() => {
    if (searchMode) return;
    if ((regionRes?.isOld || catRes?.isOld) && region && category) {
      const keep = new URLSearchParams(sp.toString()).toString();
      router.replace(`/${region.slug}/${category.slug}${keep ? `?${keep}` : ""}`);
    }
  }, [searchMode, regionRes?.isOld, catRes?.isOld, region, category, router, sp]);

  const sort: NonNullable<SearchParams["sort"]> = sortParam === "az" ? "az" : sortParam === "relevance" ? "relevance" : sortParam === "distance" && loc ? "distance" : loc ? "distance" : "relevance";

  const hits = useMemo(
    () =>
      searchListings(
        {
          q: searchMode ? q : undefined,
          categoryId: category?.id,
          regionId: area ? undefined : (region?.id ?? undefined),
          areaId: area?.id,
          openNow,
          hasPhone,
          hasWhatsapp: hasWa,
          sort,
          userLoc: loc ? { lat: loc.lat, lng: loc.lng } : null,
        },
        db,
      ),
    [db, searchMode, q, category?.id, region?.id, area, openNow, hasPhone, hasWa, sort, loc],
  );

  if (!searchMode && !regionRes) return <NotFoundBlock title="We could not find this place" text="The link may be old or mistyped. Try browsing the places we cover." />;
  if (!searchMode && !catRes) return <NotFoundBlock title="We could not find this category" text="The link may be old or mistyped. Try browsing all categories." />;

  /* ---- URL helpers ---- */
  const placeName = area ? areaLabel(area.id, db) : (district?.name ?? state?.name ?? "Tamil Nadu");
  const pathRegionSlug = (r: Region | null) => (r ? (r.type === "area" ? (districtOf(r.id, db)?.slug ?? "") : r.slug) : (defaultState(db)?.slug ?? "tamil-nadu"));
  const keepToggles = { open: openNow ? "1" : undefined, phone: hasPhone ? "1" : undefined, wa: hasWa ? "1" : undefined, sort: sortParam ?? undefined };

  function setParams(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const s = next.toString();
    router.replace(`${pathname}${s ? `?${s}` : ""}`, { scroll: false });
  }
  function goPlace(r: Region | null, areaSlug?: string) {
    if (searchMode) {
      setParams({ where: areaSlug ?? r?.slug, area: undefined });
      return;
    }
    router.push(resultsPath(pathRegionSlug(r), category!.slug, { ...keepToggles, area: areaSlug }));
  }
  function goCategory(slug: string) {
    if (!slug) {
      const where = area?.slug ?? district?.slug ?? state?.slug;
      router.push(`/search?where=${where ?? ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`);
      return;
    }
    router.push(resultsPath(pathRegionSlug(region), slug, { ...keepToggles, area: area && region?.type !== "area" ? area.slug : undefined }));
  }

  const states = listStates(db);
  const districts = listDistricts(db, state?.id);
  const areas = district ? listAreas(db, district.id) : [];
  const categories = listCategoriesAZ(db);

  /* ---- headings ---- */
  const h1 = searchMode
    ? q
      ? `Results for "${q}"${region ? ` in ${placeName}` : ""}`
      : `Businesses in ${placeName}`
    : `${category!.name} in ${placeName}`;
  const crumbs: Crumb[] = [{ label: "Home", href: "/" }];
  if (district) crumbs.push({ label: district.name, href: `/${district.slug}` });
  else if (state) crumbs.push({ label: state.name, href: `/${state.slug}` });
  if (category) crumbs.push({ label: category.name, href: area && region?.type !== "area" ? resultsPath(pathRegionSlug(region), category.slug) : undefined });
  else crumbs.push({ label: "Search" });
  if (area && category) crumbs.push({ label: area.name });

  const activeCount = [openNow, hasPhone, hasWa].filter(Boolean).length;
  const filterSig = [category?.id, region?.id, area?.id, q, openNow, hasPhone, hasWa, sort].join("|");

  const whereUnknown = searchMode && whereParam && !region;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {hits.length === 0 && <meta name="robots" content="noindex, follow" />}
      <Breadcrumbs items={crumbs} />
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl" data-testid="results-h1">{h1}</h1>
      <p className="mt-1 text-slate-600" data-testid="results-count" aria-live="polite">
        {hits.length} {hits.length === 1 ? "business" : "businesses"} found
        {sort === "distance" && loc ? `, nearest first (from ${loc.label})` : ""}
      </p>
      {whereUnknown && (
        <p role="note" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          We could not find a place called &ldquo;{whereParam}&rdquo;, so we are showing results from everywhere.
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="card h-fit self-start lg:sticky lg:top-24" data-testid="filters">
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="filter-body"
            onClick={() => setFiltersOpen((o) => !o)}
            className="flex min-h-12 w-full items-center justify-between px-4 font-semibold lg:pointer-events-none"
            data-testid="filters-toggle"
          >
            <span className="flex items-center gap-2"><Icon name="filter" size={18} /> Filters{activeCount ? ` (${activeCount})` : ""}</span>
            <Icon name={filtersOpen ? "chevronUp" : "chevronDown"} size={18} className="lg:hidden" />
          </button>
          <div id="filter-body" className={`${filtersOpen ? "block" : "hidden"} space-y-4 border-t border-slate-100 p-4 lg:block`}>
            <div>
              <label className="label" htmlFor="f-state">State</label>
              <select id="f-state" className="input" value={state?.id ?? ""} onChange={(e) => goPlace(getRegion(e.target.value, db) ?? null)}>
                {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-district">District</label>
              <select id="f-district" className="input" value={district?.id ?? ""} onChange={(e) => goPlace(e.target.value ? (getRegion(e.target.value, db) ?? null) : state)}>
                <option value="">All districts</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-area">Area</label>
              <select
                id="f-area"
                className="input"
                disabled={!district}
                value={area?.id ?? ""}
                onChange={(e) => {
                  const a = getRegion(e.target.value, db);
                  if (searchMode) setParams({ where: a?.slug ?? district?.slug, area: undefined });
                  else goPlace(district, a?.slug);
                }}
              >
                <option value="">{district ? "All areas" : "Choose a district first"}</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-cat">Category</label>
              <select id="f-cat" className="input" value={category?.slug ?? ""} onChange={(e) => goCategory(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <fieldset className="space-y-1">
              <legend className="label">Show only</legend>
              <Toggle id="f-open" label="Open now" checked={openNow} onChange={(v) => setParams({ open: v ? "1" : undefined })} />
              <Toggle id="f-phone" label="Has phone number" checked={hasPhone} onChange={(v) => setParams({ phone: v ? "1" : undefined })} />
              <Toggle id="f-wa" label="Has WhatsApp" checked={hasWa} onChange={(v) => setParams({ wa: v ? "1" : undefined })} />
            </fieldset>
            <div>
              <label className="label" htmlFor="f-sort">Sort by</label>
              <select id="f-sort" className="input" value={sort} onChange={(e) => setParams({ sort: e.target.value })}>
                <option value="relevance">Relevance</option>
                <option value="distance" disabled={!loc}>{loc ? "Distance (nearest first)" : "Distance (turn on location)"}</option>
                <option value="az">Name A to Z</option>
              </select>
            </div>
            {!loc && <LocationButton />}
            {activeCount > 0 && (
              <button type="button" className="btn btn-ghost w-full" onClick={() => setParams({ open: undefined, phone: undefined, wa: undefined })}>
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div>
          <ResultsList key={filterSig} hits={hits} />
          {!searchMode && category && (
            <NearbyBlock
              categoryId={category.id}
              categorySlug={category.slug}
              areaId={area?.id}
              districtId={district?.id}
              pathRegionSlug={pathRegionSlug}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 text-base text-slate-800">
      <input id={id} type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function ResultsList({ hits }: { hits: ReturnType<typeof searchListings> }) {
  const db = useDb();
  const [shown, setShown] = useState(siteConfig.pageSize);
  if (hits.length === 0) return <EmptyState />;
  return (
    <>
      <ul className="space-y-4" data-testid="results-list">
        {hits.slice(0, shown).map((h) => (
          <li key={h.listing.id}>
            <ListingCard listing={h.listing} db={db} distanceKm={h.distanceKm} open={h.open} />
          </li>
        ))}
      </ul>
      {shown < hits.length && (
        <div className="mt-6 text-center">
          <button type="button" className="btn btn-secondary btn-lg" onClick={() => setShown((s) => s + siteConfig.pageSize)} data-testid="load-more">
            Show more ({hits.length - shown} remaining)
          </button>
        </div>
      )}
    </>
  );
}

function EmptyState() {
  const db = useDb();
  const state = defaultState(db);
  return (
    <div className="card p-8 text-center" data-testid="empty-state">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500"><Icon name="search" size={24} /></div>
      <h2 className="mt-4 text-lg font-semibold">No businesses match yet</h2>
      <p className="mx-auto mt-1 max-w-md text-slate-600">Try removing a filter, choosing a nearby area or searching for a different category.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {popularCategories(db, 6).map((c) => (
          <Link key={c.id} href={resultsPath(state?.slug ?? "tamil-nadu", c.slug)} className="chip px-3 py-1.5 text-sm hover:bg-slate-200">{c.name}</Link>
        ))}
      </div>
    </div>
  );
}

function NearbyBlock({
  categoryId, categorySlug, areaId, districtId, pathRegionSlug,
}: { categoryId: string; categorySlug: string; areaId?: string; districtId?: string; pathRegionSlug: (r: Region | null) => string }) {
  const db = useDb();
  const items: { key: string; label: string; href: string; count: number; km: number }[] = [];
  if (areaId) {
    for (const n of nearbyAreas(areaId, db, 12)) {
      const count = searchListings({ categoryId, areaId: n.area.id }, db).length;
      if (count) items.push({ key: n.area.id, label: n.area.name, href: resultsPath(pathRegionSlug(n.area), categorySlug, { area: n.area.slug }), count, km: n.km });
    }
  } else if (districtId) {
    for (const n of nearbyDistricts(districtId, db, 5)) {
      const count = searchListings({ categoryId, regionId: n.district.id }, db).length;
      if (count) items.push({ key: n.district.id, label: n.district.name, href: resultsPath(n.district.slug, categorySlug), count, km: n.km });
    }
  }
  if (items.length === 0) return null;
  return (
    <section className="mt-10" aria-labelledby="nearby">
      <h2 id="nearby" className="mb-3 text-lg font-semibold">Also search in nearby {areaId ? "areas" : "districts"}</h2>
      <ul className="flex flex-wrap gap-2">
        {items.slice(0, 6).map((i) => (
          <li key={i.key}>
            <Link href={i.href} className="card card-hover flex min-h-11 items-center gap-2 px-4 py-2 text-sm">
              <span className="font-medium">{i.label}</span>
              <span className="text-slate-600">{i.count} listing{i.count === 1 ? "" : "s"}, {Math.round(i.km)} km</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
