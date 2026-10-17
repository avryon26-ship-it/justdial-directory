import type { Metadata } from "next";
import { CategoriesIndexView } from "@/components/public/CategoriesViews";

export const metadata: Metadata = {
  title: "All categories A to Z",
  description: "Browse every business category in alphabetical order: doctors, restaurants, schools, electricians and many more.",
  alternates: { canonical: "/categories" },
  openGraph: { title: "All categories A to Z", url: "/categories" },
};

export default function Page() {
  return <CategoriesIndexView />;
}
