"use client";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { useDb } from "@/lib/data";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-b-accent bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav aria-label="Main" className="flex items-center gap-1 text-sm font-medium">
          <Link href="/categories" className="flex min-h-11 items-center rounded-lg px-3 text-slate-700 hover:bg-slate-100">
            Categories
          </Link>
          <Link href="/regions" className="flex min-h-11 items-center rounded-lg px-3 text-slate-700 hover:bg-slate-100">
            Places
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  const { settings } = useDb();
  return (
    <footer className="mt-16 bg-navy text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <Logo dark />
          <p className="mt-3 max-w-xs text-sm text-slate-300">Find trusted local businesses and services across Tamil Nadu.</p>
        </div>
        <div className="text-sm text-slate-300">
          <h2 className="mb-2 font-semibold text-white">Contact</h2>
          <p>{settings.address}</p>
          <p className="mt-1">{settings.phone}</p>
          <p className="mt-1">{settings.email}</p>
        </div>
        <div className="text-sm text-slate-300">
          <h2 className="mb-2 font-semibold text-white">Explore</h2>
          <ul className="space-y-1">
            <li><Link href="/categories" className="text-amber-300 hover:underline">All categories A-Z</Link></li>
            <li><Link href="/regions" className="text-amber-300 hover:underline">Browse by place</Link></li>
            <li><Link href="/admin" className="text-amber-300 hover:underline">Admin area (demo)</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 bg-black/20 px-4 py-3 text-center text-xs text-slate-300">
        Demo site. Every business, phone number and address shown here is fictional. Data is kept only in your own browser.
      </div>
    </footer>
  );
}
