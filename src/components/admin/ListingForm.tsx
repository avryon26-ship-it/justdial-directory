"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { Map } from "@/components/shared/Map";
import {
  createListing, DataError, findDuplicates, getRegion, listAreas, listCategoriesAZ, listDistricts, listStates, StorageFullError, updateListing,
  useDb, useSession, districtOf, stateOf,
} from "@/lib/data";
import type { Listing, ListingInput } from "@/lib/types";
import { Field, StatusBadge, useToast } from "./ui";
import { PhotoUploader } from "./PhotoUploader";

const BLANK: ListingInput = {
  name: "", categoryId: "", areaId: "", address: "", phones: [""], whatsapp: "", email: "", website: "", timings: "", description: "",
  photos: [], lat: null, lng: null, status: "draft",
};

export function ListingForm({ listing }: { listing?: Listing }) {
  const db = useDb();
  const session = useSession();
  const router = useRouter();
  const toast = useToast();
  const isOwner = session?.role === "owner";
  const [f, setF] = useState<ListingInput>(() => (listing ? { ...listing, phones: listing.phones.length ? listing.phones : [""] } : BLANK));
  const [stateId, setStateId] = useState(() => (listing ? (stateOf(listing.areaId, db)?.id ?? "") : (listStates(db)[0]?.id ?? "")));
  const [districtId, setDistrictId] = useState(() => (listing ? (districtOf(listing.areaId, db)?.id ?? "") : ""));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ListingInput>(k: K, v: ListingInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const area = f.areaId ? getRegion(f.areaId, db) : undefined;
  const dups = useMemo(() => findDuplicates({ name: f.name, phones: f.phones, address: f.address }, listing?.id, db), [f.name, f.phones, f.address, listing?.id, db]);
  const mapCentre = f.lat != null && f.lng != null ? { lat: f.lat, lng: f.lng } : area?.lat != null && area.lng != null ? { lat: area.lat, lng: area.lng } : { lat: 8.7139, lng: 77.7567 };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const input = { ...f, phones: f.phones.map((p) => p.trim()).filter(Boolean) };
      if (listing) updateListing(listing.id, input);
      else createListing(input);
      toast(listing ? "Changes saved" : isOwner && f.status === "published" ? "Business added and published" : "Business saved as Draft");
      router.push("/admin/listings");
    } catch (err) {
      setError(err instanceof DataError || err instanceof StorageFullError || err instanceof Error ? err.message : "Could not save.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {error && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-base text-red-800" data-testid="form-error">{error}</p>
      )}
      {dups.length > 0 && (
        <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-base text-amber-900" data-testid="duplicate-warning">
          <p className="flex items-center gap-2 font-semibold"><Icon name="alert" size={20} /> This may be a duplicate</p>
          <p className="mt-1">A business with the same name and the same phone or address already exists:</p>
          <ul className="mt-1 list-disc pl-5">
            {dups.slice(0, 3).map((d) => <li key={d.id}><Link className="underline" href={`/admin/listings/edit?id=${d.id}`} target="_blank">{d.name}</Link> ({d.address || "no address"})</li>)}
          </ul>
        </div>
      )}

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Basic details</h2>
        <Field label="Business name *" htmlFor="name"><input id="name" className="input" value={f.name} onChange={(e) => set("name", e.target.value)} required /></Field>
        <Field label="Category *" htmlFor="category">
          <select id="category" className="input" value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            <option value="">Choose a category</option>
            {listCategoriesAZ(db).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="State *" htmlFor="state">
            <select id="state" className="input" value={stateId} onChange={(e) => { setStateId(e.target.value); setDistrictId(""); set("areaId", ""); }}>
              {listStates(db).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="District *" htmlFor="district">
            <select id="district" className="input" value={districtId} onChange={(e) => { setDistrictId(e.target.value); set("areaId", ""); }}>
              <option value="">Choose a district</option>
              {listDistricts(db, stateId).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Area *" htmlFor="area">
            <select id="area" className="input" value={f.areaId} disabled={!districtId} onChange={(e) => set("areaId", e.target.value)}>
              <option value="">{districtId ? "Choose an area" : "Choose a district first"}</option>
              {listAreas(db, districtId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Full address" htmlFor="address"><textarea id="address" className="input" rows={2} value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
        <Field label="Description" htmlFor="description" hint="A few sentences about what the business offers."><textarea id="description" className="input" rows={4} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Contact and timings</h2>
        <fieldset>
          <legend className="label text-base">Phone numbers</legend>
          <div className="space-y-2">
            {f.phones.map((p, i) => (
              <div key={i} className="flex gap-2">
                <input aria-label={`Phone number ${i + 1}`} className="input" inputMode="tel" value={p} placeholder="10-digit number" onChange={(e) => set("phones", f.phones.map((x, k) => (k === i ? e.target.value : x)))} data-testid={`phone-${i}`} />
                {f.phones.length > 1 && (
                  <button type="button" className="btn btn-secondary" aria-label={`Remove phone number ${i + 1}`} onClick={() => set("phones", f.phones.filter((_, k) => k !== i))}><Icon name="close" size={18} /></button>
                )}
              </div>
            ))}
          </div>
          {f.phones.length < 4 && <button type="button" className="btn btn-secondary mt-2" onClick={() => set("phones", [...f.phones, ""])}><Icon name="plus" size={18} /> Add another number</button>}
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="WhatsApp number" htmlFor="whatsapp"><input id="whatsapp" className="input" inputMode="tel" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></Field>
          <Field label="Email" htmlFor="email"><input id="email" type="email" className="input" value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Website" htmlFor="website"><input id="website" className="input" placeholder="https://" value={f.website} onChange={(e) => set("website", e.target.value)} /></Field>
          <Field label="Timings" htmlFor="timings" hint='Example: Mon-Sat 9:00 AM - 8:00 PM; Sun Closed'><input id="timings" className="input" value={f.timings} onChange={(e) => set("timings", e.target.value)} /></Field>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Photos</h2>
        <PhotoUploader photos={f.photos} onChange={(p) => set("photos", p)} />
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Map pin</h2>
        <p className="text-base text-slate-700">Click on the map to place the pin exactly on the business. The numbers update by themselves.</p>
        <Map lat={mapCentre.lat} lng={mapCentre.lng} zoom={f.lat != null ? 16 : 13} showPin={f.lat != null && f.lng != null} onPick={(lat, lng) => setF((p) => ({ ...p, lat, lng }))} className="h-72" label="Click to place the pin" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Latitude" htmlFor="lat"><input id="lat" className="input" inputMode="decimal" value={f.lat ?? ""} onChange={(e) => set("lat", e.target.value === "" ? null : Number(e.target.value))} data-testid="lat" /></Field>
          <Field label="Longitude" htmlFor="lng"><input id="lng" className="input" inputMode="decimal" value={f.lng ?? ""} onChange={(e) => set("lng", e.target.value === "" ? null : Number(e.target.value))} data-testid="lng" /></Field>
        </div>
        <div className="flex flex-wrap gap-3">
          {area?.lat != null && area.lng != null && (
            <button type="button" className="btn btn-secondary" onClick={() => setF((p) => ({ ...p, lat: area.lat!, lng: area.lng! }))}>Use the centre of {area.name}</button>
          )}
          {f.lat != null && <button type="button" className="btn btn-ghost" onClick={() => setF((p) => ({ ...p, lat: null, lng: null }))}>Remove pin</button>}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Visibility</h2>
        {isOwner ? (
          <Field label="Status" htmlFor="status" hint="Only Published listings are shown to visitors.">
            <select id="status" className="input max-w-xs" value={f.status} onChange={(e) => set("status", e.target.value as ListingInput["status"])}>
              <option value="draft">Draft (hidden)</option>
              <option value="published">Published (visible)</option>
            </select>
          </Field>
        ) : (
          <p className="text-base text-slate-700">
            Status: <StatusBadge status={listing?.status ?? "draft"} /> {listing ? "" : "New listings are saved as Draft. The Owner will publish them after checking."}
          </p>
        )}
      </section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap gap-3 border-t border-slate-200 bg-slate-100/95 p-4 backdrop-blur sm:-mx-6 lg:-mx-8 lg:px-8">
        <button type="submit" disabled={saving} className="btn btn-primary btn-lg" data-testid="save-listing">{listing ? "Save changes" : isOwner && f.status === "published" ? "Add and publish" : "Save"}</button>
        <Link href="/admin/listings" className="btn btn-secondary btn-lg">Cancel</Link>
      </div>
    </form>
  );
}
