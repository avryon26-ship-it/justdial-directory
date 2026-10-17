"use client";
import { useId, useRef, useState } from "react";
import type { Suggestion } from "@/lib/data";
import { Icon } from "@/components/shared/Icon";

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onPick: (s: Suggestion) => void;
  getSuggestions: (q: string) => Suggestion[];
  placeholder: string;
  icon: string;
  name: string;
  /** show suggestions even when the box is empty (e.g. popular districts) */
  suggestOnFocus?: boolean;
}

export function Autocomplete({ label, value, onChange, onPick, getSuggestions, placeholder, icon, name, suggestOnFocus }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const items = open && (value.trim() || suggestOnFocus) ? getSuggestions(value) : [];

  function pick(s: Suggestion) {
    onPick(s);
    setOpen(false);
    setActive(-1);
  }

  return (
    <div
      ref={box}
      className="relative"
      onBlur={(e) => {
        if (!box.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <label htmlFor={id} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </label>
      <div className="relative">
        <Icon name={icon} size={20} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          id={id}
          name={name}
          type="text"
          value={value}
          autoComplete="off"
          placeholder={placeholder}
          role="combobox"
          aria-expanded={items.length > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
          className="input min-h-12 pl-10"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && items.length) {
              e.preventDefault();
              setActive((a) => (a + 1) % items.length);
            } else if (e.key === "ArrowUp" && items.length) {
              e.preventDefault();
              setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
            } else if (e.key === "Enter" && active >= 0 && items[active]) {
              e.preventDefault();
              pick(items[active]);
            } else if (e.key === "Escape") setOpen(false);
          }}
        />
      </div>
      {items.length > 0 && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {items.map((s, i) => (
            <li key={`${s.type}-${s.id}`} role="presentation">
              <button
                type="button"
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
                className={`flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${i === active ? "bg-accent-soft" : "hover:bg-slate-50"}`}
              >
                <span className="font-medium text-slate-900">{s.label}</span>
                {s.sub && <span className="shrink-0 text-xs text-slate-600">{s.sub}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
