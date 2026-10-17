"use client";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="grid h-full w-full place-items-center bg-slate-100 text-sm text-slate-600">Loading map...</div>,
});

export function Map(props: React.ComponentProps<typeof LeafletMap> & { className?: string }) {
  const { className = "h-64", ...rest } = props;
  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 ${className}`}>
      <LeafletMap {...rest} />
    </div>
  );
}
