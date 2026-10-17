import type { Category, Db, LatLng, Listing, Region } from "../types";
import { distanceKm } from "../geo";
import { isOpenNow } from "../hours";
import { getDb } from "./store";

/* ------------------------------------------------------------------ *
 * Read-only queries. Every function takes an optional `db` so that the
 * same code runs on the server (seed data) and in the browser (live data).
 * ------------------------------------------------------------------ */

interface Index {
  regionById: Map<string, Region>;
  catById: Map<string, Category>;
  listingById: Map<string, Listing>;
  regionBySlug: Map<string, { item: Region; old: boolean }>;
  catBySlug: Map<string, { item: Category; old: boolean }>;
  listingBySlug: Map<string, { item: Listing; old: boolean }>;
}
const indexCache = new WeakMap<Db, Index>();

function slugMap<T extends { slug: string; slugHistory: string[] }>(items: T[]) {
  const m = new Map<string, { item: T; old: boolean }>();
  for (const item of items) for (const s of item.slugHistory) m.set(s, { item, old: true });
  for (const item of items) m.set(item.slug, { item, old: false });
  return m;
}

export function getIndex(db: Db = getDb()): Index {
  let idx = indexCache.get(db);
  if (!idx) {
    idx = {
      regionById: new Map(db.regions.map((r) => [r.id, r])),
      catById: new Map(db.categories.map((c) => [c.id, c])),
      listingById: new Map(db.listings.map((l) => [l.id, l])),
      regionBySlug: slugMap(db.regions),
      catBySlug: slugMap(db.categories),
      listingBySlug: slugMap(db.listings),
    };
    indexCache.set(db, idx);
  }
  return idx;
}

/* ---------------------------- categories --------------------------- */

export function categoryLetter(name: string): string {
  const m = name.trim().toUpperCase().match(/[A-Z]/);
  return m ? m[0] : "#";
}

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function listCategories(db: Db = getDb()): Category[] {
  return [...db.categories].sort((a, b) => a.order - b.order);
}

export function listCategoriesAZ(db: Db = getDb()): Category[] {
  return [...db.categories].sort((a, b) => a.name.localeCompare(b.name));
}

export function getCategory(id: string, db: Db = getDb()): Category | undefined {
  return getIndex(db).catById.get(id);
}

export function resolveCategorySlug(slug: string, db: Db = getDb()) {
  const hit = getIndex(db).catBySlug.get(slug);
  return hit ? { category: hit.item, isOld: hit.old } : null;
}

export function categoriesByLetter(db: Db = getDb()): Map<string, Category[]> {
  const m = new Map<string, Category[]>();
  for (const c of listCategories(db)) {
    const l = categoryLetter(c.name);
    m.set(l, [...(m.get(l) ?? []), c]);
  }
  return m;
}

export function popularCategories(db: Db = getDb(), limit = 12): Category[] {
  return listCategories(db).filter((c) => c.popular).slice(0, limit);
}

export function countListingsByCategory(db: Db = getDb(), publishedOnly = false): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of db.listings) {
    if (publishedOnly && l.status !== "published") continue;
    m.set(l.categoryId, (m.get(l.categoryId) ?? 0) + 1);
  }
  return m;
}

/* ----------------------------- regions ----------------------------- */

