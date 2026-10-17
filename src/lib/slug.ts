export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, " and ")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Returns a slug not in `taken`. Tries the base, then each fallback suffix, then a short id. */
export function uniqueSlug(base: string, taken: Set<string>, suffixes: string[] = []): string {
  const root = slugify(base) || "item";
  if (!taken.has(root)) return root;
  for (const s of suffixes) {
    const candidate = slugify(`${root}-${s}`);
    if (candidate && !taken.has(candidate)) return candidate;
  }
  let i = 2;
  const first = suffixes.length ? slugify(`${root}-${suffixes[0]}`) : root;
  while (taken.has(`${first}-${i}`)) i++;
  return `${first}-${i}`;
}

export function shortId(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${shortId()}`;
}
