export default function AdminLoading() {
  return (
    <div className="animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="mt-2 h-4 w-96 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800/60" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
            </div>
            <div className="h-9 w-16 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="mt-2 h-3 w-40 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 h-6 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-slate-100 p-4 dark:border-slate-800"
            >
              <div className="h-10 w-14 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-36 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-52 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
