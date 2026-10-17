import type { Db, Listing, ListingStatus } from "../types";
import { newId, uniqueSlug } from "../slug";
import { commit, getDb } from "./store";
import { requireSession } from "./auth";
import { DataError, withLog } from "./write";
import { cleanPhones } from "./listings";
import { normPhone } from "./queries";

/** One spreadsheet row, every value as text, exactly as in the file. */
export interface ImportRaw {
  name: string;
  category: string;
  district: string;
  area: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  timings: string;
  description: string;
  latitude: string;
  longitude: string;
  status: string;
}

export const IMPORT_COLUMNS: (keyof ImportRaw)[] = [
  "name", "category", "district", "area", "address", "phone", "whatsapp", "email", "website", "timings", "description", "latitude", "longitude", "status",
];

export interface ImportRowState {
  rowNumber: number;
  raw: ImportRaw;
  skip: boolean;
  /** Import even though it looks like a duplicate. */
  allowDuplicate: boolean;
}

export interface RowIssue {
  field: keyof ImportRaw | "row";
  message: string;
  kind: "error" | "duplicate";
}

export interface ValidatedRow extends ImportRowState {
  issues: RowIssue[];
  warnings: string[];
  categoryId?: string;
  areaId?: string;
  /** True when the row will be imported as-is. */
  ready: boolean;
}

const n = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

export function validateImportRows(rows: ImportRowState[], db: Db = getDb()): ValidatedRow[] {
  const catByName = new Map<string, string>();
  for (const c of db.categories) {
    catByName.set(n(c.name), c.id);
    catByName.set(n(c.slug), c.id);
  }
  const districts = new Map(db.regions.filter((r) => r.type === "district").map((d) => [d.id, n(d.name)]));
  const areasByName = new Map<string, { id: string; district: string }[]>();
  for (const a of db.regions) {
    if (a.type !== "area") continue;
    const key = n(a.name);
    areasByName.set(key, [...(areasByName.get(key) ?? []), { id: a.id, district: districts.get(a.parentId ?? "") ?? "" }]);
  }
  // Duplicate lookup for existing listings
  const existing = new Map<string, string>();
  for (const l of db.listings) {
    const nm = n(l.name);
    if (l.address) existing.set(`${nm}|a|${n(l.address)}`, l.name);
    for (const p of l.phones) existing.set(`${nm}|p|${normPhone(p)}`, l.name);
  }
  const seenInFile = new Map<string, number>();

  return rows.map((row) => {
    const r = row.raw;
    const issues: RowIssue[] = [];
    const warnings: string[] = [];
    const name = r.name.trim();
    if (!name) issues.push({ field: "name", message: "Business name is missing.", kind: "error" });

    const phones = cleanPhones(r.phone.split(/[;,/|\n]+/));
    if (phones.length === 0) issues.push({ field: "phone", message: "Phone number is missing or not valid.", kind: "error" });
    else if (phones.some((p) => p.length !== 10)) warnings.push("Phone number is not 10 digits.");

    let categoryId: string | undefined;
    if (!r.category.trim()) issues.push({ field: "category", message: "Category is missing.", kind: "error" });
    else {
      categoryId = catByName.get(n(r.category));
      if (!categoryId) issues.push({ field: "category", message: `Category "${r.category.trim()}" does not exist.`, kind: "error" });
    }

    let areaId: string | undefined;
    if (!r.area.trim()) issues.push({ field: "area", message: "Area is missing.", kind: "error" });
    else {
      const matches = areasByName.get(n(r.area)) ?? [];
      const filtered = r.district.trim() ? matches.filter((m) => m.district === n(r.district)) : matches;
      if (filtered.length === 0)
        issues.push({ field: "area", message: `Area "${r.area.trim()}"${r.district.trim() ? ` in ${r.district.trim()}` : ""} does not exist.`, kind: "error" });
      else if (filtered.length > 1) issues.push({ field: "district", message: `Area "${r.area.trim()}" exists in several districts. Please fill in the district.`, kind: "error" });
      else areaId = filtered[0].id;
    }

    const lat = r.latitude.trim() === "" ? null : Number(r.latitude);
    const lng = r.longitude.trim() === "" ? null : Number(r.longitude);
    if (lat !== null && (Number.isNaN(lat) || lat < -90 || lat > 90)) issues.push({ field: "latitude", message: "Latitude is not a valid number.", kind: "error" });
    if (lng !== null && (Number.isNaN(lng) || lng < -180 || lng > 180)) issues.push({ field: "longitude", message: "Longitude is not a valid number.", kind: "error" });
    if ((lat === null) !== (lng === null)) warnings.push("Only one of latitude / longitude was given, so the map pin is ignored.");
    if (r.email.trim() && !/^\S+@\S+\.\S+$/.test(r.email.trim())) warnings.push("Email address does not look right.");
    if (lat === null && lng === null) warnings.push("No map pin. You can add it later.");

    // Duplicates (against existing data and earlier rows in the same file)
    if (name) {
      const nm = n(name);
      let dupOf = "";
      for (const p of phones) {
        const hit = existing.get(`${nm}|p|${p}`);
        if (hit) dupOf = hit;
      }
      if (!dupOf && r.address.trim()) dupOf = existing.get(`${nm}|a|${n(r.address)}`) ?? "";
      if (dupOf) issues.push({ field: "name", message: `Looks like an existing listing: "${dupOf}".`, kind: "duplicate" });
      const keys = [...phones.map((p) => `${nm}|p|${p}`), ...(r.address.trim() ? [`${nm}|a|${n(r.address)}`] : [])];
      const earlier = keys.map((k) => seenInFile.get(k)).find((v) => v !== undefined);
      if (earlier !== undefined) issues.push({ field: "name", message: `Same business as row ${earlier} in this file.`, kind: "duplicate" });
      if (!row.skip) keys.forEach((k) => !seenInFile.has(k) && seenInFile.set(k, row.rowNumber));
    }

    const blocking = issues.some((i) => i.kind === "error" || (i.kind === "duplicate" && !row.allowDuplicate));
    return { ...row, issues, warnings, categoryId, areaId, ready: !row.skip && !blocking };
  });
}

