import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LetterView } from "@/components/public/CategoriesViews";
import { categoriesByLetter } from "@/lib/data/queries";
import { buildSeedDb } from "@/lib/seed";

export function generateStaticParams() {
  return "abcdefghijklmnopqrstuvwxyz".split("").map((letter) => ({ letter }));
}

type Props = { params: Promise<{ letter: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { letter } = await params;
  const L = letter.toUpperCase();
  const cats = categoriesByLetter(buildSeedDb()).get(L) ?? [];
  const title = `Categories starting with ${L}`;
  const description = cats.length
    ? `Business categories starting with ${L}: ${cats.slice(0, 6).map((c) => c.name).join(", ")}${cats.length > 6 ? " and more" : ""}.`
    : `There are no business categories starting with ${L} yet.`;
  return {
    title,
    description,
    alternates: { canonical: `/categories/${letter.toLowerCase()}` },
    openGraph: { title, description, url: `/categories/${letter.toLowerCase()}` },
    robots: cats.length ? undefined : { index: false, follow: true },
  };
}

export default async function Page({ params }: Props) {
  const { letter } = await params;
  if (!/^[a-zA-Z]$/.test(letter)) notFound();
  return <LetterView letter={letter} />;
}
