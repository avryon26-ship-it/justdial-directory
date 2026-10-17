"use client";
import { useSyncExternalStore } from "react";
import type { Db, Session } from "../types";
import { getDb, getServerDb, subscribe } from "./store";
import { sessionKV } from "./auth";
import { userLocationKV, type UserLocation } from "./location";

/** Live data. Re-renders on any change, including changes made in another tab. */
export function useDb(): Db {
  return useSyncExternalStore(subscribe, getDb, getServerDb);
}

export function useSession(): Session | null {
  return useSyncExternalStore(sessionKV.subscribe, sessionKV.get, sessionKV.getServer);
}

export function useUserLocation(): UserLocation | null {
  return useSyncExternalStore(userLocationKV.subscribe, userLocationKV.get, userLocationKV.getServer);
}
