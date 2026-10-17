"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Icon } from "@/components/shared/Icon";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { Map } from "@/components/shared/Map";
import {
  areaLabel, districtOf, getCategory, getRegion, listingPath, relatedListings, resolveListingSlug, resultsPath, useDb, useSession,
} from "@/lib/data";
import { directionsUrl, formatPhone, telHref, whatsappHref } from "@/lib/geo";
import { isOpenNow } from "@/lib/hours";
import { siteUrl } from "@/lib/seo";
import { Gallery } from "./Gallery";
import { ListingCard } from "./ListingCard";
import { NotFoundBlock } from "./NotFoundBlock";
import { ReportForm } from "./ReportForm";
import { ShareButton } from "./ShareButton";

export function DetailView({ regionSlug, categorySlug, slug }: { regionSlug: string; categorySlug: string; slug: string }) {
  const db = useDb();
  const router = useRouter();
  const session = useSession();
  const hit = resolveListingSlug(slug, db);
  const listing = hit?.listing;
  const canonical = listing ? listingPath(listing, db) : null;
  const current = `/${regionSlug}/${categorySlug}/${slug}`;

  useEffect(() => {
    if (canonical && canonical !== current) router.replace(canonical);
  }, [canonical, current, router]);

  if (!listing) return <NotFoundBlock title="We could not find this business" text="It may have been removed, or the link is wrong. Try searching again." />;
  if (listing.status !== "published" && !session)
    return <NotFoundBlock title="This listing is not available" text="It has not been published yet." />;

  const category = getCategory(listing.categoryId, db);
  const area = getRegion(listing.areaId, db);
  const district = districtOf(listing.areaId, db);
  const open = isOpenNow(listing.timings);
  const related = relatedListings(listing, db, 4);
  const hasPin = listing.lat != null && listing.lng != null;
  const ld = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: listing.name,
    description: listing.description,
    url: `${siteUrl()}${canonical}`,
    ...(listing.phones[0] ? { telephone: `+91${listing.phones[0]}` } : {}),
    ...(listing.email ? { email: listing.email } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address,
      addressLocality: area?.name,
      addressRegion: "Tamil Nadu",
      addressCountry: "IN",
    },
    ...(hasPin ? { geo: { "@type": "GeoCoordinates", latitude: listing.lat, longitude: listing.lng } } : {}),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {listing.status !== "published" && (
        <p role="note" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Draft preview. Visitors cannot see this page until it is published.
        </p>
      )}
      <meta name="robots" content={listing.status === "published" ? "index, follow" : "noindex"} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: district?.name ?? "Tamil Nadu", href: district ? `/${district.slug}` : "/" },
          { label: category?.name ?? "Category", href: resultsPath(district?.slug ?? "tamil-nadu", category?.slug ?? "") },
          { label: listing.name },
        ]}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <header>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl" data-testid="listing-name">{listing.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {category && <Link href={resultsPath(district?.slug ?? "tamil-nadu", category.slug)} className="chip hover:bg-slate-200">{category.name}</Link>}
              <span className="text-sm text-slate-600">{areaLabel(listing.areaId, db)}</span>
              {open === true && <span className="chip bg-green-100 text-green-800">Open now</span>}
              {open === false && <span className="chip bg-slate-200 text-slate-700">Closed now</span>}
            </div>
          </header>

          <Gallery photos={listing.photos} name={listing.name} />

          {listing.description && (
            <section aria-labelledby="about">
              <h2 id="about" className="mb-2 text-lg font-semibold">About</h2>
              <p className="leading-relaxed text-slate-700">{listing.description}</p>
            </section>
          )}

          <section aria-labelledby="details">
            <h2 id="details" className="mb-3 text-lg font-semibold">Details</h2>
            <dl className="card divide-y divide-slate-100">
              <Row icon="pin" label="Address">{listing.address || "Not provided"}<br /><span className="text-slate-600">{areaLabel(listing.areaId, db)}</span></Row>
              <Row icon="phone" label="Phone">
                {listing.phones.length ? listing.phones.map((p) => (
                  <a key={p} href={telHref(p)} className="mr-3 inline-block link">{formatPhone(p)}</a>
                )) : "Not provided"}
              </Row>
              {listing.whatsapp && <Row icon="whatsapp" label="WhatsApp"><a className="link" href={whatsappHref(listing.whatsapp)} target="_blank" rel="noopener noreferrer">{formatPhone(listing.whatsapp)}</a></Row>}
              <Row icon="clock" label="Timings">{listing.timings || "Not provided"}</Row>
              {listing.email && <Row icon="mail" label="Email"><a className="link" href={`mailto:${listing.email}`}>{listing.email}</a></Row>}
              {listing.website && <Row icon="globe" label="Website"><a className="link" href={listing.website} target="_blank" rel="noopener noreferrer nofollow">{listing.website.replace(/^https?:\/\//, "")}</a></Row>}
            </dl>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start" aria-label="Contact and location">
          <div className="card space-y-3 p-4">
            {listing.phones[0] && (
              <a href={telHref(listing.phones[0])} className="btn btn-call btn-lg w-full"><Icon name="phone" /> Call {formatPhone(listing.phones[0])}</a>
            )}
            {listing.whatsapp && (
              <a href={whatsappHref(listing.whatsapp, `Hello, I found ${listing.name} on the directory.`)} target="_blank" rel="noopener noreferrer" className="btn btn-wa btn-lg w-full"><Icon name="whatsapp" /> WhatsApp</a>
            )}
            <a href={directionsUrl(listing)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-lg w-full" data-testid="directions"><Icon name="directions" /> Get directions</a>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <ShareButton title={listing.name} />
            </div>
          </div>
          {hasPin ? (
            <Map lat={listing.lat!} lng={listing.lng!} className="h-64" label={`Map showing ${listing.name}`} />
          ) : (
            <p className="card p-4 text-sm text-slate-600">The map pin for this business has not been added yet.</p>
          )}
          <ReportForm listingId={listing.id} listingName={listing.name} />
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-12" aria-labelledby="related">
          <h2 id="related" className="mb-4 text-xl font-semibold">More {category?.name?.toLowerCase()} nearby</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {related.map((r) => <ListingCard key={r.id} listing={r} db={db} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4">
      <Icon name={icon} size={20} className="mt-0.5 shrink-0 text-slate-500" />
      <div>
        <dt className="text-sm font-medium text-slate-600">{label}</dt>
        <dd className="mt-0.5 text-slate-900">{children}</dd>
      </div>
    </div>
  );
}
