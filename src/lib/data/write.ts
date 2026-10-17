import type { ActivityEntry, Db, Session } from "../types";
import { newId } from "../slug";

export class DataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataError";
  }
}

/** Returns a copy of `db` with one activity entry added at the top (newest first, capped). */
export function withLog(db: Db, who: Session | null, action: string, target: string, detail = ""): Db {
  const entry: ActivityEntry = {
    id: newId("act"),
    at: new Date().toISOString(),
    actor: who?.name ?? "Visitor",
    role: who?.role ?? "visitor",
    action,
    target,
    detail,
  };
  return { ...db, activity: [entry, ...db.activity].slice(0, 500) };
}
