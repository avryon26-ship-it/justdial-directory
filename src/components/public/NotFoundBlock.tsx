import Link from "next/link";

/** Friendly "not found" content. Renders a noindex meta tag (React hoists it into <head>). */
export function NotFoundBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <meta name="robots" content="noindex" />
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-3 text-slate-600">{text}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">Back to home</Link>
        <Link href="/categories" className="btn btn-secondary">Browse categories</Link>
      </div>
    </div>
  );
}
