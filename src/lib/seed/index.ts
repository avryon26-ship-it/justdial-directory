import type { Db } from "../types";
import { siteConfig } from "@/config/site";
import { buildRegions } from "./regions";
import { buildCategories } from "./categories";
import { buildListings } from "./listings";

let cached: Db | null = null;

export function defaultSettings() {
  return {
    siteName: siteConfig.name,
    logo: siteConfig.logoImage,
    phone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    address: siteConfig.contact.address,
  };
}

/** Deterministic demo data. Same result on server and in the browser. Never mutate the returned object. */
export function buildSeedDb(): Db {
  if (cached) return cached;
  const regions = buildRegions();
  const categories = buildCategories();
  const listings = buildListings(regions, categories);
  cached = { regions, categories, listings, reports: [], activity: [], settings: defaultSettings() };
  return cached;
}
