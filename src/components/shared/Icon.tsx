import type { SVGProps } from "react";

const P: Record<string, string[]> = {
  search: ["M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z", "M21 21l-4.3-4.3"],
  pin: ["M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z", "c:12,10,2.5"],
  locate: ["c:12,12,3", "c:12,12,8", "M12 1v3M12 20v3M1 12h3M20 12h3"],
  phone: ["M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"],
  whatsapp: ["M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20z", "M9 9.5c.5 2 2.5 4 5 5l1.2-1.2-1.7-1-.8.6a4 4 0 0 1-1.7-1.7l.6-.8-1-1.7L9 9.5z"],
  directions: ["M3 11l18-8-8 18-2-8-8-2z"],
  clock: ["c:12,12,9", "M12 7v5l3 2"],
  globe: ["c:12,12,9", "M3 12h18", "M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18"],
  mail: ["M3 6h18v12H3z", "M3 7l9 6 9-6"],
  share: ["M4 12v7h16v-7", "M12 3v12", "M8 7l4-4 4 4"],
  chevronRight: ["M9 6l6 6-6 6"],
  chevronDown: ["M6 9l6 6 6-6"],
  chevronUp: ["M6 15l6-6 6 6"],
  close: ["M6 6l12 12M18 6L6 18"],
  menu: ["M4 7h16M4 12h16M4 17h16"],
  check: ["M5 12l5 5 9-10"],
  plus: ["M12 5v14M5 12h14"],
  edit: ["M4 20h4L19 9l-4-4L4 16v4z"],
  trash: ["M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"],
  alert: ["M12 3l10 18H2L12 3z", "M12 10v5M12 18v.01"],
  flag: ["M5 21V4h12l-2 4 2 4H5"],
  upload: ["M12 16V4M7 9l5-5 5 5M4 20h16"],
  download: ["M12 4v12M7 11l5 5 5-5M4 20h16"],
  image: ["M3 5h18v14H3z", "c:8.5,10,1.5", "M3 17l5-4 4 3 3-2 6 4"],
  settings: ["M4 7h10M18 7h2M4 17h2M10 17h10", "c:16,7,2", "c:8,17,2"],
  dashboard: ["M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z"],
  list: ["M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"],
  grid: ["M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"],
  inbox: ["M3 13l3-8h12l3 8v6H3v-6z", "M3 13h5l1 3h6l1-3h5"],
  history: ["M3 12a9 9 0 1 0 3-6.7L3 8", "M3 3v5h5", "M12 7v5l3 2"],
  logout: ["M10 4H5v16h5M15 8l4 4-4 4M19 12H9"],
  lock: ["M6 11h12v10H6z", "M8 11V7a4 4 0 0 1 8 0v4"],
  arrowUp: ["M12 19V5M6 11l6-6 6 6"],
  arrowDown: ["M12 5v14M6 13l6 6 6-6"],
  external: ["M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"],
  user: ["c:12,8,4", "M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"],
  filter: ["M3 5h18l-7 8v6l-4 2v-8z"],
  /* category icons */
  calculator: ["M6 3h12v18H6z", "M9 7h6", "M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01"],
  scale: ["M12 4v16M7 20h10M5 8h14", "M5 8l-3 7a3 3 0 0 0 6 0L5 8z", "M19 8l-3 7a3 3 0 0 0 6 0L19 8z"],
  ruler: ["M3 17L17 3l4 4L7 21z", "M7 13l2 2M10 10l2 2M13 7l2 2"],
  car: ["M3 15v-4l2-5h14l2 5v4H3z", "M3 15h18", "c:7.5,17.5,1.8", "c:16.5,17.5,1.8"],
  cake: ["M4 20h16v-7H4z", "M4 16c3 2 5-2 8 0s5 2 8 0", "M12 13V9", "M12 5.5v.01"],
  sparkle: ["M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"],
  book: ["M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z", "M5 17a3 3 0 0 1 3-3h10"],
  wrench: ["M14 6a4 4 0 0 0 5 5l-9 9a2 2 0 0 1-3-3l9-9a4 4 0 0 1-2-2z"],
  utensils: ["M7 3v7a2 2 0 0 0 2 2v9", "M5 3v6M9 3v6", "M17 3c-2 2-2 6 0 8v10"],
  cap: ["M2 9l10-5 10 5-10 5z", "M6 11v5c3 2.5 9 2.5 12 0v-5"],
  laptop: ["M5 6h14v9H5z", "M3 19h18"],
  tooth: ["M7 4c-3 0-4 3-3 6s2 5 3 9c1 2 2 0 3-3 1-2 3-2 4 0 1 3 2 5 3 3 1-4 2-6 3-9s0-6-3-6c-2 0-3 1-5 1S9 4 7 4z"],
  stethoscope: ["M6 3v6a4 4 0 0 0 8 0V3", "M10 13v2a4 4 0 0 0 8 0v-1", "c:18,12,2"],
  wheel: ["c:12,12,9", "c:12,12,2", "M12 14v7M10.5 11L3.5 9M13.5 11l7-2"],
  bolt: ["M13 2L4 14h7l-1 8 9-12h-7z"],
  tv: ["M3 6h18v12H3z", "M8 21h8"],
  sofa: ["M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3", "M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v5H3z"],
  dumbbell: ["M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"],
  hammer: ["M14 4l6 6-3 3-6-6z", "M12 9L4 17l3 3 8-8"],
  hospital: ["M4 4h16v17H4z", "M12 8v6M9 11h6", "M10 21v-4h4v4"],
  bed: ["M3 18V6M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5", "c:7,11,2"],
  shield: ["M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"],
  palette: ["M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2s0-2 1.5-2h2a4 4 0 0 0 4-4c0-5-4-10-9-10z", "c:8,10,1", "c:12,7,1", "c:16,10,1"],
  diamond: ["M6 4h12l4 6-10 11L2 10z", "M2 10h20M9 4l-2 6 5 11 5-11-2-6"],
  shirt: ["M8 3l-5 3 2 4 3-1v12h8V9l3 1 2-4-5-3c-1 2-5 2-8 0z"],
  drop: ["M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"],
  music: ["M9 18V5l11-2v13", "c:6,18,3", "c:17,16,3"],
  heart: ["M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"],
  eye: ["M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z", "c:12,12,3"],
  truck: ["M2 6h12v10H2z", "M14 9h4l4 4v3h-8z", "c:6,18,2", "c:17,18,2"],
  pill: ["M8 3l-5 5a4.2 4.2 0 0 0 6 6l5-5a4.2 4.2 0 0 0-6-6z", "M6 11l5-5", "M14 14l7 7"],
  camera: ["M3 8h4l2-3h6l2 3h4v12H3z", "c:12,13,4"],
  pipe: ["M4 7h9a3 3 0 0 1 3 3v10", "M12 20h8", "M2 5v4"],
  printer: ["M7 9V3h10v6", "M5 9h14v8H5z", "M7 14h10v7H7z"],
  home: ["M3 11l9-8 9 8", "M5 10v10h14V10", "M10 20v-6h4v6"],
  school: ["M3 21h18M5 21V9l7-5 7 5v12", "M10 21v-6h4v6", "M12 11v.01"],
  cart: ["M3 4h3l3 11h10l2-8H7", "c:10,19,1.5", "c:18,19,1.5"],
  needle: ["M20 4L8 16", "M8 16c-2 0-3 1-4 4 3-1 4-2 4-4z"],
  plane: ["M22 2L11 13", "M22 2l-7 20-4-9-9-4z"],
  paw: ["c:7,10,1.8", "c:11,6,1.8", "c:15,6,1.8", "c:19,10,1.8", "M12 12c-3 0-5 3-5 5.5S9 20 12 19s5 1 5-1.5S15 12 12 12z"],
  hall: ["M3 21h18", "M5 21V10l7-6 7 6v11", "M9 21v-6h6v6"],
  lotus: ["M12 5c2 3 2 7 0 11-2-4-2-8 0-11z", "M4 9c4 0 7 3 8 7-4 0-7-3-8-7z", "M20 9c-4 0-7 3-8 7 4 0 7-3 8-7z", "M5 19h14"],
  tag: ["M3 12V4h8l10 10-8 8z", "c:7.5,8.5,1.2"],
};

export const ICON_NAMES = Object.keys(P);

export function Icon({ name, size = 20, className, ...rest }: { name: string; size?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  const parts = P[name] ?? P.tag;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {parts.map((d, i) => {
        if (d.startsWith("c:")) {
          const [cx, cy, r] = d.slice(2).split(",");
          return <circle key={i} cx={cx} cy={cy} r={r} />;
        }
        return <path key={i} d={d} />;
      })}
    </svg>
  );
}
