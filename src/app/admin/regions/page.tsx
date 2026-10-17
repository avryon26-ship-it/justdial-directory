"use client";
import { useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { ConfirmDialog, Field, PageHeader, useToast } from "@/components/admin/ui";
import {
  createRegion, deleteRegion, listAreas, listDistricts, listStates, updateRegion, useDb, useSession,
} from "@/lib/data";
import type { Region, RegionType } from "@/lib/types";

export default function RegionsPage() {
  const db = useDb();
  const session = useSession();
  const toast = useToast();
  const isOwner = session?.role === "owner";
  const [type, setType] = useState<RegionType>("area");
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [edit, setEdit] = useState<Region | null>(null);
  const [eName, setEName] = useState("");
  const [eLat, setELat] = useState("");
  const [eLng, setELng] = useState("");
  const [del, setDel] = useState<Region | null>(null);

  const states = listStates(db);
  const districts = listDistricts(db);
  const parents = type === "district" ? states : type === "area" ? districts : [];

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
  const num = (s: string) => (s.trim() === "" ? undefined : Number(s));

  return (
    <>
      <PageHeader title="Regions and Areas" intro="States contain districts, and districts contain areas. Each area needs a latitude and longitude: the Use my location button on the site uses them to find the nearest area." />

      <form
        className="mb-8 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          if (run(() => createRegion({ type, name, parentId: type === "state" ? null : parentId, lat: num(lat), lng: num(lng) }), `Added ${name.trim()}`)) {
            setName(""); setLat(""); setLng("");
          }
        }}
      >
        <h2 className="text-xl font-semibold">Add a place</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Type" htmlFor="rtype">
            <select id="rtype" className="input" value={type} onChange={(e) => { setType(e.target.value as RegionType); setParentId(""); }}>
              <option value="area">Area</option>
              <option value="district">District</option>
              <option value="state">State</option>
            </select>
          </Field>
          {type !== "state" && (
            <Field label={type === "district" ? "In which state?" : "In which district?"} htmlFor="rparent">
              <select id="rparent" className="input" value={parentId} onChange={(e) => setParentId(e.target.value)} data-testid="region-parent">
                <option value="">Choose</option>
                {parents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Name" htmlFor="rname"><input id="rname" className="input" value={name} onChange={(e) => setName(e.target.value)} data-testid="region-name" /></Field>
          {type !== "state" && (
            <>
              <Field label="Latitude" htmlFor="rlat"><input id="rlat" className="input" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} data-testid="region-lat" /></Field>
              <Field label="Longitude" htmlFor="rlng"><input id="rlng" className="input" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} data-testid="region-lng" /></Field>
            </>
          )}
        </div>
        <button type="submit" className="btn btn-primary btn-lg" data-testid="add-region"><Icon name="plus" /> Add {type}</button>
      </form>

      <div className="space-y-6">
        {states.map((s) => (
          <section key={s.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
              <h2 className="text-xl font-semibold">{s.name} <span className="chip ml-2">State</span></h2>
              <RowActions r={s} isOwner={isOwner} onEdit={() => { setEdit(s); setEName(s.name); setELat(""); setELng(""); }} onDelete={() => setDel(s)} />
            </header>
            <div className="divide-y divide-slate-100">
              {listDistricts(db, s.id).map((d) => (
                <div key={d.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">{d.name} <span className="text-sm font-normal text-slate-600">({listAreas(db, d.id).length} areas)</span></h3>
                    <RowActions r={d} isOwner={isOwner} onEdit={() => { setEdit(d); setEName(d.name); setELat(String(d.lat ?? "")); setELng(String(d.lng ?? "")); }} onDelete={() => setDel(d)} />
                  </div>
                  <ul className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                    {listAreas(db, d.id).map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-slate-50">
                        <span>
                          <span className="font-medium">{a.name}</span>
                          <span className="block text-xs text-slate-600">{a.lat?.toFixed(4)}, {a.lng?.toFixed(4)}</span>
                        </span>
                        <RowActions r={a} isOwner={isOwner} onEdit={() => { setEdit(a); setEName(a.name); setELat(String(a.lat ?? "")); setELng(String(a.lng ?? "")); }} onDelete={() => setDel(a)} compact />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <ConfirmDialog
        open={!!edit}
        title={`Edit ${edit?.name ?? ""}`}
        confirmLabel="Save"
        onCancel={() => setEdit(null)}
        onConfirm={() => edit && run(() => updateRegion(edit.id, { name: eName, lat: num(eLat), lng: num(eLng) }), "Saved") && setEdit(null)}
      >
        <div className="space-y-3">
          <Field label="Name" htmlFor="ename"><input id="ename" className="input" value={eName} onChange={(e) => setEName(e.target.value)} /></Field>
          {edit?.type !== "state" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude" htmlFor="elat"><input id="elat" className="input" value={eLat} onChange={(e) => setELat(e.target.value)} /></Field>
              <Field label="Longitude" htmlFor="elng"><input id="elng" className="input" value={eLng} onChange={(e) => setELng(e.target.value)} /></Field>
            </div>
          )}
          <p className="text-sm text-slate-600">If you change the name, the old web address keeps working.</p>
        </div>
      </ConfirmDialog>
      <ConfirmDialog
        open={!!del}
        danger
        title={`Delete ${del?.name ?? ""}?`}
        confirmLabel="Yes, delete it"
        onCancel={() => setDel(null)}
        onConfirm={() => del && run(() => deleteRegion(del.id), `Deleted ${del.name}`) && setDel(null)}
      >
        A place can only be deleted when it is empty (no areas inside it and no listings in it).
      </ConfirmDialog>
    </>
  );
}

function RowActions({ r, isOwner, onEdit, onDelete, compact }: { r: Region; isOwner: boolean; onEdit: () => void; onDelete: () => void; compact?: boolean }) {
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" className="btn btn-secondary btn-sm" onClick={onEdit} aria-label={`Edit ${r.name}`}><Icon name="edit" size={16} />{!compact && " Edit"}</button>
      {isOwner && <button type="button" className="btn btn-sm border border-red-200 bg-white text-red-700 hover:bg-red-50" onClick={onDelete} aria-label={`Delete ${r.name}`}><Icon name="trash" size={16} />{!compact && " Delete"}</button>}
    </div>
  );
}
