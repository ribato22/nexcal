"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[RootError]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
          <svg
            className="h-8 w-8 text-amber-600 dark:text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
          Oops! Ada Masalah
        </h2>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          Terjadi kesalahan yang tidak terduga. Silakan muat ulang halaman ini.
        </p>
        <button
          onClick={reset}
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-95"
        >
          Muat Ulang
        </button>
      </div>
    </div>
  );
}
