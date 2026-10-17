"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { EmptyBox, PageHeader, Pager, useToast } from "@/components/admin/ui";
import { importListings, listCategories, listAreas, validateImportRows, useDb, useSession, type ImportRaw, type ImportRowState } from "@/lib/data";
import { downloadTemplate, exportCsv, exportXlsx, parseImportFile } from "@/lib/import/files";

const PAGE = 25;
type View = "all" | "problems" | "ready";

export default function ImportPage() {
  const db = useDb();
  const session = useSession();
  const toast = useToast();
  const isOwner = session?.role === "owner";
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportRowState[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>("problems");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [done, setDone] = useState<number | null>(null);

  const validated = useMemo(() => (rows ? validateImportRows(rows, db) : []), [rows, db]);
  const errorRows = validated.filter((r) => !r.skip && r.issues.length > 0 && !r.ready);
  const readyRows = validated.filter((r) => r.ready);
  const skipped = validated.filter((r) => r.skip);
  const shown = validated.filter((r) => (view === "all" ? true : view === "ready" ? r.ready : !r.skip && !r.ready));
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const cur = Math.min(page, pages);
  const slice = shown.slice((cur - 1) * PAGE, cur * PAGE);
  const categories = listCategories(db);
  const areaNames = listAreas(db).map((a) => a.name);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    setDone(null);
    try {
      const parsed = await parseImportFile(file);
      setFileName(parsed.fileName);
      setRows(parsed.rows.map((raw, i) => ({ rowNumber: i + 2, raw, skip: false, allowDuplicate: false })));
      setPage(1);
      setView("problems");
    } catch (e) {
      setRows(null);
      setError(e instanceof Error ? e.message : "We could not read this file.");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function patch(rowNumber: number, change: Partial<ImportRowState> | { raw: Partial<ImportRaw> }) {
    setRows((rs) =>
      rs!.map((r) => {
        if (r.rowNumber !== rowNumber) return r;
        if ("raw" in change) return { ...r, raw: { ...r.raw, ...change.raw } };
        return { ...r, ...change };
      }),
    );
  }

  function runImport() {
    try {
      const res = importListings(validated, status, fileName);
      setDone(res.imported);
      setRows(null);
      toast(`Imported ${res.imported} listings`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Import failed.", "error");
    }
  }

  return (
    <>
      <PageHeader title="Import / Export" intro="Bring in many businesses at once from an Excel or CSV file, or download everything you have." />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">1. Import from a file</h2>
          <p className="mt-1 text-base text-slate-700">Download the template, fill it in, then choose the file. You can check and fix every row before anything is saved.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="btn btn-secondary btn-lg" onClick={downloadTemplate} data-testid="download-template"><Icon name="download" /> Download template</button>
            <label className="btn btn-primary btn-lg cursor-pointer">
              <Icon name="upload" /> {busy ? "Reading..." : "Choose a file"}
              <input ref={fileInput} type="file" accept=".csv,.xlsx,.xls,text/csv" className="sr-only" data-testid="import-file" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </div>
          {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-red-800" data-testid="import-error">{error}</p>}
          <p className="mt-3 text-sm text-slate-600">Columns: name, category, district, area, address, phone, whatsapp, email, website, timings, description, latitude, longitude, status. Category and area names must already exist.</p>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Export everything</h2>
          <p className="mt-1 text-base text-slate-700">Download all {db.listings.length} listings (including drafts).</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => exportCsv(db)} data-testid="export-csv"><Icon name="download" /> Download CSV</button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => exportXlsx(db)} data-testid="export-xlsx"><Icon name="download" /> Download Excel</button>
          </div>
        </section>
      </div>

      {done !== null && (
        <div role="status" className="mt-6 rounded-xl border border-green-300 bg-green-50 p-5 text-green-900" data-testid="import-done">
          <p className="text-lg font-semibold">Import finished: {done} listings added.</p>
          <p className="mt-1">{isOwner ? "They were saved with the status you chose." : "They were saved as Draft. The Owner can publish them."}</p>
          <Link href="/admin/listings" className="btn btn-primary mt-3">See the listings</Link>
        </div>
      )}

      {rows && (
        <section className="mt-8" aria-labelledby="preview">
          <h2 id="preview" className="text-xl font-semibold">2. Check the rows ({fileName})</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-4" data-testid="import-summary">
            <Summary label="Rows in file" value={validated.length} />
            <Summary label="Ready to import" value={readyRows.length} tone="text-green-700" />
            <Summary label="Need attention" value={errorRows.length} tone={errorRows.length ? "text-red-700" : undefined} />
            <Summary label="Skipped" value={skipped.length} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div role="group" aria-label="Show rows" className="flex overflow-hidden rounded-lg border border-slate-300 bg-white">
              {([["problems", "Need attention"], ["ready", "Ready"], ["all", "All rows"]] as const).map(([v, label]) => (
                <button key={v} type="button" aria-pressed={view === v} onClick={() => { setView(v); setPage(1); }} className={`min-h-11 px-4 text-base font-medium ${view === v ? "bg-accent text-white" : "hover:bg-slate-50"}`}>{label}</button>
              ))}
            </div>
            <button type="button" className="btn btn-secondary" disabled={errorRows.length === 0} onClick={() => setRows((rs) => rs!.map((r) => (errorRows.some((e) => e.rowNumber === r.rowNumber) ? { ...r, skip: true } : r)))} data-testid="skip-all-errors">
              Skip all {errorRows.length} rows with problems
            </button>
          </div>

          {shown.length === 0 ? (
            <div className="mt-4"><EmptyBox title={view === "problems" ? "No problems found" : "Nothing to show"} text={view === "problems" ? "Every remaining row looks good." : undefined} /></div>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[980px] text-left text-sm" data-testid="import-table">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <tr>
                    <th scope="col" className="p-2">Row</th>
                    <th scope="col" className="p-2">Name</th>
                    <th scope="col" className="p-2">Category</th>
                    <th scope="col" className="p-2">District</th>
                    <th scope="col" className="p-2">Area</th>
                    <th scope="col" className="p-2">Phone</th>
                    <th scope="col" className="p-2">What is wrong</th>
                    <th scope="col" className="p-2">Skip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slice.map((r) => {
                    const bad = (f: string) => r.issues.some((i) => i.field === f);
                    const cell = (f: keyof ImportRaw, label: string, extra?: React.ReactNode) => (
                      <input aria-label={`${label}, row ${r.rowNumber}`} className={`input !min-h-9 !text-sm ${bad(f) ? "!border-red-500 !bg-red-50" : ""}`} value={r.raw[f]} disabled={r.skip} onChange={(e) => patch(r.rowNumber, { raw: { [f]: e.target.value } })} {...(extra ? {} : {})} />
                    );
                    return (
                      <tr key={r.rowNumber} className={r.skip ? "bg-slate-50 opacity-60" : r.ready ? "" : "bg-red-50/40"} data-testid="import-row" data-row={r.rowNumber} data-ready={r.ready}>
                        <td className="p-2 font-medium">{r.rowNumber}</td>
                        <td className="p-2">{cell("name", "Name")}</td>
                        <td className="p-2">
                          <select aria-label={`Category, row ${r.rowNumber}`} className={`input !min-h-9 !text-sm ${bad("category") ? "!border-red-500 !bg-red-50" : ""}`} value={r.raw.category} disabled={r.skip} onChange={(e) => patch(r.rowNumber, { raw: { category: e.target.value } })}>
                            {!categories.some((c) => c.name === r.raw.category) && <option value={r.raw.category}>{r.raw.category || "(empty)"}</option>}
                            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                        </td>
                        <td className="p-2">{cell("district", "District")}</td>
                        <td className="p-2">
                          <input list="area-names" aria-label={`Area, row ${r.rowNumber}`} className={`input !min-h-9 !text-sm ${bad("area") ? "!border-red-500 !bg-red-50" : ""}`} value={r.raw.area} disabled={r.skip} onChange={(e) => patch(r.rowNumber, { raw: { area: e.target.value } })} />
                        </td>
                        <td className="p-2">{cell("phone", "Phone")}</td>
                        <td className="p-2 text-red-800">
                          {r.issues.map((i, k) => <p key={k} data-testid="row-error">{i.message}</p>)}
                          {r.warnings.map((w, k) => <p key={k} className="text-amber-800">{w}</p>)}
                          {r.issues.some((i) => i.kind === "duplicate") && !r.issues.some((i) => i.kind === "error") && (
                            <label className="mt-1 flex items-center gap-2 text-slate-800"><input type="checkbox" className="h-4 w-4" checked={r.allowDuplicate} onChange={(e) => patch(r.rowNumber, { allowDuplicate: e.target.checked })} /> Import anyway</label>
                          )}
                          {r.ready && r.warnings.length === 0 && <span className="text-green-700">Looks good</span>}
                        </td>
                        <td className="p-2">
                          <label className="flex min-h-9 items-center gap-2"><input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={r.skip} onChange={(e) => patch(r.rowNumber, { skip: e.target.checked })} aria-label={`Skip row ${r.rowNumber}`} /></label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <datalist id="area-names">{[...new Set(areaNames)].map((n) => <option key={n} value={n} />)}</datalist>
            </div>
          )}
          <Pager page={cur} pages={pages} onPage={setPage} />

          <div className="mt-6 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            {isOwner ? (
              <div>
                <label htmlFor="istatus" className="label text-base">Save imported listings as</label>
                <select id="istatus" className="input" value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")}>
                  <option value="draft">Draft (hidden until published)</option>
                  <option value="published">Published (visible now)</option>
                </select>
                <p className="hint">A status column in the file overrides this.</p>
              </div>
            ) : (
              <p className="max-w-sm text-base text-slate-700">Imported listings are saved as Draft. The Owner publishes them after checking.</p>
            )}
            <button type="button" className="btn btn-primary btn-lg" disabled={readyRows.length === 0} onClick={runImport} data-testid="run-import">
              Import {readyRows.length} valid row{readyRows.length === 1 ? "" : "s"}
            </button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => setRows(null)}>Cancel</button>
            {errorRows.length > 0 && <p className="w-full text-base text-amber-800">{errorRows.length} row{errorRows.length === 1 ? "" : "s"} with problems will be left out unless you fix them.</p>}
          </div>
        </section>
      )}
    </>
  );
}

function Summary({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-600">{label}</p>
      <p className={`text-3xl font-bold ${tone ?? ""}`}>{value}</p>
    </div>
  );
}