export function listStates(db: Db = getDb()): Region[] {
  return db.regions.filter((r) => r.type === "state").sort((a, b) => a.name.localeCompare(b.name));
}
export function listDistricts(db: Db = getDb(), stateId?: string): Region[] {
  return db.regions
    .filter((r) => r.type === "district" && (!stateId || r.parentId === stateId))
    .sort((a, b) => a.name.localeCompare(b.name));
}
export function listAreas(db: Db = getDb(), districtId?: string): Region[] {
  return db.regions
    .filter((r) => r.type === "area" && (!districtId || r.parentId === districtId))
    .sort((a, b) => a.name.localeCompare(b.name));
}
export function getRegion(id: string, db: Db = getDb()): Region | undefined {
  return getIndex(db).regionById.get(id);
}
export function defaultState(db: Db = getDb()): Region | undefined {
  return listStates(db)[0];
}
export function resolveRegionSlug(slug: string, db: Db = getDb()) {
  const hit = getIndex(db).regionBySlug.get(slug);
  return hit ? { region: hit.item, isOld: hit.old } : null;
}
export function districtOf(areaOrDistrictId: string, db: Db = getDb()): Region | undefined {
  const r = getRegion(areaOrDistrictId, db);
  if (!r) return undefined;
  if (r.type === "district") return r;
  if (r.type === "area" && r.parentId) return getRegion(r.parentId, db);
  return undefined;
}
export function stateOf(regionId: string, db: Db = getDb()): Region | undefined {
  let r = getRegion(regionId, db);
  while (r && r.type !== "state") r = r.parentId ? getRegion(r.parentId, db) : undefined;
  return r;
}
/** "Palayamkottai, Tirunelveli" */
export function areaLabel(areaId: string, db: Db = getDb()): string {
  const a = getRegion(areaId, db);
  if (!a) return "";
  const d = districtOf(a.id, db);
  return a.type === "area" && d ? `${a.name}, ${d.name}` : a.name;
}
/** Ids of every area that belongs to a region (state, district or the area itself). */
export function areaIdsIn(regionId: string, db: Db = getDb()): Set<string> {
  const r = getRegion(regionId, db);
  const out = new Set<string>();
  if (!r) return out;
  if (r.type === "area") out.add(r.id);
  else {
    const districtIds = r.type === "district" ? [r.id] : db.regions.filter((x) => x.type === "district" && x.parentId === r.id).map((x) => x.id);
    for (const a of db.regions) if (a.type === "area" && a.parentId && districtIds.includes(a.parentId)) out.add(a.id);
  }
  return out;
}

export function nearestArea(loc: LatLng, db: Db = getDb()): { area: Region; km: number } | null {
  let best: { area: Region; km: number } | null = null;
  for (const a of db.regions) {
    if (a.type !== "area" || a.lat == null || a.lng == null) continue;
    const km = distanceKm(loc, { lat: a.lat, lng: a.lng });
    if (!best || km < best.km) best = { area: a, km };
  }
  return best;
}

export function nearbyAreas(areaId: string, db: Db = getDb(), limit = 5): { area: Region; km: number }[] {
  const base = getRegion(areaId, db);
  if (!base || base.lat == null || base.lng == null) return [];
  const here = { lat: base.lat, lng: base.lng };
  return db.regions
    .filter((a) => a.type === "area" && a.id !== areaId && a.lat != null && a.lng != null)
    .map((a) => ({ area: a, km: distanceKm(here, { lat: a.lat!, lng: a.lng! }) }))
    .sort((x, y) => x.km - y.km)
    .slice(0, limit);
}

export function districtCentre(districtId: string, db: Db = getDb()): LatLng | null {
  const d = getRegion(districtId, db);
  if (d?.lat != null && d.lng != null) return { lat: d.lat, lng: d.lng };
  return null;
}

