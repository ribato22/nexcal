import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="w-full max-w-md text-center">
        <p className="text-7xl font-black text-blue-600 dark:text-blue-500">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-95"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
