"use client";
import { useState } from "react";
import { ConfirmDialog, Field, PageHeader, StorageMeter, useToast } from "@/components/admin/ui";
import { resetDemoData, updateSettings, useDb, useSession } from "@/lib/data";
import type { Settings } from "@/lib/types";
import { compressImage } from "@/lib/image";

export default function SettingsPage() {
  const db = useDb();
  const session = useSession();
  const toast = useToast();
  const isOwner = session?.role === "owner";
  const [s, setS] = useState<Settings>(db.settings);
  const [confirmReset, setConfirmReset] = useState(false);
  const set = (k: keyof Settings, v: string) => setS((p) => ({ ...p, [k]: v }));

  async function logo(file?: File) {
    if (!file) return;
    try {
      set("logo", await compressImage(file));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not use that picture.", "error");
    }
  }

  return (
    <>
      <PageHeader title="Settings" intro={isOwner ? "Name, logo and contact details shown on the public site." : "Only the Owner can change settings. You can look but not edit."} />
      <form
        className="max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            updateSettings(s);
            toast("Settings saved");
          } catch (err) {
            toast(err instanceof Error ? err.message : "Could not save.", "error");
          }
        }}
      >
        <fieldset disabled={!isOwner} className="space-y-4">
          <Field label="Site name" htmlFor="sname"><input id="sname" className="input" value={s.siteName} onChange={(e) => set("siteName", e.target.value)} required data-testid="site-name" /></Field>
          <div>
            <span className="label text-base">Logo</span>
            <div className="flex flex-wrap items-center gap-4">
              {s.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.logo} alt="Current logo" className="h-14 w-14 rounded-lg border border-slate-200 object-contain" />
              ) : (
                <span className="grid h-14 w-14 place-items-center rounded-lg bg-accent text-2xl font-bold text-white">{s.siteName.trim()[0]?.toUpperCase()}</span>
              )}
              <label className="btn btn-secondary btn-lg cursor-pointer">Choose a logo<input type="file" accept="image/*" className="sr-only" onChange={(e) => logo(e.target.files?.[0])} /></label>
              {s.logo && <button type="button" className="btn btn-ghost" onClick={() => set("logo", "")}>Remove logo</button>}
            </div>
          </div>
          <Field label="Phone" htmlFor="sphone"><input id="sphone" className="input" value={s.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Email" htmlFor="semail"><input id="semail" type="email" className="input" value={s.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Address" htmlFor="saddr"><textarea id="saddr" className="input" rows={2} value={s.address} onChange={(e) => set("address", e.target.value)} /></Field>
        </fieldset>
        {isOwner && <button type="submit" className="btn btn-primary btn-lg" data-testid="save-settings">Save settings</button>}
      </form>

      <section className="mt-8 max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Browser storage</h2>
        <p className="text-base text-slate-700">This demo keeps everything in this browser. Browsers allow about 5 MB, so photos are shrunk automatically.</p>
        <StorageMeter />
      </section>

      <section className="mt-8 max-w-2xl rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 className="text-xl font-semibold text-red-900">Reset demo data</h2>
        <p className="mt-1 text-base text-red-900">Removes everything you added and brings back the original sample listings, categories and places.</p>
        {isOwner ? (
          <button type="button" className="btn btn-danger btn-lg mt-4" onClick={() => setConfirmReset(true)} data-testid="reset-demo">Reset demo data</button>
        ) : (
          <p className="mt-3 text-base font-medium text-red-900">Only the Owner can reset the demo data.</p>
        )}
      </section>

      <ConfirmDialog
        open={confirmReset}
        danger
        title="Reset all demo data?"
        confirmLabel="Yes, reset everything"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemoData();
          setConfirmReset(false);
          setS(db.settings);
          toast("Demo data restored");
        }}
      >
        All listings, categories, places, reports and settings you changed will be replaced by the original sample data. This cannot be undone.
      </ConfirmDialog>
    </>
  );
}
