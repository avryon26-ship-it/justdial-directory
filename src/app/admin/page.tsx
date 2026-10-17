"use client";
import Link from "next/link";
import { Icon } from "@/components/shared/Icon";
import { EmptyBox, PageHeader } from "@/components/admin/ui";
import { listingProblems, listAreas, useDb, useSession } from "@/lib/data";

function Stat({ label, value, href, tone, bar = "border-t-accent" }: { label: string; value: number | string; href?: string; tone?: string; bar?: string }) {
  const body = (
    <div className={`h-full rounded-xl border border-slate-200 border-t-4 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${bar}`}>
      <p className="text-base text-slate-600">{label}</p>
      <p className={`mt-1 text-4xl font-bold ${tone ?? "text-slate-900"}`}>{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function Dashboard() {
  const db = useDb();
  const session = useSession();
  const published = db.listings.filter((l) => l.status === "published").length;
  const drafts = db.listings.length - published;
  const problems = listingProblems(db);
  const openReports = db.reports.filter((r) => !r.resolved).length;
  const rows = [
    { label: "Listings with no phone number", n: problems.noPhone.length, href: "/admin/listings?problem=phone" },
    { label: "Listings with no category", n: problems.noCategory.length, href: "/admin/listings?problem=category" },
    { label: "Listings with no map pin", n: problems.noCoords.length, href: "/admin/listings?problem=coords" },
  ];
  const totalProblems = rows.reduce((s, r) => s + r.n, 0);

  return (
    <>
      <PageHeader
        title={`Welcome, ${session?.name ?? ""}`}
        intro="Here is a quick look at your directory."
        actions={
          <Link href="/admin/listings/new" className="btn btn-primary btn-lg" data-testid="add-listing-top">
            <Icon name="plus" /> Add a business
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="stats">
        <Stat label="Total listings" value={db.listings.length} href="/admin/listings" tone="text-accent" />
        <Stat label="Published (visible to everyone)" value={published} href="/admin/listings?status=published" tone="text-green-700" bar="border-t-green-500" />
        <Stat label="Drafts (waiting for the Owner)" value={drafts} href="/admin/listings?status=draft" tone="text-amber-700" bar="border-t-amber-500" />
        <Stat label="Visitor reports to check" value={openReports} href="/admin/reports" tone={openReports ? "text-red-700" : undefined} bar="border-t-rose-500" />
        <Stat label="Categories" value={db.categories.length} href="/admin/categories" tone="text-violet-700" bar="border-t-violet-500" />
        <Stat label="Areas" value={listAreas(db).length} href="/admin/regions" tone="text-teal-700" bar="border-t-teal-500" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="problems">
          <h2 id="problems" className="text-xl font-semibold">Things to fix</h2>
          {totalProblems === 0 ? (
            <p className="mt-3 text-base text-green-800">Everything looks complete. Nothing to fix.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {rows.map((r) => (
                <li key={r.label}>
                  <Link href={r.href} className="flex min-h-14 items-center justify-between gap-3 rounded-lg px-1 hover:bg-slate-50">
                    <span className="text-base">{r.label}</span>
                    <span className={`chip px-3 py-1 text-sm ${r.n ? "bg-amber-100 text-amber-900" : "bg-green-100 text-green-800"}`}>{r.n}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="recent">
          <div className="flex items-center justify-between">
            <h2 id="recent" className="text-xl font-semibold">Recent activity</h2>
            <Link href="/admin/activity" className="link text-base">See all</Link>
          </div>
          {db.activity.length === 0 ? (
            <div className="mt-3"><EmptyBox title="Nothing yet" text="Changes you make will be listed here." /></div>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100" data-testid="recent-activity">
              {db.activity.slice(0, 6).map((a) => (
                <li key={a.id} className="py-3 text-base">
                  <span className="font-medium">{a.actor}</span> <span className="text-slate-600">{a.action}</span> <span className="font-medium">{a.target}</span>
                  <span className="block text-sm text-slate-600">{new Date(a.at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
