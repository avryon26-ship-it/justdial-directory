/**
 * One place to rebrand the whole demo.
 * Change the name, tagline, accent colour or logo here.
 * (Name, logo and contact details can ALSO be edited at runtime in Admin > Settings.)
 */
export const siteConfig = {
  name: "Nellai Directory",
  regionName: "Tamil Nadu",
  tagline: "Find trusted local businesses and services across Tamil Nadu",
  /** Main accent colour (any CSS hex colour). Used for buttons, links and highlights. */
  accent: "#1f4fd8",
  /** Simple built-in logo mark: a single letter in a rounded square. Replace with a URL/data URI if you prefer an image. */
  logoLetter: "N",
  logoImage: "" as string,
  contact: {
    phone: "90000 00000",
    email: "hello@directory.example",
    address: "12, Demo Street, Tirunelveli - 627001",
  },
  /** Used when no NEXT_PUBLIC_SITE_URL / VERCEL_URL is available. */
  fallbackUrl: "http://localhost:3000",
  /** Maximum photos per listing (localStorage is small). */
  maxPhotosPerListing: 5,
  /** Approximate localStorage budget used for the storage meter (bytes). */
  storageBudgetBytes: 5 * 1024 * 1024,
  pageSize: 12,
};

export type SiteConfig = typeof siteConfig;
