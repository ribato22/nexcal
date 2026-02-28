"use client";

import { disconnectGCal } from "@/actions/gcal";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface GCalCardProps {
  connected: boolean;
  configured: boolean;
}

export function GCalCard({ connected, configured }: GCalCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDisconnect = async () => {
    setLoading(true);
    await disconnectGCal();
    router.push("/admin/settings?gcal=disconnected");
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/50">
          <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.5 22h-15A2.5 2.5 0 0 1 2 19.5v-15A2.5 2.5 0 0 1 4.5 2H9v2H4.5a.5.5 0 0 0-.5.5v15a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5V15h2v4.5a2.5 2.5 0 0 1-2.5 2.5Z" />
            <path d="M18.571 4h-3.857V2h5.143A2.143 2.143 0 0 1 22 4.143v5.143h-2V5.429L12.854 12.5l-1.414-1.414L18.571 4Z" />
            <rect x="7" y="7" width="6" height="2" rx="1" />
            <rect x="7" y="11" width="8" height="2" rx="1" />
            <rect x="7" y="15" width="5" height="2" rx="1" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Google Calendar
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sinkronisasi booking ke kalender
          </p>
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
        Booking yang dikonfirmasi akan otomatis muncul sebagai event di Google Calendar Anda.
      </p>

      {!configured ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Belum dikonfigurasi. Minta Owner mengisi <strong>Google Client ID</strong> dan{" "}
          <strong>Client Secret</strong> di halaman <strong>Pengaturan → Integrasi Organisasi</strong>.
        </p>
      ) : connected ? (
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-300">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Terhubung
          </span>
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            {loading ? "Memutus..." : "Putuskan"}
          </button>
        </div>
      ) : (
        <a
          href="/api/gcal/authorize"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Hubungkan Google Calendar
        </a>
      )}
    </div>
  );
}
