export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-500" />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Memuat...
        </p>
      </div>
    </div>
  );
}
