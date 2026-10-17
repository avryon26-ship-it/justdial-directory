import type { Db, Region, RegionType } from "../types";
import { newId, uniqueSlug } from "../slug";
import { commit, getDb } from "./store";
import { requireSession } from "./auth";
import { DataError, withLog } from "./write";
import { areaIdsIn } from "./queries";

function taken(db: Db, exceptId?: string) {
  const s = new Set<string>();
  for (const r of db.regions) {
    if (r.id === exceptId) continue;
    s.add(r.slug);
    r.slugHistory.forEach((h) => s.add(h));
  }
  // Names that are fixed routes can never be region slugs.
  ["admin", "categories", "regions", "search", "sitemap", "robots"].forEach((x) => s.add(x));
  return s;
}

export interface RegionInput {
  type: RegionType;
  name: string;
  parentId: string | null;
  lat?: number;
  lng?: number;
}

export function createRegion(input: RegionInput): Region {
  const who = requireSession();
  const db = getDb();
  const name = input.name.trim();
  if (!name) throw new DataError("Please type a name.");
  if (input.type !== "state") {
    const parent = db.regions.find((r) => r.id === input.parentId);
    if (!parent || (input.type === "district" && parent.type !== "state") || (input.type === "area" && parent.type !== "district"))
      throw new DataError(input.type === "district" ? "Please choose a state." : "Please choose a district.");
  }
  if (input.type === "area" && (input.lat == null || input.lng == null || Number.isNaN(input.lat) || Number.isNaN(input.lng)))
    throw new DataError("Please enter the latitude and longitude of this area.");
  const region: Region = {
    id: newId(input.type[0]),
    type: input.type,
    name,
    slug: uniqueSlug(name, taken(db), input.type === "area" ? [db.regions.find((r) => r.id === input.parentId)?.slug ?? ""] : []),
    slugHistory: [],
    parentId: input.type === "state" ? null : input.parentId,
    lat: input.lat,
    lng: input.lng,
  };
  commit(withLog({ ...db, regions: [...db.regions, region] }, who, "create", name, `Added ${input.type}`), ["regions", "activity"]);
  return region;
}

export function updateRegion(id: string, patch: { name: string; lat?: number; lng?: number }): Region {
  const who = requireSession();
  const db = getDb();
  const old = db.regions.find((r) => r.id === id);
  if (!old) throw new DataError("This place no longer exists.");
  const name = patch.name.trim();
  if (!name) throw new DataError("Please type a name.");
  let { slug, slugHistory } = old;
  if (name !== old.name) {
    const fresh = uniqueSlug(name, taken(db, id));
    if (fresh !== old.slug) {
      slugHistory = [...old.slugHistory.filter((h) => h !== fresh), old.slug];
      slug = fresh;
    }
  }
  const updated: Region = { ...old, name, slug, slugHistory, lat: patch.lat, lng: patch.lng };
  commit(withLog({ ...db, regions: db.regions.map((r) => (r.id === id ? updated : r)) }, who, "update", name, `Edited ${old.type}`), ["regions", "activity"]);
  return updated;
}

export function deleteRegion(id: string) {
  const who = requireSession(["owner"]);
  const db = getDb();
  const r = db.regions.find((x) => x.id === id);
  if (!r) return;
  if (db.regions.some((x) => x.parentId === id)) throw new DataError(`"${r.name}" still contains other places. Remove those first.`);
  if (r.type === "area") {
    const n = db.listings.filter((l) => l.areaId === id).length;
    if (n) throw new DataError(`${n} listing(s) are in "${r.name}". Move or delete them first.`);
  }
  if (r.type !== "area" && areaIdsIn(id, db).size) throw new DataError(`"${r.name}" still contains areas.`);
  commit(withLog({ ...db, regions: db.regions.filter((x) => x.id !== id) }, who, "delete", r.name, `Deleted ${r.type}`), ["regions", "activity"]);
}
