import type { LatLng } from "../types";
import { createKV } from "./kv";

export interface UserLocation extends LatLng {
  areaId: string | null;
  label: string;
}

export const userLocationKV = createKV<UserLocation | null>("bd.userloc", "session", null);

export function getUserLocation(): UserLocation | null {
  return userLocationKV.get();
}
export function setUserLocation(loc: UserLocation | null) {
  userLocationKV.set(loc);
}
