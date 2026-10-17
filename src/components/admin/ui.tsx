"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { getStorageUsage, useDb } from "@/lib/data";
import { siteConfig } from "@/config/site";

/* ---------------- toast ---------------- */
type Toast = { id: number; text: string; tone: "ok" | "error" };
const ToastCtx = createContext<(text: string, tone?: "ok" | "error") => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: "ok" | "error" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "error" ? 7000 : 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex max-w-sm flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} data-testid="toast" className={`pointer-events-auto rounded-lg px-4 py-3 text-base text-white shadow-lg ${t.tone === "ok" ? "bg-slate-900" : "bg-red-700"}`}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------------- confirm dialog ---------------- */
export function ConfirmDialog({
  open, title, children, confirmLabel = "Yes, continue", cancelLabel = "Cancel", danger, onConfirm, onCancel, disabled,
}: {
  open: boolean; title: string; children?: React.ReactNode; confirmLabel?: string; cancelLabel?: string; danger?: boolean; disabled?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" data-testid="confirm-dialog">
        <h2 id="dlg-title" className="text-xl font-semibold text-slate-900">{title}</h2>
        <div className="mt-2 text-base text-slate-700">{children}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button ref={cancelRef} type="button" className="btn btn-secondary btn-lg" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" disabled={disabled} className={`btn btn-lg ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm} data-testid="confirm-yes">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- page bits ---------------- */
export function PageHeader({ title, intro, actions }: { title: string; intro?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {intro && <p className="mt-1 max-w-2xl text-base text-slate-600">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function EmptyBox({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-md text-slate-600">{text}</p>}
      {children && <div className="mt-4 flex justify-center gap-3">{children}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return status === "published" ? (
    <span className="chip bg-green-100 text-green-800">Published</span>
  ) : (
    <span className="chip bg-amber-100 text-amber-900">Draft</span>
  );
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label text-base">{label}</label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      <button type="button" className="btn btn-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      <span className="text-base text-slate-700">Page {page} of {pages}</span>
      <button type="button" className="btn btn-secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
}

/* ---------------- storage meter ---------------- */
export function StorageMeter({ dark = false }: { dark?: boolean }) {
  const db = useDb();
  const [usage, setUsage] = useState(() => ({ usedBytes: 0, budgetBytes: siteConfig.storageBudgetBytes, percent: 0 }));
  useEffect(() => {
    // re-measure whenever data changes
    const id = requestAnimationFrame(() => setUsage(getStorageUsage(siteConfig.storageBudgetBytes)));
    return () => cancelAnimationFrame(id);
  }, [db]);
  const tone = usage.percent >= 90 ? "bg-red-500" : usage.percent >= 70 ? "bg-amber-500" : "bg-green-500";
  return (
    <div data-testid="storage-meter">
      <div className={`mb-1 flex justify-between text-xs ${dark ? "text-slate-300" : "text-slate-700"}`}>
        <span>Browser storage used</span>
        <span>{(usage.usedBytes / 1024 / 1024).toFixed(2)} of {(usage.budgetBytes / 1024 / 1024).toFixed(0)} MB</span>
      </div>
      <div className={`h-2 overflow-hidden rounded-full ${dark ? "bg-slate-700" : "bg-slate-200"}`} role="progressbar" aria-valuenow={usage.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Browser storage used">
        <div className={`h-full ${tone}`} style={{ width: `${Math.max(2, usage.percent)}%` }} />
      </div>
      {usage.percent >= 70 && (
        <p role="alert" className={`mt-2 flex items-start gap-1.5 text-xs ${usage.percent >= 90 ? "text-red-300" : "text-amber-300"} ${dark ? "" : "!text-amber-800"}`}>
          <Icon name="alert" size={14} className="mt-0.5 shrink-0" />
          {usage.percent >= 90 ? "Storage is almost full. Remove photos or old listings before adding more." : "Storage is getting full. Use fewer or smaller photos."}
        </p>
      )}
    </div>
  );
}
