/**
 * The data layer. Components import from "@/lib/data" and never touch browser storage.
 * To move to a real backend, re-implement these functions as API calls (see docs/BACKEND_PLAN.md).
 */
export * from "./queries";
export * from "./listings";
export * from "./categories";
export * from "./regions";
export * from "./reports";
export * from "./settings";
export * from "./activity";
export * from "./import";
export * from "./auth";
export * from "./location";
export { DataError } from "./write";
export { StorageFullError, getStorageUsage, getDb } from "./store";
export type { StorageUsage } from "./store";
export { useDb, useSession, useUserLocation } from "./hooks";
