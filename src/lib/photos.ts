const PALETTES: [string, string][] = [
  ["#c7d2fe", "#6366f1"], ["#bae6fd", "#0284c7"], ["#bbf7d0", "#16a34a"], ["#fde68a", "#d97706"],
  ["#fecdd3", "#e11d48"], ["#e9d5ff", "#9333ea"], ["#99f6e4", "#0d9488"], ["#e2e8f0", "#475569"],
];

/** Generated placeholder artwork (no copyrighted images): "seed:N" becomes a small SVG. */
export function photoSrc(photo: string): string {
  if (!photo.startsWith("seed:")) return photo;
  const i = Number(photo.slice(5)) % PALETTES.length;
  const [a, b] = PALETTES[i];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><g fill="#fff" fill-opacity=".55"><rect x="150" y="260" width="500" height="220" rx="10"/><rect x="190" y="170" width="420" height="110" rx="10" fill-opacity=".4"/></g><g fill="${b}" fill-opacity=".55"><rect x="200" y="330" width="90" height="150"/><rect x="340" y="320" width="110" height="70"/><rect x="490" y="320" width="110" height="70"/></g></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
