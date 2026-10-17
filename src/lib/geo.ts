import type { LatLng } from "./types";

export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function directionsUrl(l: { lat: number | null; lng: number | null; name: string; address: string }): string {
  const dest = l.lat != null && l.lng != null ? `${l.lat},${l.lng}` : encodeURIComponent(`${l.name}, ${l.address}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}

export function telHref(phone: string): string {
  return `tel:+91${phone.replace(/\D/g, "").slice(-10)}`;
}

export function whatsappHref(phone: string, text?: string): string {
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/91${phone.replace(/\D/g, "").slice(-10)}${q}`;
}

export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : phone;
}
