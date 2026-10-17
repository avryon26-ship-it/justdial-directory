"use client";
import { useState } from "react";
import { photoSrc } from "@/lib/photos";
import { Icon } from "@/components/shared/Icon";

export function Gallery({ photos, name }: { photos: string[]; name: string }) {
  const [i, setI] = useState(0);
  if (photos.length === 0)
    return (
      <div className="grid aspect-[16/9] place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-600">
        <span className="flex items-center gap-2"><Icon name="image" /> No photos yet</span>
      </div>
    );
  const current = Math.min(i, photos.length - 1);
  return (
    <div data-testid="gallery">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photoSrc(photos[current])} alt={`${name}, photo ${current + 1} of ${photos.length}`} className="aspect-[16/9] w-full rounded-xl border border-slate-200 object-cover" />
      {photos.length > 1 && (
        <ul className="mt-2 flex gap-2 overflow-x-auto" aria-label="Photo thumbnails">
          {photos.map((p, idx) => (
            <li key={idx}>
              <button
                type="button"
                onClick={() => setI(idx)}
                aria-label={`Show photo ${idx + 1}`}
                aria-current={idx === current}
                className={`block overflow-hidden rounded-lg border-2 ${idx === current ? "border-accent" : "border-transparent"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoSrc(p)} alt="" className="h-16 w-24 object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
