/** Small shared UI pieces for PayWise pages. */

export function PageShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-5 md:py-8">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950 md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-600">{subtitle}</p>}
      </div>
      {children}
    </main>
  );
}

export function Panel({ title, note, children, className = "" }: { title?: string; note?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-ink-200 bg-white shadow-[0_1px_0_rgba(16,32,46,0.04)] ${className}`}>
      {title && (
        <div className="border-b border-ink-100 px-4 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink-600">{title}</h2>
          {note && <p className="mt-0.5 text-xs text-ink-400">{note}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function LoadState({ loading, error, empty }: { loading: boolean; error: string; empty?: string | false }) {
  if (error) return <p className="p-4 text-sm text-red-700">{error}</p>;
  if (loading) return <p className="p-4 text-sm text-ink-400">Loading…</p>;
  if (empty) return <p className="p-4 text-sm text-ink-400">{empty}</p>;
  return null;
}

/** "groceries" -> "Groceries" */
export function categoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}
