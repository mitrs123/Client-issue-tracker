/**
 * Lightweight loading skeleton rendered by route-level loading.tsx files.
 *
 * Every page in (app) is an async server component that queries a remote
 * Postgres (Supabase, ap-northeast-2). Without an instant fallback the browser
 * shows nothing until all queries resolve, so navigation *feels* frozen. This
 * skeleton streams immediately on click and is swapped for real content when
 * the server finishes — turning dead clicks into responsive ones.
 */
export function PageSkeleton({
  rows = 6,
  showCards = false,
}: {
  rows?: number;
  showCards?: boolean;
}) {
  return (
    <div className="space-y-4 p-4 md:p-5 lg:p-6 mx-auto max-w-7xl animate-pulse">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4">
        <div className="h-9 w-64 rounded-lg bg-outline-variant/15" />
        <div className="h-4 w-32 rounded bg-outline-variant/15" />
      </div>

      {/* List / table */}
      <div className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 border-b border-outline-variant/5 px-4 py-4 last:border-b-0"
          >
            <div className="h-4 w-12 rounded bg-outline-variant/15" />
            <div className="h-4 flex-1 rounded bg-outline-variant/15" />
            <div className="h-5 w-16 rounded-full bg-outline-variant/15" />
            <div className="h-5 w-16 rounded-full bg-outline-variant/15" />
            <div className="h-4 w-20 rounded bg-outline-variant/15" />
          </div>
        ))}
      </div>

      {/* Optional stat cards */}
      {showCards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4"
            >
              <div className="mb-3 h-3 w-20 rounded bg-outline-variant/15" />
              <div className="h-7 w-16 rounded bg-outline-variant/15" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
