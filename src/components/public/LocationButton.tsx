"use client";
import { Icon } from "@/components/shared/Icon";
import { useUserLocation, setUserLocation, type UserLocation } from "@/lib/data";
import { useLocate } from "./useLocate";

export function LocationButton({ onLocated, className = "" }: { onLocated?: (loc: UserLocation) => void; className?: string }) {
  const { state, message, locate } = useLocate(onLocated);
  const current = useUserLocation();
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={locate} disabled={state === "loading"} className="btn btn-secondary" data-testid="use-location">
          <Icon name="locate" size={18} />
          {state === "loading" ? "Finding you..." : "Use my current location"}
        </button>
        {current && (
          <span className="chip bg-accent-soft text-accent-dark" data-testid="location-chip">
            Near {current.label}
            <button type="button" className="ml-1 rounded p-0.5 hover:bg-white" aria-label="Forget my location" onClick={() => setUserLocation(null)}>
              <Icon name="close" size={14} />
            </button>
          </span>
        )}
      </div>
      <p role="status" aria-live="polite" data-testid="location-message" className={`mt-2 text-sm ${state === "denied" || state === "unavailable" ? "text-amber-800" : "text-slate-700"}`}>
        {message}
      </p>
    </div>
  );
}
