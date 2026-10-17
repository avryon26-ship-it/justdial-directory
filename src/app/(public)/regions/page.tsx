import type { Metadata } from "next";
import { RegionsIndexView } from "@/components/public/CategoriesViews";

export const metadata: Metadata = {
  title: "Browse by place",
  description: "Browse local businesses by district and area across Tamil Nadu.",
  alternates: { canonical: "/regions" },
  openGraph: { title: "Browse by place", url: "/regions" },
};

export default function Page() {
  return <RegionsIndexView />;
}
