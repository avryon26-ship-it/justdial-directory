"use client";
import { useRef, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { compressImage, dataUrlBytes } from "@/lib/image";
import { photoSrc } from "@/lib/photos";
import { siteConfig } from "@/config/site";
import { useToast } from "./ui";

export function PhotoUploader({ photos, onChange }: { photos: string[]; onChange: (p: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const max = siteConfig.maxPhotosPerListing;

  async function add(files: FileList | null) {
    if (!files || !files.length) return;
    const room = max - photos.length;
    if (room <= 0) {
      toast(`You can add up to ${max} photos for each business.`, "error");
      return;
    }
    setBusy(true);
    const next = [...photos];
    try {
      for (const f of Array.from(files).slice(0, room)) next.push(await compressImage(f));
      if (files.length > room) toast(`Only ${max} photos are allowed, so some were left out.`, "error");
      onChange(next);
    } catch (e) {
      toast(e instanceof Error ? e.message : "That picture could not be added.", "error");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3" data-testid="photo-list">
        {photos.map((p, i) => (
          <div key={i} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoSrc(p)} alt={`Photo ${i + 1}`} className="h-24 w-32 rounded-lg border border-slate-200 object-cover" />
            <span className="absolute bottom-1 left-1 rounded bg-slate-900/70 px-1.5 text-xs text-white">{p.startsWith("seed:") ? "sample" : `${Math.round(dataUrlBytes(p) / 1024)} KB`}</span>
            <button
              type="button"
              aria-label={`Remove photo ${i + 1}`}
              onClick={() => onChange(photos.filter((_, k) => k !== i))}
              className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-white text-red-700 shadow ring-1 ring-slate-300 hover:bg-red-50"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button type="button" className="grid h-24 w-32 place-items-center rounded-lg border-2 border-dashed border-slate-300 text-sm text-slate-700 hover:border-accent hover:text-accent" onClick={() => input.current?.click()} disabled={busy}>
            <span className="flex flex-col items-center gap-1"><Icon name="image" />{busy ? "Working..." : "Add photo"}</span>
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple className="sr-only" aria-label="Choose photos" data-testid="photo-input" onChange={(e) => add(e.target.files)} />
      <p className="hint">Up to {max} photos. Each photo is shrunk automatically (max 800 px wide) so it fits in browser storage.</p>
    </div>
  );
}
