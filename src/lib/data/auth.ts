import type { Role, Session } from "../types";
import { createKV } from "./kv";

/** DEMO ONLY. These credentials are public and give no real security. */
export const DEMO_USERS: (Session & { password: string })[] = [
  { name: "Demo Owner", email: "owner@demo.local", password: "owner123", role: "owner" },
  { name: "Demo Staff", email: "staff@demo.local", password: "staff123", role: "staff" },
];

export const sessionKV = createKV<Session | null>("bd.session", "local", null);

export class PermissionError extends Error {
  constructor(message = "You do not have permission to do this.") {
    super(message);
    this.name = "PermissionError";
  }
}

export function getSession(): Session | null {
  return sessionKV.get();
}

export function login(email: string, password: string): Session | null {
  const user = DEMO_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
  if (!user) return null;
  const session: Session = { name: user.name, email: user.email, role: user.role };
  sessionKV.set(session);
  return session;
}

export function logout() {
  sessionKV.set(null);
}

export function requireSession(roles?: Role[]): Session {
  const s = getSession();
  if (!s) throw new PermissionError("Please sign in first.");
  if (roles && !roles.includes(s.role)) throw new PermissionError("Only the Owner can do this.");
  return s;
}
