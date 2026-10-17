import { getDb } from "./store";

export function listActivity() {
  return getDb().activity;
}
