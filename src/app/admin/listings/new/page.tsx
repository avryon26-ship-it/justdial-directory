"use client";
import { ListingForm } from "@/components/admin/ListingForm";
import { PageHeader } from "@/components/admin/ui";

export default function NewListing() {
  return (
    <>
      <PageHeader title="Add a business" intro="Fill in what you know. Fields marked with a star are required." />
      <ListingForm />
    </>
  );
}
