import type { Settings } from "../types";
import { commit, getDb, replaceAll } from "./store";
import { requireSession } from "./auth";
import { withLog } from "./write";
import { buildSeedDb } from "../seed";

export function getSettings(): Settings {
  return getDb().settings;
}

export function updateSettings(patch: Settings) {
  const who = requireSession(["owner"]);
  const db = getDb();
  commit(withLog({ ...db, settings: patch }, who, "settings", "Site settings", "Settings updated"), ["settings", "activity"]);
}

/** Restores all demo data (listings, categories, regions, reports, activity, settings). */
export function resetDemoData() {
  const who = requireSession(["owner"]);
  replaceAll(withLog(buildSeedDb(), who, "reset", "Demo data", "All demo data restored"));
}
