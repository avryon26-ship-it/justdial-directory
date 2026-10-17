"use client";
import Link from "next/link";
import { useState } from "react";
import { ALPHABET, categoriesByLetter, countListingsByCategory, defaultState, districtOf, getRegion, resultsPath, useDb, useUserLocation } from "@/lib/data";
import { Icon } from "@/components/shared/Icon";

export function AZStrip() {
  const db = useDb();
  const loc = useUserLocation();
  const [letter, setLetter] = useState<string | null>(null);
  const byLetter = categoriesByLetter(db);
  const counts = countListingsByCategory(db, true);
  const district = loc?.areaId ? districtOf(loc.areaId, db) : undefined;
  const regionSlug = district?.slug ?? defaultState(db)?.slug ?? "tamil-nadu";
  const regionName = district ? getRegion(district.id, db)?.name : "Tamil Nadu";
  const cats = letter ? (byLetter.get(letter) ?? []) : [];

  return (
    <div>
      <div role="group" aria-label="Browse categories A to Z" className="flex flex-wrap gap-1.5" data-testid="az-strip">
        {ALPHABET.map((l) => {
          const has = byLetter.has(l);
          const selected = letter === l;
          return (
            <button
              key={l}
              type="button"
              disabled={!has}
              aria-pressed={selected}
              aria-label={has ? `Categories starting with ${l}` : `${l}: no categories`}
              onClick={() => setLetter(selected ? null : l)}
              data-letter={l}
              data-has={has}
              className={`grid h-11 w-11 place-items-center rounded-lg border text-sm font-semibold transition-colors ${
                selected
                  ? "border-accent bg-accent text-white"
                  : has
                    ? "border-slate-300 bg-white text-slate-900 hover:border-accent hover:text-accent"
                    : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              }`}
            >
              {l}
            </button>
          );
        })}
      </div>
      <div aria-live="polite" className="mt-4" data-testid="az-panel">
        {letter && (
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold">
                Categories starting with {letter} <span className="font-normal text-slate-600">in {regionName}</span>
              </h3>
              <Link href={`/categories/${letter.toLowerCase()}`} className="link text-sm">
                Open page
              </Link>
            </div>
            <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
              {cats.map((c) => (
                <li key={c.id}>
                  <Link href={resultsPath(regionSlug, c.slug)} className="flex min-h-11 items-center justify-between rounded-lg px-2 hover:bg-accent-soft">
                    <span className="flex items-center gap-2 font-medium text-slate-900">
                      <Icon name={c.icon} size={18} className="text-accent" />
                      {c.name}
                    </span>
                    <span className="text-sm text-slate-600">{counts.get(c.id) ?? 0}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
