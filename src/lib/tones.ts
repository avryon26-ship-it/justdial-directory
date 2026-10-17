/** Soft colour pairs used to tell categories apart. Full class names so Tailwind can see them. */
export const TONES = [
  { tile: "bg-indigo-50 text-indigo-600", bar: "border-l-indigo-500", dot: "bg-indigo-500" },
  { tile: "bg-emerald-50 text-emerald-600", bar: "border-l-emerald-500", dot: "bg-emerald-500" },
  { tile: "bg-amber-50 text-amber-600", bar: "border-l-amber-500", dot: "bg-amber-500" },
  { tile: "bg-rose-50 text-rose-600", bar: "border-l-rose-500", dot: "bg-rose-500" },
  { tile: "bg-sky-50 text-sky-600", bar: "border-l-sky-500", dot: "bg-sky-500" },
  { tile: "bg-violet-50 text-violet-600", bar: "border-l-violet-500", dot: "bg-violet-500" },
  { tile: "bg-teal-50 text-teal-600", bar: "border-l-teal-500", dot: "bg-teal-500" },
  { tile: "bg-orange-50 text-orange-600", bar: "border-l-orange-500", dot: "bg-orange-500" },
];

export function toneFor(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}
