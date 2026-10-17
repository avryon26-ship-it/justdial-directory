const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY = "(sun|mon|tue|wed|thu|fri|sat)[a-z]*";

function toMinutes(h: string, m: string | undefined, ap: string): number {
  let hh = parseInt(h, 10) % 12;
  if (ap.toLowerCase() === "pm") hh += 12;
  return hh * 60 + (m ? parseInt(m, 10) : 0);
}

function dayApplies(seg: string, day: number): boolean {
  const range = seg.match(new RegExp(`\\b${DAY}\\s*(?:-|–|to)\\s*${DAY}`, "i"));
  if (range) {
    const from = DAY_KEYS.indexOf(range[1].toLowerCase());
    const to = DAY_KEYS.indexOf(range[2].toLowerCase());
    return from <= to ? day >= from && day <= to : day >= from || day <= to;
  }
  const single = seg.match(new RegExp(`\\b${DAY}`, "i"));
  if (single) return DAY_KEYS.indexOf(single[1].toLowerCase()) === day;
  return true;
}

/**
 * Best-effort "open now" from free-text timings such as
 * "Mon-Sat 9:00 AM - 1:00 PM, 4:00 PM - 8:00 PM; Sun Closed".
 * Returns null when the text cannot be understood.
 */
export function isOpenNow(timings: string, now: Date = new Date()): boolean | null {
  if (!timings) return null;
  if (/24\s*(hours|hrs|x\s*7)/i.test(timings) || /open\s*24/i.test(timings)) return true;
  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  let understood = false;
  let open = false;
  for (const raw of timings.split(/[;\n]/)) {
    const seg = raw.trim();
    if (!seg || !dayApplies(seg, day)) continue;
    if (/closed/i.test(seg)) {
      understood = true;
      continue;
    }
    const re = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*(?:-|–|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(seg))) {
      understood = true;
      const start = toMinutes(m[1], m[2], m[3]);
      const end = toMinutes(m[4], m[5], m[6]);
      if (start <= end ? mins >= start && mins < end : mins >= start || mins < end) open = true;
    }
  }
  return understood ? open : null;
}