export function nearbyDistricts(districtId: string, db: Db = getDb(), limit = 3): { district: Region; km: number }[] {
  const c = districtCentre(districtId, db);
  if (!c) return [];
  return listDistricts(db)
    .filter((d) => d.id !== districtId && d.lat != null && d.lng != null)
    .map((d) => ({ district: d, km: distanceKm(c, { lat: d.lat!, lng: d.lng! }) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}

export function resolveWhere(text: string, db: Db = getDb()): Region | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  const head = t.split(",")[0].trim();
  const regs = db.regions;
  return (
    regs.find((r) => r.name.toLowerCase() === head && r.type === "area") ??
    regs.find((r) => r.name.toLowerCase() === head) ??
    regs.find((r) => r.type !== "state" && r.name.toLowerCase().startsWith(head)) ??
    regs.find((r) => r.name.toLowerCase().includes(head)) ??
    null
  );
}

/* ----------------------------- listings ---------------------------- */

export function getListing(id: string, db: Db = getDb()): Listing | undefined {
  return getIndex(db).listingById.get(id);
}

export function resolveListingSlug(slug: string, db: Db = getDb()) {
  const hit = getIndex(db).listingBySlug.get(slug);
  return hit ? { listing: hit.item, isOld: hit.old } : null;
}

/** Canonical public path of a listing, e.g. /tirunelveli/doctors/sri-vel-clinic */
export function listingPath(l: Listing, db: Db = getDb()): string {
  const d = districtOf(l.areaId, db);
  const c = getCategory(l.categoryId, db);
  return `/${d?.slug ?? "tamil-nadu"}/${c?.slug ?? "all"}/${l.slug}`;
}

export function resultsPath(regionSlug: string, categorySlug: string, params?: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  if (params) for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const s = qs.toString();
  return `/${regionSlug}/${categorySlug}${s ? `?${s}` : ""}`;
}

export function listingDistrict(l: Listing, db: Db = getDb()): Region | undefined {
  return districtOf(l.areaId, db);
}

export interface SearchParams {
  q?: string;
  categoryId?: string;
  regionId?: string;
  areaId?: string;
  openNow?: boolean;
  hasPhone?: boolean;
  hasWhatsapp?: boolean;
  sort?: "relevance" | "distance" | "az";
  userLoc?: LatLng | null;
  includeDrafts?: boolean;
}

export interface SearchHit {
  listing: Listing;
  distanceKm: number | null;
  open: boolean | null;
}

export function searchListings(params: SearchParams = {}, db: Db = getDb()): SearchHit[] {
  const idx = getIndex(db);
  const scope = params.areaId ? areaIdsIn(params.areaId, db) : params.regionId ? areaIdsIn(params.regionId, db) : null;
  const words = (params.q ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  const hits: (SearchHit & { score: number })[] = [];

  for (const l of db.listings) {
    if (!params.includeDrafts && l.status !== "published") continue;
    if (params.categoryId && l.categoryId !== params.categoryId) continue;
    if (scope && !scope.has(l.areaId)) continue;
    if (params.hasPhone && l.phones.length === 0) continue;
    if (params.hasWhatsapp && !l.whatsapp) continue;
    let open: boolean | null = null;
    if (params.openNow) {
      open = isOpenNow(l.timings);
      if (!open) continue;
    }
    let score = 0;
    if (words.length) {
      const name = l.name.toLowerCase();
      const cat = idx.catById.get(l.categoryId)?.name.toLowerCase() ?? "";
      const area = idx.regionById.get(l.areaId)?.name.toLowerCase() ?? "";
      const hay = `${name} ${cat} ${area} ${l.address.toLowerCase()}`;
      if (!words.every((w) => hay.includes(w))) continue;
      for (const w of words) {
        if (name.startsWith(w)) score += 50;
        else if (name.includes(` ${w}`)) score += 40;
        else if (name.includes(w)) score += 30;
        if (cat.includes(w)) score += 20;
        if (area.includes(w)) score += 8;
      }
    }
    score += (l.featured ? 1000 : 0) + (l.phones.length ? 3 : 0) + (l.photos.length ? 2 : 0) + (l.description ? 1 : 0);
    let km: number | null = null;
    if (params.userLoc && l.lat != null && l.lng != null) km = distanceKm(params.userLoc, { lat: l.lat, lng: l.lng });
    hits.push({ listing: l, distanceKm: km, open, score });
  }

  const sort = params.sort === "distance" && !params.userLoc ? "relevance" : params.sort ?? "relevance";
  if (sort === "az") hits.sort((a, b) => a.listing.name.localeCompare(b.listing.name));
  else if (sort === "distance")
    hits.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || a.listing.name.localeCompare(b.listing.name));
  else hits.sort((a, b) => b.score - a.score || b.listing.createdAt.localeCompare(a.listing.createdAt) || a.listing.name.localeCompare(b.listing.name));
  return hits;
}

export function recentlyAdded(db: Db = getDb(), limit = 6): Listing[] {
  return db.listings
    .filter((l) => l.status === "published")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function relatedListings(l: Listing, db: Db = getDb(), limit = 4): Listing[] {
  const same = db.listings.filter((x) => x.id !== l.id && x.status === "published" && x.categoryId === l.categoryId);
  const area = same.filter((x) => x.areaId === l.areaId);
  const district = districtOf(l.areaId, db);
  const inDistrict = same.filter((x) => x.areaId !== l.areaId && districtOf(x.areaId, db)?.id === district?.id);
  return [...area, ...inDistrict].slice(0, limit);
}

export interface Suggestion {
  type: "category" | "listing" | "area" | "district";
  label: string;
  sub?: string;
  id: string;
}

export function suggestWhat(q: string, db: Db = getDb(), limit = 8): Suggestion[] {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  const cats = listCategoriesAZ(db)
    .filter((c) => c.name.toLowerCase().includes(t))
    .sort((a, b) => Number(b.name.toLowerCase().startsWith(t)) - Number(a.name.toLowerCase().startsWith(t)))
    .slice(0, 5)
    .map<Suggestion>((c) => ({ type: "category", label: c.name, sub: "Category", id: c.id }));
  const listings = db.listings
    .filter((l) => l.status === "published" && l.name.toLowerCase().includes(t))
    .slice(0, limit - cats.length)
    .map<Suggestion>((l) => ({ type: "listing", label: l.name, sub: getCategory(l.categoryId, db)?.name, id: l.id }));
  return [...cats, ...listings].slice(0, limit);
}

export function suggestWhere(q: string, db: Db = getDb(), limit = 8): Suggestion[] {
  const t = q.trim().toLowerCase();
  const regs = db.regions.filter((r) => r.type !== "state");
  const list = t ? regs.filter((r) => r.name.toLowerCase().includes(t)) : regs.filter((r) => r.type === "district");
  return list
    .sort((a, b) => Number(b.name.toLowerCase().startsWith(t)) - Number(a.name.toLowerCase().startsWith(t)) || (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "district" ? -1 : 1))
    .slice(0, limit)
    .map<Suggestion>((r) => ({
      type: r.type === "district" ? "district" : "area",
      label: r.type === "area" ? areaLabel(r.id, db) : r.name,
      sub: r.type === "district" ? "District" : "Area",
      id: r.id,
    }));
}

/* ----------------------------- admin ------------------------------ */

export function listingProblems(db: Db = getDb()) {
  const noPhone: Listing[] = [];
  const noCategory: Listing[] = [];
  const noCoords: Listing[] = [];
  const idx = getIndex(db);
  for (const l of db.listings) {
    if (l.phones.length === 0) noPhone.push(l);
    if (!l.categoryId || !idx.catById.has(l.categoryId)) noCategory.push(l);
    if (l.lat == null || l.lng == null) noCoords.push(l);
  }
  return { noPhone, noCategory, noCoords };
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
export function normPhone(p: string): string {
  const d = p.replace(/\D/g, "");
  return d.length > 10 ? d.slice(-10) : d;
}

/** Existing listings that look like the same business (same name and a shared phone or address). */
export function findDuplicates(
  input: { name: string; phones: string[]; address: string },
  excludeId?: string,
  db: Db = getDb(),
): Listing[] {
  const n = norm(input.name);
  if (!n) return [];
  const phones = new Set(input.phones.map(normPhone).filter(Boolean));
  const addr = norm(input.address);
  return db.listings.filter((l) => {
    if (l.id === excludeId || norm(l.name) !== n) return false;
    const samePhone = l.phones.some((p) => phones.has(normPhone(p)));
    const sameAddr = !!addr && norm(l.address) === addr;
    return samePhone || sameAddr;
  });
}

export function adminSearchListings(
  p: { q?: string; status?: string; categoryId?: string; districtId?: string; problem?: string },
  db: Db = getDb(),
): Listing[] {
  const t = (p.q ?? "").trim().toLowerCase();
  const scope = p.districtId ? areaIdsIn(p.districtId, db) : null;
  const idx = getIndex(db);
  return db.listings
    .filter((l) => {
      if (p.status && l.status !== p.status) return false;
      if (p.categoryId && l.categoryId !== p.categoryId) return false;
      if (scope && !scope.has(l.areaId)) return false;
      if (p.problem === "phone" && l.phones.length) return false;
      if (p.problem === "coords" && l.lat != null && l.lng != null) return false;
      if (p.problem === "category" && idx.catById.has(l.categoryId)) return false;
      if (t) {
        const hay = `${l.name} ${l.address} ${l.phones.join(" ")}`.toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
