"use client";
import { useState } from "react";
import { EmptyBox, PageHeader, Pager } from "@/components/admin/ui";
import { useDb } from "@/lib/data";

const PAGE = 30;
const LABEL: Record<string, string> = {
  create: "Created", update: "Edited", delete: "Deleted", import: "Imported", publish: "Published", unpublish: "Unpublished", reset: "Reset", settings: "Changed settings", report: "Report received",
};

export default function ActivityPage() {
  const db = useDb();
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(db.activity.length / PAGE));
  const cur = Math.min(page, pages);
  return (
    <>
      <PageHeader title="Activity log" intro="Who changed what, and when. The newest changes are first." />
      {db.activity.length === 0 ? (
        <EmptyBox title="No activity yet" text="When someone adds, edits, deletes or imports something, it is listed here." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-base" data-testid="activity-table">
            <thead className="border-b border-slate-200 bg-slate-50 text-sm text-slate-700">
              <tr><th scope="col" className="p-3">When</th><th scope="col" className="p-3">Who</th><th scope="col" className="p-3">What</th><th scope="col" className="p-3">Details</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.activity.slice((cur - 1) * PAGE, cur * PAGE).map((a) => (
                <tr key={a.id} data-testid="activity-row">
                  <td className="whitespace-nowrap p-3 text-sm text-slate-700">{new Date(a.at).toLocaleString()}</td>
                  <td className="p-3">{a.actor} <span className="text-sm text-slate-600">({a.role})</span></td>
                  <td className="p-3"><span className="font-medium">{LABEL[a.action] ?? a.action}</span> {a.target}</td>
                  <td className="p-3 text-slate-700">{a.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={cur} pages={pages} onPage={setPage} />
    </>
  );
}