export function importListings(rows: ValidatedRow[], defaultStatus: ListingStatus = "draft", fileName = "file"): { imported: number } {
  const who = requireSession();
  const db = getDb();
  const ready = rows.filter((r) => r.ready && r.categoryId && r.areaId);
  if (ready.length === 0) throw new DataError("There are no valid rows to import.");
  const slugs = new Set<string>();
  for (const l of db.listings) {
    slugs.add(l.slug);
    l.slugHistory.forEach((h) => slugs.add(h));
  }
  const areaSlug = new Map(db.regions.map((r) => [r.id, r.slug]));
  const now = new Date().toISOString();
  const created: Listing[] = ready.map((row) => {
    const r = row.raw;
    const lat = r.latitude.trim() === "" ? null : Number(r.latitude);
    const lng = r.longitude.trim() === "" ? null : Number(r.longitude);
    const hasPin = lat !== null && lng !== null;
    const wanted: ListingStatus = /^pub/i.test(r.status.trim()) ? "published" : /^draft/i.test(r.status.trim()) ? "draft" : defaultStatus;
    const slug = uniqueSlug(r.name, slugs, [areaSlug.get(row.areaId!) ?? ""]);
    slugs.add(slug);
    return {
      id: newId("l"),
      name: r.name.trim(),
      slug,
      slugHistory: [],
      categoryId: row.categoryId!,
      areaId: row.areaId!,
      address: r.address.trim(),
      phones: cleanPhones(r.phone.split(/[;,/|\n]+/)),
      whatsapp: r.whatsapp.trim() ? normPhone(r.whatsapp) : "",
      email: r.email.trim(),
      website: r.website.trim(),
      timings: r.timings.trim(),
      description: r.description.trim(),
      photos: [],
      lat: hasPin ? lat : null,
      lng: hasPin ? lng : null,
      status: who.role === "owner" ? wanted : "draft",
      featured: false,
      createdAt: now,
      updatedAt: now,
      createdBy: who.name,
    };
  });
  const next = withLog({ ...db, listings: [...created, ...db.listings] }, who, "import", fileName, `Imported ${created.length} listing(s), skipped ${rows.length - created.length}`);
  commit(next, ["listings", "activity"]);
  return { imported: created.length };
}

export function emptyRaw(): ImportRaw {
  return { name: "", category: "", district: "", area: "", address: "", phone: "", whatsapp: "", email: "", website: "", timings: "", description: "", latitude: "", longitude: "", status: "" };
}
