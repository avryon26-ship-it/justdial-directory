import type { Region } from "../types";
import { slugify } from "../slug";

type AreaDef = [name: string, lat: number, lng: number];
interface DistrictDef {
  name: string;
  lat: number;
  lng: number;
  pin: number;
  areas: AreaDef[];
}

export const DISTRICTS: DistrictDef[] = [
  {
    name: "Tirunelveli", lat: 8.7139, lng: 77.7567, pin: 627001,
    areas: [
      ["Palayamkottai", 8.727, 77.734], ["Tirunelveli Junction", 8.7316, 77.697], ["Melapalayam", 8.693, 77.728],
      ["Vannarpettai", 8.723, 77.716], ["Thachanallur", 8.769, 77.711], ["Pettai", 8.7556, 77.7001],
      ["Maharaja Nagar", 8.712, 77.736], ["Perumalpuram", 8.697, 77.745], ["Gangaikondan", 8.847, 77.797],
    ],
  },
  {
    name: "Tenkasi", lat: 8.9594, lng: 77.3152, pin: 627811,
    areas: [
      ["Tenkasi Town", 8.9594, 77.3152], ["Courtallam", 8.9306, 77.273], ["Sankarankovil", 9.17, 77.53],
      ["Shencottai", 8.976, 77.242], ["Puliyangudi", 9.174, 77.401], ["Kadayanallur", 9.08, 77.343],
      ["Alangulam", 8.865, 77.497], ["Surandai", 9.009, 77.422],
    ],
  },
  {
    name: "Thoothukudi", lat: 8.7642, lng: 78.1348, pin: 628001,
    areas: [
      ["Thoothukudi Town", 8.7642, 78.1348], ["Tiruchendur", 8.497, 78.119], ["Kovilpatti", 9.1717, 77.8687],
      ["Srivaikuntam", 8.63, 77.913], ["Ettayapuram", 9.146, 77.99], ["Sathankulam", 8.44, 77.91],
      ["Kayalpattinam", 8.57, 78.11], ["Vilathikulam", 9.029, 78.156],
    ],
  },
  {
    name: "Madurai", lat: 9.9252, lng: 78.1198, pin: 625001,
    areas: [
      ["Anna Nagar", 9.917, 78.147], ["Simmakkal", 9.925, 78.123], ["K Pudur", 9.946, 78.145],
      ["Thirupparankundram", 9.879, 78.071], ["Tallakulam", 9.94, 78.133], ["Goripalayam", 9.937, 78.129],
      ["Avaniyapuram", 9.89, 78.1], ["Mattuthavani", 9.946, 78.173],
    ],
  },
  {
    name: "Kanyakumari", lat: 8.0883, lng: 77.5385, pin: 629001,
    areas: [
      ["Nagercoil", 8.1833, 77.4119], ["Kanyakumari Town", 8.0883, 77.5385], ["Marthandam", 8.312, 77.227],
      ["Colachel", 8.177, 77.257], ["Thuckalay", 8.248, 77.301], ["Kuzhithurai", 8.314, 77.193],
      ["Padmanabhapuram", 8.248, 77.331], ["Suchindram", 8.155, 77.465],
    ],
  },
  {
    name: "Virudhunagar", lat: 9.585, lng: 77.957, pin: 626001,
    areas: [
      ["Virudhunagar Town", 9.585, 77.957], ["Sivakasi", 9.449, 77.799], ["Rajapalayam", 9.452, 77.555],
      ["Aruppukottai", 9.51, 78.097], ["Srivilliputhur", 9.512, 77.633], ["Sattur", 9.358, 77.923],
    ],
  },
];

export function buildRegions(): Region[] {
  const out: Region[] = [
    { id: "s-tamil-nadu", type: "state", name: "Tamil Nadu", slug: "tamil-nadu", slugHistory: [], parentId: null },
  ];
  const used = new Set<string>(["tamil-nadu"]);
  for (const d of DISTRICTS) {
    const did = `d-${slugify(d.name)}`;
    used.add(slugify(d.name));
    out.push({
      id: did, type: "district", name: d.name, slug: slugify(d.name), slugHistory: [],
      parentId: "s-tamil-nadu", lat: d.lat, lng: d.lng,
    });
  }
  for (const d of DISTRICTS) {
    const did = `d-${slugify(d.name)}`;
    for (const [name, lat, lng] of d.areas) {
      let slug = slugify(name);
      if (used.has(slug)) slug = `${slug}-${slugify(d.name)}`;
      used.add(slug);
      out.push({ id: `a-${slug}`, type: "area", name, slug, slugHistory: [], parentId: did, lat, lng });
    }
  }
  return out;
}
