"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  lat: number;
  lng: number;
  zoom?: number;
  /** Show a pin at lat/lng */
  showPin?: boolean;
  /** Click on the map to move the pin */
  onPick?: (lat: number, lng: number) => void;
  label?: string;
}

const pinIcon = () => L.divIcon({ className: "", html: '<span class="map-pin"></span>', iconSize: [0, 0] });

/** OpenStreetMap tiles through Leaflet. No API key needed. */
export default function LeafletMap({ lat, lng, zoom = 15, showPin = true, onPick, label }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const pick = useRef(onPick);
  useEffect(() => {
    pick.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { scrollWheelZoom: false }).setView([lat, lng], zoom);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);
    map.current = m;
    if (showPin) marker.current = L.marker([lat, lng], { icon: pinIcon(), keyboard: false }).addTo(m);
    m.on("click", (e: L.LeafletMouseEvent) => pick.current?.(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6))));
    return () => {
      m.remove();
      map.current = null;
      marker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (showPin) {
      if (marker.current) marker.current.setLatLng([lat, lng]);
      else marker.current = L.marker([lat, lng], { icon: pinIcon(), keyboard: false }).addTo(m);
    } else if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }
    m.setView([lat, lng], m.getZoom());
  }, [lat, lng, showPin]);

  return <div ref={el} role="application" aria-label={label ?? "Map"} className="h-full w-full" />;
}
