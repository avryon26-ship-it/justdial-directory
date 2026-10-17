import Link from "next/link";
import type { Db, Listing } from "@/lib/types";
import { areaLabel, getCategory, listingPath } from "@/lib/data";
import { directionsUrl, formatDistance, formatPhone, telHref, whatsappHref } from "@/lib/geo";
import { toneFor } from "@/lib/tones";
import { Icon } from "@/components/shared/Icon";

export function ListingCard({ listing: l, db, distanceKm, open }: { listing: Listing; db: Db; distanceKm?: number | null; open?: boolean | null }) {
  const cat = getCategory(l.categoryId, db);
  return (
    <article className={`card card-hover border-l-4 p-4 sm:p-5 ${toneFor(cat?.icon ?? "tag").bar}`} data-testid="listing-card" data-listing-id={l.id}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-snug text-slate-900">
            <Link href={listingPath(l, db)} className="hover:text-accent hover:underline">
              {l.name}
            </Link>
          </h3>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600"><span className={`h-2 w-2 rounded-full ${toneFor(cat?.icon ?? "tag").dot}`} />{cat?.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {open === true && <span className="chip bg-emerald-100 text-emerald-800">Open now</span>}
          {distanceKm != null && (
            <span className="chip bg-accent-soft text-accent-dark" data-testid="distance">
              {formatDistance(distanceKm)} away
            </span>
          )}
        </div>
      </div>
      <p className="mt-3 flex items-start gap-2 text-sm text-slate-700">
        <Icon name="pin" size={16} className="mt-0.5 shrink-0 text-slate-500" />
        <span>
          {l.address || areaLabel(l.areaId, db)}
          <span className="block text-slate-600">{areaLabel(l.areaId, db)}</span>
        </span>
      </p>
      {l.phones[0] && (
        <p className="mt-1.5 flex items-center gap-2 text-sm text-slate-700">
          <Icon name="phone" size={16} className="shrink-0 text-slate-500" />
          {formatPhone(l.phones[0])}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {l.phones[0] && (
          <a href={telHref(l.phones[0])} className="btn btn-call">
            <Icon name="phone" size={16} /> Call
          </a>
        )}
        {l.whatsapp && (
          <a href={whatsappHref(l.whatsapp, `Hello, I found ${l.name} on the directory.`)} target="_blank" rel="noopener noreferrer" className="btn btn-wa">
            <Icon name="whatsapp" size={16} /> WhatsApp
          </a>
        )}
        <a href={directionsUrl(l)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
          <Icon name="directions" size={16} /> Directions
        </a>
      </div>
    </article>
  );
}
