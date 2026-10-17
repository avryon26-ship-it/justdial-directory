"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/shared/Icon";
import {
  defaultState, districtOf, getCategory, getRegion, listCategoriesAZ, listingPath, resolveWhere, resultsPath,
  suggestWhat, suggestWhere, useDb, getListing, type Suggestion, type UserLocation,
} from "@/lib/data";
import { Autocomplete } from "./Autocomplete";
import { LocationButton } from "./LocationButton";

export function SearchBox() {
  const db = useDb();
  const router = useRouter();
  const [what, setWhat] = useState("");
  const [whatPick, setWhatPick] = useState<Suggestion | null>(null);
  const [where, setWhere] = useState("");
  const [wherePick, setWherePick] = useState<Suggestion | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const region = wherePick ? getRegion(wherePick.id, db) : resolveWhere(where, db);
    const state = defaultState(db);
    const regionSlug = region ? (region.type === "area" ? (districtOf(region.id, db)?.slug ?? state?.slug ?? "") : region.slug) : (state?.slug ?? "tamil-nadu");
    const area = region?.type === "area" ? region.slug : undefined;

    if (whatPick?.type === "listing") {
      const l = getListing(whatPick.id, db);
      if (l) return router.push(listingPath(l, db));
    }
    const typed = what.trim().toLowerCase();
    const category = whatPick?.type === "category" ? getCategory(whatPick.id, db) : listCategoriesAZ(db).find((c) => c.name.toLowerCase() === typed);
    if (category && (region || !where.trim())) return router.push(resultsPath(regionSlug, category.slug, { area }));
    const qs = new URLSearchParams();
    if (what.trim()) qs.set("q", what.trim());
    if (region) qs.set("where", region.type === "area" ? region.slug : region.slug);
    else if (where.trim()) qs.set("where", where.trim());
    router.push(`/search?${qs.toString()}`);
  }

  function onLocated(loc: UserLocation) {
    setWhere(loc.label);
    if (loc.areaId) setWherePick({ type: "area", id: loc.areaId, label: loc.label });
  }

  return (
    <form onSubmit={submit} role="search" aria-label="Search the directory" className="card p-3 sm:p-4" data-testid="search-form">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <Autocomplete
          label="What are you looking for?"
          name="what"
          icon="search"
          placeholder="Category or business name"
          value={what}
          onChange={(v) => {
            setWhat(v);
            setWhatPick(null);
          }}
          onPick={(s) => {
            setWhat(s.label);
            setWhatPick(s);
          }}
          getSuggestions={(q) => suggestWhat(q, db)}
        />
        <Autocomplete
          label="Where?"
          name="where"
          icon="pin"
          placeholder="Area or district"
          value={where}
          suggestOnFocus
          onChange={(v) => {
            setWhere(v);
            setWherePick(null);
          }}
          onPick={(s) => {
            setWhere(s.label);
            setWherePick(s);
          }}
          getSuggestions={(q) => suggestWhere(q, db)}
        />
        <button type="submit" className="btn btn-primary btn-lg w-full md:w-auto md:px-8" data-testid="search-submit">
          <Icon name="search" size={20} />
          Search
        </button>
      </div>
      <LocationButton onLocated={onLocated} className="mt-3 border-t border-slate-100 pt-3" />
    </form>
  );
}
