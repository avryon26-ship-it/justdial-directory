"use client";
import Link from "next/link";
import { useState } from "react";
import { EmptyBox, PageHeader, useToast } from "@/components/admin/ui";
import { getListing, listingPath, setReportResolved, useDb } from "@/lib/data";

export default function ReportsPage() {
  const db = useDb();
  const toast = useToast();
  const [filter, setFilter] = useState<"open" | "resolved" | "all">("open");
  const list = db.reports.filter((r) => (filter === "all" ? true : filter === "open" ? !r.resolved : r.resolved));
  return (
    <>
      <PageHeader title="Reports from visitors" intro="When a visitor says some information is wrong, it arrives here. Tick Resolved once you have checked it." />
      <div role="group" aria-label="Show" className="mb-4 inline-flex overflow-hidden rounded-lg border border-slate-300 bg-white">
        {([["open", "To check"], ["resolved", "Resolved"], ["all", "All"]] as const).map(([v, l]) => (
          <button key={v} type="button" aria-pressed={filter === v} onClick={() => setFilter(v)} className={`min-h-11 px-4 text-base font-medium ${filter === v ? "bg-accent text-white" : "hover:bg-slate-50"}`}>{l}</button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyBox title={filter === "open" ? "No reports to check" : "Nothing here"} text="Visitors can send a report from the bottom of any business page." />
      ) : (
        <ul className="space-y-3" data-testid="report-list">
          {list.map((r) => {
            const l = getListing(r.listingId, db);
            return (
              <li key={r.id} className={`rounded-xl border bg-white p-5 shadow-sm ${r.resolved ? "border-slate-200 opacity-75" : "border-amber-300"}`} data-testid="report-item">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">
                      {l ? <Link href={`/admin/listings/edit?id=${l.id}`} className="hover:underline">{r.listingName}</Link> : r.listingName}
                      {l && <Link href={listingPath(l, db)} target="_blank" className="link ml-3 text-sm font-normal">View on site</Link>}
                    </p>
                    <p className="mt-2 text-base">{r.message}</p>
                    <p className="mt-2 text-sm text-slate-600">{new Date(r.createdAt).toLocaleString()}{r.contact ? ` - Contact: ${r.contact}` : ""}</p>
                  </div>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-300 px-4 text-base font-medium">
                    <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={r.resolved} onChange={(e) => { setReportResolved(r.id, e.target.checked); toast(e.target.checked ? "Marked as resolved" : "Re-opened"); }} data-testid="resolved-toggle" />
                    Resolved
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
