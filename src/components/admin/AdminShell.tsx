"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/shared/Icon";
import { Logo } from "@/components/shared/Logo";
import { logout, useSession } from "@/lib/data";
import { StorageMeter, ToastProvider } from "./ui";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/listings", label: "Listings", icon: "list" },
  { href: "/admin/categories", label: "Categories", icon: "grid" },
  { href: "/admin/regions", label: "Regions and Areas", icon: "pin" },
  { href: "/admin/import", label: "Import / Export", icon: "upload" },
  { href: "/admin/reports", label: "Reports from visitors", icon: "inbox" },
  { href: "/admin/activity", label: "Activity log", icon: "history" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

const useMounted = () => useSyncExternalStore(() => () => {}, () => true, () => false);

export function AdminShell({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const mounted = useMounted();
  const pathname = usePathname().replace(/(.)\/$/, "$1");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (mounted && !session && !isLogin) router.replace("/admin/login");
  }, [mounted, session, isLogin, router]);
  useEffect(() => setOpen(false), [pathname]);

  if (isLogin) return <ToastProvider>{children}</ToastProvider>;
  if (!mounted || !session) return <div className="grid min-h-screen place-items-center bg-slate-100 text-slate-600">Loading...</div>;

  const sidebar = (
    <div className="flex h-full flex-col bg-navy text-slate-100">
      <div className="border-b border-white/10 p-4">
        <Logo href="/admin" dark subtitle="Admin area" />
      </div>
      <nav aria-label="Admin" className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map((n) => {
          const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-base font-medium transition-colors ${active ? "bg-accent text-white shadow-md" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
            >
              <Icon name={n.icon} size={20} /> {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-4 border-t border-white/10 p-4">
        <StorageMeter dark />
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-700"><Icon name="user" size={20} /></span>
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium" data-testid="session-name">{session.name}</p>
            <p className="text-slate-400">{session.role === "owner" ? "Owner" : "Staff"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/" target="_blank" className="btn btn-sm flex-1 bg-slate-800 text-slate-100 hover:bg-slate-700">View site</Link>
          <button
            type="button"
            className="btn btn-sm flex-1 bg-slate-800 text-slate-100 hover:bg-slate-700"
            onClick={() => {
              logout();
              router.replace("/admin/login");
            }}
            data-testid="logout"
          >
            <Icon name="logout" size={16} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-100 text-slate-900 lg:grid lg:grid-cols-[280px_1fr]">
        <aside className="sticky top-0 hidden h-screen lg:block" aria-label="Sidebar">{sidebar}</aside>
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-3 lg:hidden">
          <button type="button" className="btn btn-ghost" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)} data-testid="admin-menu">
            <Icon name="menu" size={24} /> Menu
          </button>
          <span className="text-sm font-medium text-slate-700">{session.role === "owner" ? "Owner" : "Staff"}</span>
        </div>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[85%]">{sidebar}</div>
          </div>
        )}
        <main className="min-w-0 p-4 sm:p-6 lg:p-8" id="admin-main">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
