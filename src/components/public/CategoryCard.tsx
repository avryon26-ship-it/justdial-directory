import Link from "next/link";
import type { Category } from "@/lib/types";
import { toneFor } from "@/lib/tones";
import { Icon } from "@/components/shared/Icon";

export function CategoryCard({ category, href, count }: { category: Category; href: string; count?: number }) {
  return (
    <Link href={href} className="card card-hover group flex min-h-[88px] items-center gap-3 p-4">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${toneFor(category.icon).tile} transition-transform group-hover:scale-105`}>
        <Icon name={category.icon} size={22} />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold text-slate-900">{category.name}</span>
        {count !== undefined && <span className="text-sm text-slate-600">{count} listing{count === 1 ? "" : "s"}</span>}
      </span>
    </Link>
  );
}
