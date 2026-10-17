import type { Db } from "../types";
import { buildSeedDb } from "../seed";

export const STORAGE_PREFIX = "bd.";
const COLLECTIONS = ["regions", "categories", "listings", "reports", "activity", "settings"] as const;

export class StorageFullError extends Error {
  constructor() {
    super("The browser storage is full. Remove some photos or listings, then try again.");
    this.name = "StorageFullError";
  }
}

let state: Db | null = null;
const listeners = new Set<() => void>();
let windowBound = false;

function writeAll(db: Db) {
  for (const c of COLLECTIONS) window.localStorage.setItem(STORAGE_PREFIX + c, JSON.stringify(db[c]));
  window.localStorage.setItem(STORAGE_PREFIX + "seeded", "1");
}

function readAll(): Db {
  const seed = buildSeedDb();
  try {
    if (!window.localStorage.getItem(STORAGE_PREFIX + "seeded")) {
      try {
        writeAll(seed);
      } catch {
        /* ignore: runs in memory */
      }
      return seed;
    }
    const db: Record<string, unknown> = {};
    for (const c of COLLECTIONS) {
      try {
        const raw = window.localStorage.getItem(STORAGE_PREFIX + c);
        db[c] = raw ? JSON.parse(raw) : seed[c];
      } catch {
        db[c] = seed[c];
      }
    }
    return db as unknown as Db;
  } catch {
    return seed;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

/** Current data. On the server this is always the seed data. */
export function getDb(): Db {
  if (typeof window === "undefined") return buildSeedDb();
  if (!state) state = readAll();
  return state;
}

export function getServerDb(): Db {
  return buildSeedDb();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!windowBound && typeof window !== "undefined") {
    windowBound = true;
    window.addEventListener("storage", (e) => {
      if (e.key === null || e.key.startsWith(STORAGE_PREFIX)) {
        state = readAll();
        emit();
      }
    });
  }
  return () => {
    listeners.delete(listener);
  };
}

/** Persist `next` (only the named collections) and publish it. Rolls back if the browser quota is exceeded. */
export function commit(next: Db, changed: (keyof Db)[]) {
  const prev = getDb();
  try {
    for (const c of changed) window.localStorage.setItem(STORAGE_PREFIX + c, JSON.stringify(next[c]));
  } catch {
    for (const c of changed) {
      try {
        window.localStorage.setItem(STORAGE_PREFIX + c, JSON.stringify(prev[c]));
      } catch {
        /* ignore */
      }
    }
    throw new StorageFullError();
  }
  state = next;
  emit();
}

export function replaceAll(db: Db) {
  writeAll(db);
  state = db;
  emit();
}

export interface StorageUsage {
  usedBytes: number;
  budgetBytes: number;
  percent: number;
}

export function getStorageUsage(budgetBytes: number): StorageUsage {
  let chars = 0;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) chars += k.length + (window.localStorage.getItem(k)?.length ?? 0);
    }
  } catch {
    /* ignore */
  }
  const usedBytes = chars * 2;
  return { usedBytes, budgetBytes, percent: Math.min(100, Math.round((usedBytes / budgetBytes) * 100)) };
}
