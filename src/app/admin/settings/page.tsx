import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGCalStatus } from "@/actions/gcal";
import { isGCalConfigured } from "@/lib/gcal";
import { GCalCard } from "@/components/admin/gcal-card";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ gcal?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const gcalStatus = await getGCalStatus();
  const gcalConfigured = isGCalConfigured();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Pengaturan
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Kelola integrasi dan konfigurasi akun Anda
        </p>
      </div>

      {/* Flash messages from OAuth flow */}
      {params.gcal === "connected" && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300">
          ✅ Google Calendar berhasil terhubung! Booking yang dikonfirmasi akan otomatis muncul di kalender Anda.
        </div>
      )}
      {params.gcal === "denied" && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300">
          ⚠️ Anda membatalkan proses koneksi Google Calendar.
        </div>
      )}
      {params.gcal === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          ❌ Terjadi kesalahan saat menghubungkan Google Calendar. Coba lagi.
        </div>
      )}
      {params.gcal === "disconnected" && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
          Google Calendar telah diputuskan.
        </div>
      )}

      {/* Integrations Section */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          🔗 Integrasi
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Google Calendar Card */}
          <GCalCard
            connected={gcalStatus.connected}
            configured={gcalConfigured}
          />

          {/* WhatsApp Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950/50">
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  WhatsApp (MultiWA)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Notifikasi booking otomatis
                </p>
              </div>
            </div>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              Kirim notifikasi booking, konfirmasi, dan pembatalan otomatis ke WhatsApp pelanggan via MultiWA.
            </p>
            <div className="flex items-center gap-2 text-sm">
              {process.env.MULTIWA_API_URL ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Terhubung
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  Dikonfigurasi via .env
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
