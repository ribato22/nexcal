import { auth } from "@/lib/auth";
import { getDashboardStats, getTodayBookings } from "@/actions/admin-bookings";
import { getAnalytics } from "@/actions/analytics";
import { format } from "date-fns";
import Link from "next/link";

// ============================================================
// Helpers
// ============================================================

function formatRupiah(amount: number): string {
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")} jt`;
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatRupiahFull(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// ============================================================
// Dashboard Page
// ============================================================

export default async function DashboardPage() {
  const session = await auth();
  const [stats, todayBookings, analytics] = await Promise.all([
    getDashboardStats(),
    getTodayBookings(),
    getAnalytics(),
  ]);

  const maxTrendBookings = Math.max(...analytics.dailyTrend.map((d) => d.bookings), 1);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Selamat Datang, {session?.user?.name?.split(",")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Pusat komando bisnis — pantau pendapatan, reservasi, dan performa tim Anda.
        </p>
      </div>

      {/* ============================================ */}
      {/* Revenue & Core Metrics  */}
      {/* ============================================ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-teal-50 p-5 shadow-sm dark:border-emerald-800 dark:from-emerald-950/40 dark:to-teal-950/30">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Pendapatan Bulan Ini</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-800 dark:text-emerald-200">
            {formatRupiah(analytics.revenue.currentMonth)}
          </p>
          <div className="mt-1 flex items-center gap-1">
            {analytics.revenue.growthPercent >= 0 ? (
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                ▲ {analytics.revenue.growthPercent}%
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-semibold text-red-500">
                ▼ {Math.abs(analytics.revenue.growthPercent)}%
              </span>
            )}
            <span className="text-xs text-slate-400">vs bulan lalu</span>
          </div>
          {/* Decorative circle */}
          <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-emerald-200/30 dark:bg-emerald-700/10" />
        </div>

        {/* Pending */}
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

        {/* Completed */}
        <StatCard
          title="Selesai (Total)"
          value={String(analytics.bookingSummary.totalCompleted)}
          subtitle={`${analytics.bookingSummary.cancellationRate}% tingkat pembatalan`}
          color="green"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          }
        />

        {/* Unpaid */}
        <StatCard
          title="Belum Bayar"
          value={String(analytics.revenue.unpaidCount)}
          subtitle={`${analytics.revenue.paidCount} sudah lunas bulan ini`}
          color="purple"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
            </svg>
          }
        />
      </div>

      {/* ============================================ */}
      {/* 30-Day Booking Trend (CSS Bar Chart) */}
      {/* ============================================ */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Tren Reservasi 30 Hari</h2>
            <p className="text-xs text-slate-400">Jumlah reservasi harian (tidak termasuk batal)</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" /> Reservasi
            </span>
          </div>
        </div>

        <div className="flex h-40 items-end gap-[3px]">
          {analytics.dailyTrend.map((d) => {
            const height = maxTrendBookings > 0 ? (d.bookings / maxTrendBookings) * 100 : 0;
            return (
              <div
                key={d.date}
                className="group relative flex-1"
                title={`${d.label}: ${d.bookings} reservasi`}
              >
                <div
                  className="w-full rounded-t bg-blue-500 transition-all group-hover:bg-blue-600 dark:bg-blue-400"
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
                {/* Tooltip on hover */}
                <div className="pointer-events-none absolute -top-10 left-1/2 z-10 hidden -translate-x-1/2 rounded bg-slate-800 px-2 py-1 text-[10px] text-white whitespace-nowrap group-hover:block">
                  {d.label}: {d.bookings}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-slate-400">
          <span>{analytics.dailyTrend[0]?.label}</span>
          <span>{analytics.dailyTrend[Math.floor(analytics.dailyTrend.length / 2)]?.label}</span>
          <span>{analytics.dailyTrend[analytics.dailyTrend.length - 1]?.label}</span>
        </div>
      </div>

      {/* ============================================ */}
      {/* Two-Column: Top Services + Staff Performance */}
      {/* ============================================ */}
      <div className={`mt-8 grid gap-6 ${analytics.isOwner ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
        {/* Top Services */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
            🏆 Layanan Terpopuler (Bulan Ini)
          </h2>
          {analytics.topServices.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">Belum ada data bulan ini.</p>
          ) : (
            <div className="space-y-3">
              {analytics.topServices.map((s, i) => {
                const maxCount = analytics.topServices[0]?.bookingCount || 1;
                const widthPercent = (s.bookingCount / maxCount) * 100;
                return (
                  <div key={s.serviceId}>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 dark:bg-slate-800">
                          {i + 1}
                        </span>
                        <span
                          className="h-2. w-2.5 rounded-full"
                          style={{ backgroundColor: s.serviceColor || "#6366f1" }}
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{s.serviceName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{s.bookingCount}x</span>
                        {s.revenue > 0 && (
                          <span className="ml-2 text-xs text-emerald-600">{formatRupiah(s.revenue)}</span>
                        )}
                      </div>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Staff Performance (Owner only) */}
        {analytics.isOwner && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
              👥 Kinerja Staf (Bulan Ini)
            </h2>
            {analytics.providerPerformance.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">Belum ada data bulan ini.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Staf</th>
                      <th className="pb-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Booking</th>
                      <th className="pb-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Selesai</th>
                      <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {analytics.providerPerformance.map((p) => (
                      <tr key={p.userId} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                              {p.userName.charAt(0)}
                            </span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{p.userName}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-center text-sm font-semibold text-slate-900 dark:text-white">{p.bookingCount}</td>
                        <td className="py-2.5 text-center text-sm text-slate-600 dark:text-slate-400">{p.completedCount}</td>
                        <td className="py-2.5 text-right text-sm font-bold text-emerald-600">{formatRupiahFull(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* Today's Schedule (kept from v1) */}
      {/* ============================================ */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Jadwal Hari Ini ({stats.todayCount})
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
                PENDING: "border-l-amber-400 bg-amber-50/50 dark:bg-amber-950/20",
                CONFIRMED: "border-l-green-500 bg-green-50/50 dark:bg-green-950/20",
              };
              const sColor = statusColors[b.status] || "border-l-slate-300";
              return (
                <div
                  key={b.id}
                  className={`flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 px-4 py-3 transition-shadow hover:shadow-sm ${sColor}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-800">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {format(new Date(b.startTime), "HH:mm")}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {b.patientName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
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
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
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

// ============================================================
// Stat Card Component
// ============================================================

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
