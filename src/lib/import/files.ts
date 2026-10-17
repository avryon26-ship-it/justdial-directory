import Papa from "papaparse";
import type { Db } from "../types";
import { IMPORT_COLUMNS, emptyRaw, type ImportRaw } from "../data/import";
import { areaLabel, districtOf, getCategory, getRegion } from "../data/queries";

const ALIASES: Record<string, keyof ImportRaw> = {
  name: "name", businessname: "name", business: "name", title: "name",
  category: "category", categoryname: "category",
  district: "district",
  area: "area", locality: "area", location: "area",
  address: "address", fulladdress: "address",
  phone: "phone", phones: "phone", mobile: "phone", phonenumber: "phone", contact: "phone", telephone: "phone",
  whatsapp: "whatsapp", whatsappnumber: "whatsapp",
  email: "email", emailaddress: "email",
  website: "website", web: "website", url: "website",
  timings: "timings", hours: "timings", openinghours: "timings", timing: "timings",
  description: "description", about: "description",
  latitude: "latitude", lat: "latitude",
  longitude: "longitude", lng: "longitude", lon: "longitude", long: "longitude",
  status: "status",
};

function mapRecord(rec: Record<string, unknown>): ImportRaw {
  const out = emptyRaw();
  for (const [key, value] of Object.entries(rec)) {
    const target = ALIASES[key.toLowerCase().replace(/[^a-z]/g, "")];
    if (target) out[target] = value === null || value === undefined ? "" : String(value).trim();
  }
  return out;
}

export interface ParsedFile {
  rows: ImportRaw[];
  fileName: string;
}

export async function parseImportFile(file: File): Promise<ParsedFile> {
  const isExcel = /\.xlsx?$/i.test(file.name);
  let records: Record<string, unknown>[];
  if (isExcel) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
  } else if (/\.(csv|txt)$/i.test(file.name)) {
    const text = await file.text();
    const res = Papa.parse<Record<string, unknown>>(text.replace(/^﻿/, ""), { header: true, skipEmptyLines: "greedy" });
    records = res.data;
  } else {
    throw new Error("Please choose a .csv or .xlsx file.");
  }
  const rows = records.map(mapRecord).filter((r) => Object.values(r).some((v) => v !== ""));
  if (rows.length === 0) throw new Error("We could not find any rows. Check that the first row has column names like name, category, area, phone.");
  if (!rows.some((r) => r.name || r.phone || r.category)) throw new Error("The column names were not recognised. Use the template to see the expected columns.");
  return { rows, fileName: file.name };
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const SAMPLE: ImportRaw[] = [
  { name: "Sample Fresh Bakery", category: "Bakeries", district: "Tirunelveli", area: "Palayamkottai", address: "10, Main Road, Palayamkottai", phone: "9000012345", whatsapp: "9000012345", email: "", website: "", timings: "Mon-Sat 9:00 AM - 8:00 PM", description: "Fictional sample row. Delete me.", latitude: "8.727", longitude: "77.734", status: "draft" },
];

export function downloadTemplate() {
  const csv = Papa.unparse({ fields: IMPORT_COLUMNS as string[], data: SAMPLE.map((r) => IMPORT_COLUMNS.map((c) => r[c])) });
  download(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), "listings-import-template.csv");
}

function exportRecords(db: Db) {
  return db.listings.map((l) => {
    const area = getRegion(l.areaId, db);
    return {
      name: l.name,
      category: getCategory(l.categoryId, db)?.name ?? "",
      district: districtOf(l.areaId, db)?.name ?? "",
      area: area?.name ?? areaLabel(l.areaId, db),
      address: l.address,
      phone: l.phones.join("; "),
      whatsapp: l.whatsapp,
      email: l.email,
      website: l.website,
      timings: l.timings,
      description: l.description,
      latitude: l.lat ?? "",
      longitude: l.lng ?? "",
      status: l.status,
    };
  });
}

export function exportCsv(db: Db) {
  const csv = Papa.unparse({ fields: IMPORT_COLUMNS as string[], data: exportRecords(db).map((r) => IMPORT_COLUMNS.map((c) => r[c])) });
  download(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), "listings-export.csv");
}

export async function exportXlsx(db: Db) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(exportRecords(db), { header: IMPORT_COLUMNS as string[] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Listings");
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  download(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "listings-export.xlsx");
}
