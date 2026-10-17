import type { Report } from "../types";
import { newId } from "../slug";
import { commit, getDb } from "./store";
import { requireSession } from "./auth";
import { DataError, withLog } from "./write";

/** Called from the public site: no login needed. */
export function createReport(input: { listingId: string; listingName: string; message: string; contact: string }): Report {
  const message = input.message.trim();
  if (message.length < 5) throw new DataError("Please tell us what is wrong (a few words is enough).");
  const db = getDb();
  const report: Report = {
    id: newId("rep"),
    listingId: input.listingId,
    listingName: input.listingName,
    message,
    contact: input.contact.trim(),
    createdAt: new Date().toISOString(),
    resolved: false,
  };
  commit(withLog({ ...db, reports: [report, ...db.reports] }, null, "report", input.listingName, "Visitor reported wrong information"), ["reports", "activity"]);
  return report;
}

export function listReports() {
  return getDb().reports;
}

export function setReportResolved(id: string, resolved: boolean) {
  const who = requireSession();
  const db = getDb();
  const r = db.reports.find((x) => x.id === id);
  if (!r) return;
  commit(
    withLog({ ...db, reports: db.reports.map((x) => (x.id === id ? { ...x, resolved } : x)) }, who, "update", r.listingName, resolved ? "Report marked resolved" : "Report re-opened"),
    ["reports", "activity"],
  );
}
