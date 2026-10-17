"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { ConfirmDialog, EmptyBox, PageHeader, Pager, StatusBadge, useToast } from "@/components/admin/ui";
import {
  adminSearchListings, areaLabel, deleteListing, getCategory, listCategoriesAZ, listDistricts, setListingStatus, useDb, useSession,
} from "@/lib/data";
import type { Listing } from "@/lib/types";
import { formatPhone } from "@/lib/geo";

const PAGE = 25;

function ListingsTable() {
  const db = useDb();
  const session = useSession();
  const router = useRouter();
  const sp = useSearchParams();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<Listing | null>(null);
  const isOwner = session?.role === "owner";

  const q = sp.get("q") ?? "";
  const status = sp.get("status") ?? "";
  const categoryId = sp.get("category") ?? "";
  const districtId = sp.get("district") ?? "";
  const problem = sp.get("problem") ?? "";

  function setFilter(k: string, v: string) {
    const next = new URLSearchParams(sp.toString());
    if (v) next.set(k, v);
    else next.delete(k);
    setPage(1);
    router.replace(`/admin/listings${next.toString() ? `?${next}` : ""}`);
  }

  const rows = useMemo(() => adminSearchListings({ q, status, categoryId, districtId, problem }, db), [db, q, status, categoryId, districtId, problem]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const cur = Math.min(page, pages);
  const slice = rows.slice((cur - 1) * PAGE, cur * PAGE);
  const filtered = !!(q || status || categoryId || districtId || problem);

  return (
    <>
      <PageHeader
        title="Listings"
        intro={isOwner ? "Add, edit, publish or delete businesses." : "Add and edit businesses. New listings are saved as Draft until the Owner publishes them."}
        actions={<Link href="/admin/listings/new" className="btn btn-primary btn-lg" data-testid="add-listing"><Icon name="plus" /> Add a business</Link>}
      />

      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label htmlFor="q" className="label">Search by name, address or phone</label>
          <input id="q" className="input" value={q} onChange={(e) => setFilter("q", e.target.value)} placeholder="Type to search" data-testid="listing-search" />
        </div>
        <div>
          <label htmlFor="fs" className="label">Status</label>
          <select id="fs" className="input" value={status} onChange={(e) => setFilter("status", e.target.value)}>
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <div>
          <label htmlFor="fc" className="label">Category</label>
          <select id="fc" className="input" value={categoryId} onChange={(e) => setFilter("category", e.target.value)}>
            <option value="">All categories</option>
            {listCategoriesAZ(db).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="fd" className="label">District</label>
          <select id="fd" className="input" value={districtId} onChange={(e) => setFilter("district", e.target.value)}>
            <option value="">All districts</option>
            {listDistricts(db).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-5">
          <label htmlFor="fp" className="label">Problems</label>
          <select id="fp" className="input max-w-xs" value={problem} onChange={(e) => setFilter("problem", e.target.value)}>
            <option value="">Show all</option>
            <option value="phone">No phone number</option>
            <option value="category">No category</option>
            <option value="coords">No map pin</option>
          </select>
          {filtered && <button type="button" className="btn btn-ghost ml-3" onClick={() => router.replace("/admin/listings")}>Clear filters</button>}
        </div>
      </div>

      <p className="mb-2 text-base text-slate-700" data-testid="listing-count">{rows.length} listing{rows.length === 1 ? "" : "s"}</p>

      {rows.length === 0 ? (
        <EmptyBox title={filtered ? "No listings match these filters" : "No listings yet"} text={filtered ? "Try clearing a filter." : "Add your first business to get started."}>
          <Link href="/admin/listings/new" className="btn btn-primary btn-lg">Add a business</Link>
        </EmptyBox>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-base" data-testid="listing-table">
            <thead className="border-b border-slate-200 bg-slate-50 text-sm text-slate-700">
              <tr>
                <th scope="col" className="p-3">Business</th>
                <th scope="col" className="p-3">Category</th>
                <th scope="col" className="p-3">Area</th>
                <th scope="col" className="p-3">Phone</th>
                <th scope="col" className="p-3">Status</th>
                <th scope="col" className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slice.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50" data-testid="listing-row">
                  <td className="p-3 font-medium">{l.name}</td>
                  <td className="p-3">{getCategory(l.categoryId, db)?.name ?? <span className="text-red-700">Missing</span>}</td>
                  <td className="p-3 text-slate-700">{areaLabel(l.areaId, db)}</td>
                  <td className="p-3">{l.phones[0] ? formatPhone(l.phones[0]) : <span className="text-red-700">Missing</span>}</td>
                  <td className="p-3"><StatusBadge status={l.status} /></td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      {isOwner && (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setListingStatus(l.id, l.status === "published" ? "draft" : "published"); toast(l.status === "published" ? "Moved back to Draft" : "Published"); }}>
                          {l.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                      )}
                      <Link href={`/admin/listings/edit?id=${l.id}`} className="btn btn-secondary btn-sm" aria-label={`Edit ${l.name}`}><Icon name="edit" size={16} /> Edit</Link>
                      {isOwner && (
                        <button type="button" className="btn btn-sm border border-red-200 bg-white text-red-700 hover:bg-red-50" aria-label={`Delete ${l.name}`} onClick={() => setToDelete(l)}>
                          <Icon name="trash" size={16} /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={cur} pages={pages} onPage={setPage} />

      <ConfirmDialog
        open={!!toDelete}
        danger
        title="Delete this business?"
        confirmLabel="Yes, delete it"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            deleteListing(toDelete.id);
            toast(`Deleted ${toDelete.name}`);
          }
          setToDelete(null);
        }}
      >
        <strong>{toDelete?.name}</strong> will be removed for good. This cannot be undone.
      </ConfirmDialog>
    </>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ListingsTable />
    </Suspense>
  );
}
