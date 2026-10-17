"use client";
import { useState } from "react";
import { Icon } from "@/components/shared/Icon";

export function ShareButton({ title }: { title: string }) {
  const [msg, setMsg] = useState("");
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setMsg("Link copied");
    } catch {
      setMsg("Copy the link from the address bar");
    }
    setTimeout(() => setMsg(""), 2500);
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={share} className="btn btn-secondary">
        <Icon name="share" size={18} /> Share
      </button>
      <span role="status" className="text-sm text-slate-600">{msg}</span>
    </span>
  );
}
