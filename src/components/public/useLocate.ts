"use client";
import { useState } from "react";
import { distanceKm } from "@/lib/geo";
import { areaLabel, getDb, nearestArea, setUserLocation, type UserLocation } from "@/lib/data";

export type LocateState = "idle" | "loading" | "ok" | "denied" | "unavailable";

/** Asks the browser for the position, then finds the nearest known area locally. No external API. */
export function useLocate(onLocated?: (loc: UserLocation) => void) {
  const [state, setState] = useState<LocateState>("idle");
  const [message, setMessage] = useState("");

  function locate() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState("unavailable");
      setMessage("Location is not available on this device. No problem - just type your area or district.");
      return;
    }
    setState("loading");
    setMessage("Finding your location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const db = getDb();
        const near = nearestArea(here, db);
        if (!near) {
          setState("unavailable");
          setMessage("We do not have any areas to match your position yet. Please type your area.");
          return;
        }
        const loc: UserLocation = { ...here, areaId: near.area.id, label: areaLabel(near.area.id, db) };
        setUserLocation(loc);
        setState("ok");
        const km = distanceKm(here, { lat: near.area.lat!, lng: near.area.lng! });
        setMessage(km > 60 ? `The nearest area we cover is ${loc.label} (${Math.round(km)} km away).` : `Showing results near ${loc.label}.`);
        onLocated?.(loc);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState("denied");
          setMessage("Location is switched off, which is fine. Please type your area or district instead.");
        } else {
          setState("unavailable");
          setMessage("We could not find your location just now. Please type your area or district.");
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  return { state, message, locate };
}
