export type RegionType = "state" | "district" | "area";

export interface Region {
  id: string;
  type: RegionType;
  name: string;
  slug: string;
  slugHistory: string[];
  parentId: string | null;
  lat?: number;
  lng?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  slugHistory: string[];
  order: number;
  icon: string;
  popular: boolean;
}

export type ListingStatus = "draft" | "published";

export interface Listing {
  id: string;
  name: string;
  slug: string;
  slugHistory: string[];
  categoryId: string;
  areaId: string;
  address: string;
  phones: string[];
  whatsapp: string;
  email: string;
  website: string;
  timings: string;
  description: string;
  /** data URIs, or "seed:N" for generated placeholder artwork */
  photos: string[];
  lat: number | null;
  lng: number | null;
  status: ListingStatus;
  /** Reserved for a later paid/featured phase. Not used in the UI yet. */
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Report {
  id: string;
  listingId: string;
  listingName: string;
  message: string;
  contact: string;
  createdAt: string;
  resolved: boolean;
}

export interface ActivityEntry {
  id: string;
  at: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  detail: string;
}

export interface Settings {
  siteName: string;
  logo: string;
  phone: string;
  email: string;
  address: string;
}

export interface Db {
  regions: Region[];
  categories: Category[];
  listings: Listing[];
  reports: Report[];
  activity: ActivityEntry[];
  settings: Settings;
}

export type Role = "owner" | "staff";
export interface Session {
  name: string;
  email: string;
  role: Role;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ListingInput {
  name: string;
  categoryId: string;
  areaId: string;
  address: string;
  phones: string[];
  whatsapp: string;
  email: string;
  website: string;
  timings: string;
  description: string;
  photos: string[];
  lat: number | null;
  lng: number | null;
  status: ListingStatus;
}
