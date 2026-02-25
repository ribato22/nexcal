import { auth } from "@/lib/auth";
import { getDashboardStats, getTodayBookings } from "@/actions/admin-bookings";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const [stats, todayBookings] = await Promise.all([
    getDashboardStats(),
    getTodayBookings(),
  ]);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Selamat Datang, {session?.user?.name?.split(",")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Kelola jadwal praktik dan reservasi pasien Anda dari sini.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Menunggu Konfirmasi"
          value={String(stats.pendingCount)}
          subtitle={stats.pendingCount > 0 ? "Perlu tindakan Anda" : "Semua sudah tertangani"}
          color="amber"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
        <StatCard
          title="Jadwal Hari Ini"
          value={String(stats.todayCount)}
          subtitle={format(new Date(), "EEEE, d MMMM yyyy", { locale: idLocale })}
          color="blue"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          }
        />
        <StatCard
          title="Selesai Minggu Ini"
          value={String(stats.completedThisWeek)}
          subtitle="Reservasi ditandai selesai"
          color="green"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          }
        />
        <StatCard
          title="Layanan Aktif"
          value={String(stats.activeServices)}
          subtitle="Jenis layanan tersedia"
          color="purple"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
            </svg>
          }
        />
      </div>

      {/* Today's Schedule */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Jadwal Hari Ini
          </h2>
          <Link
            href="/admin/bookings"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Lihat Semua →
          </Link>
        </div>

        {todayBookings.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 px-6 py-12 text-center dark:border-slate-800">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">
              Tidak ada reservasi hari ini
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Jadwal Anda kosong untuk hari ini. Periksa halaman reservasi untuk daftar lengkap.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayBookings.map((b) => {
              const statusColors: Record<string, string> = {
                PENDING: "border-l-amber-400 bg-amber-50/50",
                CONFIRMED: "border-l-green-500 bg-green-50/50",
              };
              const sColor = statusColors[b.status] || "border-l-slate-300";
              return (
                <div
                  key={b.id}
                  className={`flex items-center justify-between rounded-xl border border-slate-200 border-l-4 px-4 py-3 transition-shadow hover:shadow-sm ${sColor}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                      <span className="text-sm font-bold text-slate-700">
                        {format(new Date(b.startTime), "HH:mm")}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {b.patientName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: b.serviceType.color || "#6366f1" }}
                        />
                        {b.serviceType.name} · {b.serviceType.duration} mnt
                      </div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      b.status === "CONFIRMED"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {b.status === "CONFIRMED" ? "Dikonfirmasi" : "Menunggu"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  color,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  color: "blue" | "amber" | "green" | "purple";
  icon: React.ReactNode;
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    green: "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400",
  };

  const valueColorMap = {
    blue: "text-blue-700 dark:text-blue-300",
    amber: "text-amber-700 dark:text-amber-300",
    green: "text-green-700 dark:text-green-300",
    purple: "text-purple-700 dark:text-purple-300",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <p className={`mt-2 text-3xl font-bold ${valueColorMap[color]}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>
    </div>
  );
}
