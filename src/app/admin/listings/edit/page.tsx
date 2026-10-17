"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ListingForm } from "@/components/admin/ListingForm";
import { EmptyBox, PageHeader } from "@/components/admin/ui";
import { getListing, listingPath, useDb } from "@/lib/data";

function EditListing() {
  const id = useSearchParams().get("id") ?? "";
  const db = useDb();
  const listing = getListing(id, db);
  if (!listing) return <EmptyBox title="This listing was not found" text="It may have been deleted."><Link href="/admin/listings" className="btn btn-primary btn-lg">Back to listings</Link></EmptyBox>;
  return (
    <>
      <PageHeader title={`Edit: ${listing.name}`} actions={<Link href={listingPath(listing, db)} target="_blank" className="btn btn-secondary btn-lg">View on site</Link>} />
      <ListingForm key={listing.id} listing={listing} />
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="text-slate-600">Loading...</p>}>
      <EditListing />
    </Suspense>
  );
}
