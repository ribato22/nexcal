"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AdminError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 dark:border-red-900 dark:bg-red-950/30 sm:p-12">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
          <svg
            className="h-8 w-8 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h2 className="mb-2 text-xl font-bold text-red-800 dark:text-red-300">
          Terjadi Kesalahan
        </h2>
        <p className="mb-6 max-w-md text-sm text-red-600 dark:text-red-400">
          Maaf, terjadi kesalahan saat memuat halaman ini. Silakan coba lagi
          atau kembali ke dashboard.
        </p>

        {error.digest && (
          <p className="mb-4 font-mono text-xs text-red-400 dark:text-red-500">
            Kode Error: {error.digest}
          </p>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md active:scale-95"
          >
            Coba Lagi
          </button>
          <a
            href="/admin/dashboard"
            className="rounded-xl border border-red-200 bg-white px-6 py-2.5 text-sm font-semibold text-red-700 transition-all hover:bg-red-50 dark:border-red-800 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
