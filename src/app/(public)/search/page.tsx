import type { Metadata } from "next";
import { Suspense } from "react";
import { ResultsView } from "@/components/public/ResultsView";

// Search result pages are never indexed: they are infinite, thin and duplicate the category pages.
export const metadata: Metadata = {
  title: "Search results",
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10 text-slate-600">Loading results...</div>}>
      <ResultsView regionSlug="" categorySlug={null} />
    </Suspense>
  );
}
