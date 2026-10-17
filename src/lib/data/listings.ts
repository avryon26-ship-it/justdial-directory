import type { Db, Listing, ListingInput } from "../types";
import { newId, uniqueSlug } from "../slug";
import { commit, getDb } from "./store";
import { requireSession } from "./auth";
import { DataError, withLog } from "./write";
import { getIndex, normPhone } from "./queries";

export function cleanPhones(phones: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of phones) {
    const n = normPhone(p);
    if (n && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}

export function validateListingInput(input: ListingInput, db: Db): string[] {
  const errors: string[] = [];
  const idx = getIndex(db);
  if (!input.name.trim()) errors.push("Please enter the business name.");
  if (!input.categoryId || !idx.catById.has(input.categoryId)) errors.push("Please choose a category.");
  if (!input.areaId || idx.regionById.get(input.areaId)?.type !== "area") errors.push("Please choose the area.");
  if (input.lat != null && (input.lat < -90 || input.lat > 90)) errors.push("Latitude must be between -90 and 90.");
  if (input.lng != null && (input.lng < -180 || input.lng > 180)) errors.push("Longitude must be between -180 and 180.");
  if (input.email && !/^\S+@\S+\.\S+$/.test(input.email.trim())) errors.push("The email address does not look right.");
  return errors;
}

function allSlugs(db: Db, exceptId?: string): Set<string> {
  const s = new Set<string>();
  for (const l of db.listings) {
    if (l.id === exceptId) continue;
    s.add(l.slug);
    l.slugHistory.forEach((h) => s.add(h));
  }
  return s;
}

export function makeListingSlug(db: Db, name: string, areaId: string, exceptId?: string): string {
  const area = getIndex(db).regionById.get(areaId);
  return uniqueSlug(name, allSlugs(db, exceptId), area ? [area.slug] : []);
}

function normalizeInput(input: ListingInput): ListingInput {
  return {
    ...input,
    name: input.name.trim(),
    address: input.address.trim(),
    phones: cleanPhones(input.phones),
    whatsapp: input.whatsapp ? normPhone(input.whatsapp) : "",
    email: input.email.trim(),
    website: input.website.trim(),
    timings: input.timings.trim(),
    description: input.description.trim(),
  };
}

export function createListing(raw: ListingInput): Listing {
  const who = requireSession();
  const db = getDb();
  const input = normalizeInput(raw);
  const errors = validateListingInput(input, db);
  if (errors.length) throw new DataError(errors[0]);
  const now = new Date().toISOString();
  const listing: Listing = {
    ...input,
    // Staff can only create drafts. The Owner publishes.
    status: who.role === "owner" ? input.status : "draft",
    id: newId("l"),
    slug: makeListingSlug(db, input.name, input.areaId),
    slugHistory: [],
    featured: false,
    createdAt: now,
    updatedAt: now,
    createdBy: who.name,
  };
  const next = withLog({ ...db, listings: [listing, ...db.listings] }, who, "create", listing.name, `Created as ${listing.status}`);
  commit(next, ["listings", "activity"]);
  return listing;
}

export function updateListing(id: string, raw: ListingInput): Listing {
  const who = requireSession();
  const db = getDb();
  const old = db.listings.find((l) => l.id === id);
  if (!old) throw new DataError("This listing no longer exists.");
  const input = normalizeInput(raw);
  const errors = validateListingInput(input, db);
  if (errors.length) throw new DataError(errors[0]);
  let slug = old.slug;
  let slugHistory = old.slugHistory;
  if (input.name !== old.name) {
    const fresh = makeListingSlug(db, input.name, input.areaId, id);
    if (fresh !== old.slug) {
      slugHistory = [...old.slugHistory.filter((h) => h !== fresh), old.slug];
      slug = fresh;
    }
  }
  const status = who.role === "owner" ? input.status : old.status;
  const updated: Listing = { ...old, ...input, status, slug, slugHistory, updatedAt: new Date().toISOString() };
  const action = old.status !== status ? (status === "published" ? "publish" : "unpublish") : "update";
  const next = withLog(
    { ...db, listings: db.listings.map((l) => (l.id === id ? updated : l)) },
    who,
    action,
    updated.name,
    action === "update" ? "Edited details" : `Status changed to ${status}`,
  );
  commit(next, ["listings", "activity"]);
  return updated;
}

export function deleteListing(id: string): void {
  const who = requireSession(["owner"]);
  const db = getDb();
  const l = db.listings.find((x) => x.id === id);
  if (!l) return;
  const next = withLog({ ...db, listings: db.listings.filter((x) => x.id !== id) }, who, "delete", l.name, "Deleted listing");
  commit(next, ["listings", "activity"]);
}

export function setListingStatus(id: string, status: "draft" | "published"): void {
  const who = requireSession(["owner"]);
  const db = getDb();
  const l = db.listings.find((x) => x.id === id);
  if (!l || l.status === status) return;
  const next = withLog(
    { ...db, listings: db.listings.map((x) => (x.id === id ? { ...x, status, updatedAt: new Date().toISOString() } : x)) },
    who,
    status === "published" ? "publish" : "unpublish",
    l.name,
    `Status changed to ${status}`,
  );
  commit(next, ["listings", "activity"]);
}
