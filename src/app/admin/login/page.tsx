"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/shared/Logo";
import { Icon } from "@/components/shared/Icon";
import { DEMO_USERS, login, useSession } from "@/lib/data";

export default function LoginPage() {
  const router = useRouter();
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) router.replace("/admin");
  }, [session, router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (login(email, password)) router.replace("/admin");
    else setError("That email or password is not right. Use one of the demo buttons below.");
  }

  return (
    <div className="grid min-h-screen place-items-center bg-navy p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <Logo href="/admin" subtitle="Admin area" />
        <p className="mt-5 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900" role="note">
          <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
          This is a demo. The sign-in is not secure and the passwords are public. Data stays in this browser only.
        </p>
        <h1 className="mt-6 text-2xl font-bold">Sign in</h1>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {DEMO_USERS.map((u) => (
            <button
              key={u.role}
              type="button"
              className="btn btn-secondary btn-lg flex-col !items-start gap-0 py-2 text-left"
              data-testid={`fill-${u.role}`}
              onClick={() => {
                setEmail(u.email);
                setPassword(u.password);
                setError("");
              }}
            >
              <span className="font-semibold">{u.role === "owner" ? "Owner" : "Staff"}</span>
              <span className="text-xs font-normal text-slate-600">{u.role === "owner" ? "Full access" : "Add and edit only"}</span>
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="email" className="label text-base">Email</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          </div>
          <div>
            <label htmlFor="password" className="label text-base">Password</label>
            <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button type="submit" className="btn btn-primary btn-lg w-full" data-testid="login-submit">Sign in</button>
        </form>
      </div>
    </div>
  );
}
