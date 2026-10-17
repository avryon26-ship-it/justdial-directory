import type { Category, Db } from "../types";
import { newId, slugify, uniqueSlug } from "../slug";
import { commit, getDb } from "./store";
import { requireSession } from "./auth";
import { DataError, withLog } from "./write";
import { categoryLetter } from "./queries";

export { categoryLetter };

function takenSlugs(db: Db, exceptId?: string) {
  const s = new Set<string>();
  for (const c of db.categories) {
    if (c.id === exceptId) continue;
    s.add(c.slug);
    c.slugHistory.forEach((h) => s.add(h));
  }
  return s;
}

function normalizeOrder(cats: Category[]): Category[] {
  return [...cats].sort((a, b) => a.order - b.order).map((c, i) => ({ ...c, order: i + 1 }));
}

export function createCategory(name: string, options: { icon?: string; popular?: boolean } = {}): Category {
  const who = requireSession();
  const db = getDb();
  const clean = name.trim();
  if (!clean) throw new DataError("Please type a category name.");
  if (db.categories.some((c) => c.name.toLowerCase() === clean.toLowerCase())) throw new DataError("A category with this name already exists.");
  const cat: Category = {
    id: newId("c"),
    name: clean,
    slug: uniqueSlug(clean, takenSlugs(db)),
    slugHistory: [],
    order: db.categories.length + 1,
    icon: options.icon ?? "tag",
    popular: !!options.popular,
  };
  commit(withLog({ ...db, categories: [...db.categories, cat] }, who, "create", clean, `Category added (group ${categoryLetter(clean)})`), ["categories", "activity"]);
  return cat;
}

/** Renaming regenerates the slug; the old slug is kept so old URLs redirect. */
export function renameCategory(id: string, name: string): Category {
  const who = requireSession();
  const db = getDb();
  const old = db.categories.find((c) => c.id === id);
  const clean = name.trim();
  if (!old) throw new DataError("This category no longer exists.");
  if (!clean) throw new DataError("Please type a category name.");
  if (db.categories.some((c) => c.id !== id && c.name.toLowerCase() === clean.toLowerCase())) throw new DataError("A category with this name already exists.");
  let { slug, slugHistory } = old;
  if (slugify(clean) !== old.slug) {
    const fresh = uniqueSlug(clean, takenSlugs(db, id));
    slugHistory = [...old.slugHistory.filter((h) => h !== fresh), old.slug];
    slug = fresh;
  }
  const updated = { ...old, name: clean, slug, slugHistory };
  commit(
    withLog({ ...db, categories: db.categories.map((c) => (c.id === id ? updated : c)) }, who, "update", clean, `Renamed from "${old.name}"`),
    ["categories", "activity"],
  );
  return updated;
}

export function setCategoryPopular(id: string, popular: boolean) {
  const who = requireSession();
  const db = getDb();
  const c = db.categories.find((x) => x.id === id);
  if (!c) return;
  commit(
    withLog({ ...db, categories: db.categories.map((x) => (x.id === id ? { ...x, popular } : x)) }, who, "update", c.name, popular ? "Shown on home page" : "Hidden from home page"),
    ["categories", "activity"],
  );
}

export function moveCategory(id: string, direction: -1 | 1) {
  const who = requireSession();
  const db = getDb();
  const sorted = normalizeOrder(db.categories);
  const i = sorted.findIndex((c) => c.id === id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= sorted.length) return;
  [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
  const reordered = sorted.map((c, k) => ({ ...c, order: k + 1 }));
  commit(withLog({ ...db, categories: reordered }, who, "update", sorted[j].name, "Changed category order"), ["categories", "activity"]);
}

export function deleteCategory(id: string, moveToId?: string) {
  const who = requireSession(["owner"]);
  const db = getDb();
  const cat = db.categories.find((c) => c.id === id);
  if (!cat) return;
  const used = db.listings.filter((l) => l.categoryId === id);
  if (used.length && !moveToId) throw new DataError(`${used.length} listing(s) still use "${cat.name}". Move them to another category first.`);
  if (moveToId && (moveToId === id || !db.categories.some((c) => c.id === moveToId))) throw new DataError("Please choose another category to move the listings to.");
  const listings = used.length ? db.listings.map((l) => (l.categoryId === id ? { ...l, categoryId: moveToId!, updatedAt: new Date().toISOString() } : l)) : db.listings;
  const next = withLog(
    { ...db, listings, categories: normalizeOrder(db.categories.filter((c) => c.id !== id)) },
    who,
    "delete",
    cat.name,
    used.length ? `Category deleted; ${used.length} listing(s) moved` : "Category deleted",
  );
  commit(next, used.length ? ["categories", "listings", "activity"] : ["categories", "activity"]);
}
