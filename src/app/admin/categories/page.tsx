"use client";
import { useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { ConfirmDialog, EmptyBox, PageHeader, useToast } from "@/components/admin/ui";
import {
  categoryLetter, countListingsByCategory, createCategory, deleteCategory, listCategories, moveCategory, renameCategory,
  setCategoryPopular, useDb, useSession,
} from "@/lib/data";
import type { Category } from "@/lib/types";

export default function CategoriesPage() {
  const db = useDb();
  const session = useSession();
  const toast = useToast();
  const isOwner = session?.role === "owner";
  const cats = listCategories(db);
  const counts = countListingsByCategory(db);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [del, setDel] = useState<Category | null>(null);
  const [moveTo, setMoveTo] = useState("");

  const run = (fn: () => void, ok: string) => {
    try {
      fn();
      toast(ok);
      return true;
    } catch (e) {
      toast(e instanceof Error ? e.message : "Something went wrong.", "error");
      return false;
    }
  };

  const delCount = del ? (counts.get(del.id) ?? 0) : 0;

  return (
    <>
      <PageHeader title="Categories" intro="The A to Z group on the public site is set automatically from the first letter of the name." />
      <form
        className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          if (run(() => createCategory(name), `Added "${name.trim()}"`)) setName("");
        }}
      >
        <div className="min-w-[220px] flex-1">
          <label htmlFor="newcat" className="label text-base">New category name</label>
          <input id="newcat" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="For example: Pet Shops" data-testid="new-category-name" />
        </div>
        <button type="submit" className="btn btn-primary btn-lg" data-testid="add-category"><Icon name="plus" /> Add category</button>
        {name.trim() && <p className="w-full text-sm text-slate-600">It will appear under the letter <strong>{categoryLetter(name)}</strong>.</p>}
      </form>

      {cats.length === 0 ? (
        <EmptyBox title="No categories yet" text="Type a name above to add the first one." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-base" data-testid="category-table">
            <thead className="border-b border-slate-200 bg-slate-50 text-sm text-slate-700">
              <tr>
                <th scope="col" className="p-3">Order</th>
                <th scope="col" className="p-3">Letter</th>
                <th scope="col" className="p-3">Name</th>
                <th scope="col" className="p-3">Listings</th>
                <th scope="col" className="p-3">On home page</th>
                <th scope="col" className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cats.map((c, i) => (
                <tr key={c.id} data-testid="category-row" data-name={c.name}>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button type="button" className="btn btn-secondary btn-sm !px-2" aria-label={`Move ${c.name} up`} disabled={i === 0} onClick={() => run(() => moveCategory(c.id, -1), "Moved up")}><Icon name="arrowUp" size={16} /></button>
                      <button type="button" className="btn btn-secondary btn-sm !px-2" aria-label={`Move ${c.name} down`} disabled={i === cats.length - 1} onClick={() => run(() => moveCategory(c.id, 1), "Moved down")}><Icon name="arrowDown" size={16} /></button>
                    </div>
                  </td>
                  <td className="p-3"><span className="grid h-8 w-8 place-items-center rounded-md bg-accent-soft font-semibold text-accent">{categoryLetter(c.name)}</span></td>
                  <td className="p-3">
                    {editing?.id === c.id ? (
                      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (run(() => renameCategory(c.id, editing.name), "Renamed. The old web address still works.")) setEditing(null); }}>
                        <input aria-label="New name" className="input" autoFocus value={editing.name} onChange={(e) => setEditing({ id: c.id, name: e.target.value })} data-testid="rename-input" />
                        <button type="submit" className="btn btn-primary" data-testid="rename-save">Save</button>
                        <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
                      </form>
                    ) : (
                      <>
                        <span className="font-medium">{c.name}</span>
                        <span className="block text-sm text-slate-600">/{c.slug}{c.slugHistory.length ? ` (old: ${c.slugHistory.join(", ")})` : ""}</span>
                      </>
                    )}
                  </td>
                  <td className="p-3">{counts.get(c.id) ?? 0}</td>
                  <td className="p-3">
                    <label className="flex min-h-11 cursor-pointer items-center gap-2">
                      <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={c.popular} onChange={(e) => run(() => setCategoryPopular(c.id, e.target.checked), e.target.checked ? "Shown on home page" : "Hidden from home page")} />
                      <span className="text-sm">Show</span>
                    </label>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing({ id: c.id, name: c.name })} aria-label={`Rename ${c.name}`}><Icon name="edit" size={16} /> Rename</button>
                      {isOwner && <button type="button" className="btn btn-sm border border-red-200 bg-white text-red-700 hover:bg-red-50" onClick={() => { setDel(c); setMoveTo(""); }} aria-label={`Delete ${c.name}`}><Icon name="trash" size={16} /> Delete</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!del}
        danger
        title={delCount ? `"${del?.name}" still has listings` : "Delete this category?"}
        confirmLabel={delCount ? "Move listings and delete" : "Yes, delete it"}
        disabled={delCount > 0 && !moveTo}
        onCancel={() => setDel(null)}
        onConfirm={() => {
          if (del && run(() => deleteCategory(del.id, delCount ? moveTo : undefined), `Deleted "${del.name}"`)) setDel(null);
        }}
      >
        {delCount ? (
          <>
            <p>{delCount} listing{delCount === 1 ? "" : "s"} use this category, so it cannot be deleted yet. Choose where to move them:</p>
            <label htmlFor="moveto" className="label mt-3">Move listings to</label>
            <select id="moveto" className="input" value={moveTo} onChange={(e) => setMoveTo(e.target.value)} data-testid="move-to">
              <option value="">Choose a category</option>
              {cats.filter((c) => c.id !== del?.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </>
        ) : (
          <p>No listings use <strong>{del?.name}</strong>. It will be removed.</p>
        )}
      </ConfirmDialog>
    </>
  );
}
