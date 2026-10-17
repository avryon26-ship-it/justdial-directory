import type { Listing, Region, Category } from "../types";
import { slugify, uniqueSlug } from "../slug";
import { CATEGORY_DEFS } from "./categories";
import { DISTRICTS } from "./regions";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BRANDS = [
  "Sri Vel", "Anbu", "Kavin", "Meena", "Thendral", "Nila", "Poigai", "Vaigai", "Kural", "Senthil",
  "Mullai", "Oviya", "Aadhira", "Bharathi", "Tamizh", "Pothigai", "Sangam", "Kaveri", "Isai", "Thirumal",
  "Ezhil", "Nalam", "Amudham", "Pazhani", "Arasu", "Kayal", "Thenral", "Mugil", "Siruvani", "Aruvi",
  "Nandhavanam", "Velan", "Kadhir", "Ponni", "Vetri", "Sakthi", "Ilakkiya", "Maruthi", "Sunai", "Thamarai",
  "Pasumai", "Alagu", "Kuyil", "Mathi", "Oli", "Valluvan", "Eswari", "Chola", "Pandian", "Cheran",
];
const STREETS = [
  "Main Road", "Bazaar Street", "Market Road", "Temple Street", "Gandhi Road", "Nehru Street",
  "Railway Feeder Road", "Bypass Road", "Cross Street", "College Road", "North Car Street", "South Mada Street",
];
const TIMINGS = [
  "Mon-Sat 9:00 AM - 8:00 PM",
  "Mon-Sun 8:00 AM - 10:00 PM",
  "Mon-Sat 9:30 AM - 1:30 PM, 4:30 PM - 8:30 PM; Sun Closed",
  "Mon-Sat 10:00 AM - 7:00 PM; Sun 10:00 AM - 2:00 PM",
  "Mon-Fri 9:00 AM - 5:00 PM; Sat-Sun Closed",
  "Mon-Sat 7:00 AM - 9:00 PM",
  "24 Hours",
];

/** Fixed reference date so server and client always generate identical seed data. */
const BASE_TIME = Date.UTC(2026, 8, 1, 10, 0, 0);

export function buildListings(regions: Region[], categories: Category[]): Listing[] {
  const rand = mulberry32(20260916);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const areas = regions.filter((r) => r.type === "area");
  const districtById = new Map(regions.filter((r) => r.type === "district").map((d) => [d.id, d]));
  const pinByDistrict = new Map(DISTRICTS.map((d) => [`d-${slugify(d.name)}`, d.pin]));
  // Tirunelveli is weighted heavier so the headline demo pages are well populated.
  const weighted: Region[] = [];
  for (const a of areas) {
    const w = a.parentId === "d-tirunelveli" ? 6 : a.parentId === "d-madurai" ? 2 : 1;
    for (let i = 0; i < w; i++) weighted.push(a);
  }

  // Popular categories appear three times as often so the headline demo pages are well populated.
  const weightedDefs: number[] = [];
  CATEGORY_DEFS.forEach((d, i) => {
    for (let k = 0; k < (d.popular ? 3 : 1); k++) weightedDefs.push(i);
  });

  const out: Listing[] = [];
  const names = new Set<string>();
  const slugs = new Set<string>();
  let phoneCounter = 100;
  const TARGET = 308;

  for (let n = 0; n < TARGET; n++) {
    const defIndex = n < CATEGORY_DEFS.length * 2 ? n % CATEGORY_DEFS.length : pick(weightedDefs);
    const def = CATEGORY_DEFS[defIndex];
    const cat = categories[defIndex];
    // Make sure the headline pairs exist: first pass of Doctors/Dentists/etc lands in Tirunelveli.
    const area = n < CATEGORY_DEFS.length ? areas.find((a) => a.id === "a-palayamkottai")! : pick(weighted);
    const district = districtById.get(area.parentId!)!;

    let name = "";
    for (let tries = 0; tries < 30; tries++) {
      name = `${pick(BRANDS)} ${pick(def.suffixes)}`;
      if (!names.has(name.toLowerCase())) break;
    }
    names.add(name.toLowerCase());

    const slug = uniqueSlug(name, slugs, [area.slug]);
    slugs.add(slug);

    const phone1 = `90000${String(phoneCounter++).padStart(5, "0")}`;
    const phones = rand() < 0.2 ? [phone1, `90000${String(phoneCounter++).padStart(5, "0")}`] : rand() < 0.07 ? [] : [phone1];
    const whatsapp = phones.length && rand() < 0.55 ? phones[0] : "";
    const brandSlug = slugify(name);
    const created = new Date(BASE_TIME - Math.floor(rand() * 90 * 86400000) - n * 60000).toISOString();
    const status = rand() < 0.86 ? "published" : "draft";
    const photoCount = rand() < 0.65 ? 1 + Math.floor(rand() * 3) : 0;
    const photos = Array.from({ length: photoCount }, () => `seed:${Math.floor(rand() * 8)}`);
    const pin = (pinByDistrict.get(district.id) ?? 627001) + Math.floor(rand() * 6);
    const lat = Number((area.lat! + (rand() - 0.5) * 0.02).toFixed(5));
    const lng = Number((area.lng! + (rand() - 0.5) * 0.02).toFixed(5));
    const noCoords = rand() < 0.03;

    out.push({
      id: `l-${String(n + 1).padStart(4, "0")}`,
      name,
      slug,
      slugHistory: [],
      categoryId: cat.id,
      areaId: area.id,
      address: `${1 + Math.floor(rand() * 220)}, ${pick(STREETS)}, ${area.name}, ${district.name} - ${pin}`,
      phones,
      whatsapp,
      email: rand() < 0.35 ? `info@${brandSlug}.example` : "",
      website: rand() < 0.3 ? `https://${brandSlug}.example` : "",
      timings: pick(TIMINGS),
      description: `${name} is a fictional demo business in ${area.name}, ${district.name}, offering ${def.services}. Friendly staff, fair prices and easy access from the main road. All details on this page are made up for demonstration.`,
      photos,
      lat: noCoords ? null : lat,
      lng: noCoords ? null : lng,
      status,
      featured: false,
      createdAt: created,
      updatedAt: created,
      createdBy: "Seed data",
    });
  }
  return out;
}
