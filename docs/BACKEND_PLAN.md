# Backend plan (PostgreSQL)

This demo keeps all data in the browser. Every read and write already goes through **one data layer**
(`src/lib/data/*`, imported as `@/lib/data`). To go live, re-implement those functions as calls to a real API.
No component needs to change except where a function becomes `async`.

## Tables

```sql
create table regions (
  id           uuid primary key default gen_random_uuid(),
  type         text not null check (type in ('state','district','area')),
  name         text not null,
  slug         text not null unique,
  parent_id    uuid references regions(id),
  lat          double precision,           -- required for areas ("near me")
  lng          double precision,
  created_at   timestamptz not null default now()
);
create index on regions(parent_id);

create table region_slug_history (          -- old URLs that must keep redirecting
  slug       text primary key,
  region_id  uuid not null references regions(id) on delete cascade
);

create table categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text not null unique,
  letter     char(1) generated always as (upper(left(name,1))) stored,  -- A-Z group
  sort_order int  not null default 0,
  icon       text,
  popular    boolean not null default false
);
create table category_slug_history (slug text primary key, category_id uuid not null references categories(id) on delete cascade);

create table listings (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  category_id  uuid not null references categories(id),   -- restrict delete: block while listings exist
  area_id      uuid not null references regions(id),
  address      text,
  whatsapp     text,
  email        text,
  website      text,
  timings      text,                                      -- later: structured opening_hours table
  description  text,
  lat          double precision,
  lng          double precision,
  status       text not null default 'draft' check (status in ('draft','published')),
  featured     boolean not null default false,            -- paid/featured phase
  created_by   uuid references users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  search       tsvector                                   -- name + category + area + address
);
create index on listings (category_id, area_id) where status = 'published';
create index on listings using gin (search);
create index on listings using gist (ll_to_earth(lat, lng));   -- earthdistance, or PostGIS geography

create table listing_slug_history (slug text primary key, listing_id uuid not null references listings(id) on delete cascade);
create table listing_phones (listing_id uuid references listings(id) on delete cascade, position int, phone text not null, primary key (listing_id, position));
create table listing_photos (id uuid primary key default gen_random_uuid(), listing_id uuid references listings(id) on delete cascade, position int, url text not null);  -- files go to object storage (S3/R2), not the DB

create table reports (            -- "Report wrong information"
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete set null,
  listing_name text not null, message text not null, contact text,
  resolved boolean not null default false, resolved_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table users (id uuid primary key default gen_random_uuid(), name text, email text unique not null, password_hash text not null, role text not null check (role in ('owner','staff')));
create table activity_log (id bigserial primary key, at timestamptz not null default now(), user_id uuid references users(id), action text not null, target text, detail text);
create table settings (key text primary key, value jsonb not null);   -- site name, logo URL, contact details

-- Later phases (data model is ready for them):
-- create table reviews (id uuid pk, listing_id uuid, rating int, body text, status text, ...);
-- listings.featured / featured_until for paid placement.
```

## API endpoints

Public (cacheable, server-rendered for SEO):

| Method | Path | Maps to data-layer function |
| --- | --- | --- |
| GET | `/api/categories` | `listCategories`, `categoriesByLetter`, `popularCategories` |
| GET | `/api/categories/resolve?slug=` | `resolveCategorySlug` (returns canonical slug, `301` if from history) |
| GET | `/api/regions` | `listStates / listDistricts / listAreas` |
| GET | `/api/regions/resolve?slug=` | `resolveRegionSlug` |
| GET | `/api/regions/nearest?lat=&lng=` | `nearestArea` |
| GET | `/api/listings?q=&category=&region=&area=&open=&phone=&wa=&sort=&lat=&lng=&page=` | `searchListings` (published only) |
| GET | `/api/listings/recent` | `recentlyAdded` |
| GET | `/api/listings/:slug` | `resolveListingSlug`, `relatedListings` |
| GET | `/api/suggest?type=what\|where&q=` | `suggestWhat`, `suggestWhere` |
| POST | `/api/reports` | `createReport` |
| GET | `/sitemap.xml`, `/robots.txt` | generated from the database |

Admin (session cookie, role checked on the server):

| Method | Path | Role | Function |
| --- | --- | --- | --- |
| POST | `/admin/api/login`, `/logout` | all | `login`, `logout` |
| GET | `/admin/api/listings?...` | staff, owner | `adminSearchListings` |
| POST | `/admin/api/listings` | staff (forced `draft`), owner | `createListing` |
| PUT | `/admin/api/listings/:id` | staff (cannot change status), owner | `updateListing` (writes slug history on rename) |
| PATCH | `/admin/api/listings/:id/status` | owner | `setListingStatus` |
| DELETE | `/admin/api/listings/:id` | owner | `deleteListing` |
| GET | `/admin/api/listings/duplicates?name=&phone=&address=` | staff, owner | `findDuplicates` |
| POST | `/admin/api/categories`, PUT `/:id`, POST `/:id/move` | staff, owner | `createCategory`, `renameCategory`, `moveCategory` |
| DELETE | `/admin/api/categories/:id?moveTo=` | owner | `deleteCategory` (409 if listings remain and no `moveTo`) |
| POST/PUT | `/admin/api/regions` | staff, owner | `createRegion`, `updateRegion` |
| DELETE | `/admin/api/regions/:id` | owner | `deleteRegion` |
| POST | `/admin/api/import/validate` | staff, owner | `validateImportRows` (multipart file; returns row-level errors) |
| POST | `/admin/api/import/commit` | staff, owner | `importListings` (single transaction, batch insert) |
| GET | `/admin/api/export.csv`, `/export.xlsx` | staff, owner | export |
| POST | `/admin/api/uploads` | staff, owner | photo upload to object storage (resize server-side) |
| GET/PATCH | `/admin/api/reports`, `/:id` | staff, owner | `listReports`, `setReportResolved` |
| GET | `/admin/api/activity` | staff, owner | `listActivity` |
| GET/PUT | `/admin/api/settings` | owner | `getSettings`, `updateSettings` |

## Rules the backend must keep (the demo already behaves this way)

* Slugs are lowercase-hyphenated and unique; on collision append the area slug, then a counter. Renaming writes the old slug to `*_slug_history`; public routes answer **301** from history to the current URL.
* Staff can create/edit but never publish, delete, change settings or reset. Enforce this server-side, not just in the UI.
* A category with listings cannot be deleted unless `moveTo` is given. A region with children or listings cannot be deleted.
* Only `status = 'published'` rows are ever returned by public endpoints. Pages with zero published listings are `noindex`.
* "Open now" is computed from timings. Store structured opening hours (day, open, close) instead of free text.
* Distance sorting: use PostGIS / earthdistance instead of the client-side haversine.

## Migration path

1. Create the schema and a seed script from `src/lib/seed/*`.
2. Build the endpoints above (Next.js route handlers or a separate API).
3. Replace `src/lib/data/store.ts` (the only file that reads/writes browser storage) and turn the write functions into `fetch` calls. Keep function names and return shapes.
4. Move `generateMetadata`, `sitemap.ts` and the server `page.tsx` files from `buildSeedDb()` to real database queries and render listing data on the server.
5. Split into two apps if desired: `src/components/admin`, `src/app/admin` (admin) and `src/components/public`, `src/app/(public)` (public) share only `src/lib` and `src/config`.
