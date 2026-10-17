# Nellai Directory: local business directory demo

A client demo of a Justdial-style directory for Tamil Nadu, built with **Next.js (App Router) + TypeScript + Tailwind CSS**.
One project, two apps: the public site at `/` and the admin app at `/admin`.

> **Important: in this demo the data lives only in each visitor's own browser (localStorage).**
> Whatever the client adds or changes on their laptop will **not** appear on another device, in another browser, or for you.
> There is no backend and no database. "Reset demo data" in the admin restores the original sample data.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start   # production build
npm run lint
```

Deploy to Vercel: import the folder as a Next.js project, no environment variables needed.
Optional: set `NEXT_PUBLIC_SITE_URL` (for example `https://your-demo.vercel.app`) so canonical URLs, Open Graph and the sitemap use your domain.
Change the name, tagline, accent colour and logo in **`src/config/site.ts`** (name, logo and contact details can also be edited live in Admin > Settings).

## Demo logins (demo only, not secure)

| Role | Email | Password | Can do |
| --- | --- | --- | --- |
| Owner | `owner@demo.local` | `owner123` | everything |
| Staff | `staff@demo.local` | `staff123` | add/edit listings (saved as Draft), categories, places, import; **cannot** publish, delete, change settings or reset |

The login page has one-click "Owner" and "Staff" buttons.

## 5-minute demo script

1. **Home (30 s)**: show the big search box. Type `dent`, pick *Dentists*; type `palayam` in Where, pick *Palayamkottai*; press Search. Note the breadcrumbs and URL `/tirunelveli/dentists?area=palayamkottai`.
2. **Near me (30 s)**: back on Home press **Use my current location**. Allow it: the Where box fills with the nearest area and result cards show distances, nearest first. (If someone denies it, a friendly message appears and typing still works.)
3. **A to Z (20 s)**: click a letter, e.g. **D**, then a category. Point out greyed letters (no categories: Q, X, Z).
4. **Results and detail (60 s)**: use the filters (Open now, Has WhatsApp, Sort). Open a business: photos, map (OpenStreetMap), Call / WhatsApp / Directions, Share, and **Report wrong information** (send one).
5. **Admin (90 s)**: open `/admin` > **Owner**. Dashboard: totals and "Things to fix". Open the Reports inbox and tick **Resolved**. Go to **Categories**, add *Zumba Studios*: switch to the public tab, and the **Z** letter lights up immediately, with no refresh.
6. **Add a listing (60 s)**: Listings > Add a business. Pick State > District > Area, click the map to place the pin, add a photo (it is shrunk automatically), set **Published**, save. Show it on the public site. Save another as **Draft** and show it is not visible. Mention the duplicate warning.
7. **Rename keeps URLs (20 s)**: rename *Doctors* to *Physicians and Doctors*; open the old `/tirunelveli/doctors` address and see it redirect.
8. **Import (60 s)**: Import / Export > Download template, add a few rows (one with a missing phone, one with an unknown category), upload it, fix a row inline, skip the rest, import. Show Excel/CSV export.
9. **Staff role (20 s)**: sign out, sign in as **Staff**: no Delete, no Publish, no Reset. Finish with the Activity log and Settings > Reset demo data (Owner).

## What is in the box

* **Public**: home with hero search + suggestions, "use my location" (no external API), A-Z strip, popular categories, recently added; results with filters (state/district/area/category, open now, has phone, has WhatsApp), sort (relevance, distance, A-Z), "show more", empty state, nearby areas; detail page with gallery, Leaflet map, share, report form, related businesses; category A-Z index, letter pages, places index.
* **Admin**: dashboard with data problems, listings table + form (duplicate warning, map pin picker, multiple phones, photos), categories (rename with slug redirects, reorder, delete-with-move), regions/areas with coordinates, CSV/Excel import with row-level validation and inline fixing (tested with 2,000 rows), export, visitor reports, activity log, settings, reset.
* **Data model** is ready for later phases: `featured` flag on listings, separate `reports` collection.

## Code layout

```
src/
  app/(public)/...         public routes     (/, /[region]/[category]/[slug], /categories/[letter], /regions, /search)
  app/admin/...            admin routes      (own layout, login, sidebar)
  app/sitemap.ts robots.ts generated from seed data
  components/public|admin|shared
  lib/data/                THE data layer. Only store.ts + kv.ts touch browser storage.
  lib/seed/                deterministic fictional seed data (also used on the server for metadata/sitemap)
  config/site.ts           name, tagline, accent colour, limits
docs/BACKEND_PLAN.md       tables and API endpoints for a real PostgreSQL backend
tests/e2e.mjs              headless-browser test script (Playwright)
```

## SEO: what this demo shows, and what it cannot

The structure is real: clean unique slugs, slug history with redirects, `/[region]/[category]/[listing]` routes, per-page `generateMetadata` (title, description, canonical, Open Graph), one H1 per page, JSON-LD `LocalBusiness` and `BreadcrumbList`, `sitemap.xml`, `robots.txt`, and `noindex` for search pages and pages with no listings. All of it is rendered on the server from the **seed data**.

**Real SEO needs server-side data from a backend.** Search engines see the seed data only. Anything the client adds in their browser (new listings, renamed categories) exists only in that browser, is not in the sitemap, and its page metadata is generic. With a database, the same pages would render every listing on the server.

## What a real backend adds

* **Shared data across devices**: one source of truth that every staff member and visitor sees.
* **Real security and logins**: hashed passwords, sessions, role checks on the server (the demo's login is only a UI gate).
* **True SEO**: server-rendered pages and sitemap built from the database, so every listing is crawlable; correct 301/404 status codes.
* **Reviews and ratings** with moderation; the data model already has room for them.
* **Paid / featured listings**, business-owner accounts and payments (the `featured` flag is already in place).
* Proper image storage and CDN, full-text and geo search at scale, backups, analytics, and rate-limited public forms.

## Testing

`node tests/e2e.mjs` (with the app running on `BASE=http://localhost:3100`) drives a headless Chromium through the flows above: A-Z live update, published vs draft visibility, import validation and a 2,000-row import, category rename redirects, search, mocked geolocation (granted and denied), roles, SEO output and 375 px layouts. It needs `npx playwright install chromium` once.

## Hosting on GitHub Pages

`.github/workflows/pages.yml` builds a static export (`GITHUB_PAGES=1`) and publishes it. Pages is static hosting, so pages for businesses created *after* the build (and old-slug redirects) only work while you click around inside the app, not on a hard refresh. Hosting with `next start` or Vercel has no such limit.
