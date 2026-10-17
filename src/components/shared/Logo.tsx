"use client";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { useDb } from "@/lib/data";

export function Logo({ href = "/", dark = false, subtitle }: { href?: string; dark?: boolean; subtitle?: string }) {
  const { settings } = useDb();
  const letter = settings.siteName === siteConfig.name ? siteConfig.logoLetter : (settings.siteName.trim()[0] ?? "D").toUpperCase();
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 rounded-lg" aria-label={`${settings.siteName} home`}>
      {settings.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={settings.logo} alt="" className="h-9 w-9 rounded-lg object-contain" />
      ) : (
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-lg font-bold text-white">{letter}</span>
      )}
      <span className="leading-tight">
        <span className={`block text-lg font-semibold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>{settings.siteName}</span>
        {subtitle && <span className={`block text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>{subtitle}</span>}
      </span>
    </Link>
  );
}
