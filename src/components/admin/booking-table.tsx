"use client";

import { useState, useTransition } from "react";
import { updateBookingStatus } from "@/actions/admin-bookings";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// ============================================================
// Status Badge
// ============================================================

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: {
    label: "Menunggu",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  CONFIRMED: {
    label: "Dikonfirmasi",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  CANCELLED: {
    label: "Dibatalkan",
    color: "bg-red-100 text-red-700 border-red-200",
  },
  COMPLETED: {
    label: "Selesai",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  NO_SHOW: {
    label: "Tidak Hadir",
    color: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

function StatusBadge({ status }: { status: string }) {
  const info = statusMap[status] || statusMap.PENDING;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${info.color}`}
    >
      {info.label}
    </span>
  );
}

// ============================================================
// Action Menu (per row)
// ============================================================

function ActionMenu({
  bookingId,
  currentStatus,
}: {
  bookingId: string;
  currentStatus: string;
}) {
  const [open, setOpen] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAction = (status: string, reason?: string) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("bookingId", bookingId);
      fd.set("status", status);
      if (reason) fd.set("cancelReason", reason);
      await updateBookingStatus(fd);
      setOpen(false);
      setShowCancel(false);
      setCancelReason("");
    });
  };

  // Tentukan aksi yang tersedia berdasarkan status saat ini
  const actions: { label: string; status: string; icon: string; className: string }[] = [];

  if (currentStatus === "PENDING") {
    actions.push(
      { label: "Konfirmasi", status: "CONFIRMED", icon: "✅", className: "text-green-700 hover:bg-green-50" },
      { label: "Batalkan", status: "CANCEL_PROMPT", icon: "❌", className: "text-red-700 hover:bg-red-50" },
    );
  }
  if (currentStatus === "CONFIRMED") {
    actions.push(
      { label: "Tandai Selesai", status: "COMPLETED", icon: "✔️", className: "text-blue-700 hover:bg-blue-50" },
      { label: "Tidak Hadir", status: "NO_SHOW", icon: "⛔", className: "text-slate-700 hover:bg-slate-50" },
      { label: "Batalkan", status: "CANCEL_PROMPT", icon: "❌", className: "text-red-700 hover:bg-red-50" },
    );
  }

  if (actions.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setShowCancel(false); }}
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setShowCancel(false); }} />

          <div className="absolute right-0 z-20 mt-1 w-56 rounded-xl border border-slate-200 bg-white shadow-xl">
            {!showCancel ? (
              <div className="py-1">
                {actions.map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      if (action.status === "CANCEL_PROMPT") {
                        setShowCancel(true);
                      } else {
                        handleAction(action.status);
                      }
                    }}
                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${action.className}`}
                  >
                    <span>{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3">
                <p className="mb-2 text-xs font-semibold text-red-700">Alasan Pembatalan</p>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-red-300 focus:ring-1 focus:ring-red-100 resize-none"
                  rows={2}
                  placeholder="Opsional: alasan pembatalan..."
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCancel(false)}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleAction("CANCELLED", cancelReason)}
                    className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isPending ? "..." : "Batalkan"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Filter Bar
// ============================================================

export function BookingFilters({
  currentStatus,
  currentSearch,
}: {
  currentStatus: string;
  currentSearch: string;
}) {
  const statuses = [
    { value: "ALL", label: "Semua" },
    { value: "PENDING", label: "Menunggu" },
    { value: "CONFIRMED", label: "Dikonfirmasi" },
    { value: "COMPLETED", label: "Selesai" },
    { value: "CANCELLED", label: "Dibatalkan" },
    { value: "NO_SHOW", label: "Tidak Hadir" },
  ];

  return (
    <form method="GET" className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          name="search"
          type="text"
          defaultValue={currentSearch}
          placeholder="Cari nama atau nomor WA..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Status Filter */}
      <select
        name="status"
        defaultValue={currentStatus}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
      >
        Filter
      </button>
    </form>
  );
}

// ============================================================
// Booking Table
// ============================================================

interface BookingRow {
  id: string;
  status: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  patientName: string;
  patientPhone: string;
  patientNotes: string | null;
  cancelReason: string | null;
  createdAt: Date;
  serviceType: {
    name: string;
    duration: number;
    color: string | null;
  };
  user?: {
    name: string;
  };
}

export function BookingTable({ bookings, isOwner = false }: { bookings: BookingRow[]; isOwner?: boolean }) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
          <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-medium text-slate-600">Tidak ada reservasi ditemukan</p>
        <p className="mt-1 text-xs text-slate-400">Coba ubah filter pencarian Anda.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Desktop Table */}
      <table className="hidden min-w-full sm:table">
        <thead className="border-b border-slate-100 bg-slate-50/80">
          <tr>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pasien
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Layanan
            </th>
            {isOwner && (
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Staf
              </th>
            )}
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tanggal & Waktu
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Status
            </th>
            <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bookings.map((b) => (
            <tr key={b.id} className="transition-colors hover:bg-slate-50/50">
              <td className="px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {b.patientName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {b.patientPhone}
                  </p>
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: b.serviceType.color || "#6366f1" }}
                  />
                  <span className="text-sm text-slate-700">
                    {b.serviceType.name}
                  </span>
                </div>
              </td>
              {isOwner && (
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                      {(b.user?.name || "?").charAt(0)}
                    </span>
                    {b.user?.name || "-"}
                  </span>
                </td>
              )}
              <td className="px-5 py-4">
                <p className="text-sm text-slate-900">
                  {format(new Date(b.date), "EEE, d MMM yyyy", { locale: idLocale })}
                </p>
                <p className="text-xs text-slate-500">
                  {format(new Date(b.startTime), "HH:mm")} – {format(new Date(b.endTime), "HH:mm")}
                </p>
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={b.status} />
                {b.cancelReason && (
                  <p className="mt-1 text-xs text-red-500 italic">
                    {b.cancelReason}
                  </p>
                )}
              </td>
              <td className="px-5 py-4 text-right">
                <ActionMenu bookingId={b.id} currentStatus={b.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile Cards */}
      <div className="divide-y divide-slate-100 sm:hidden">
        {bookings.map((b) => (
          <div key={b.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {b.patientName}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{b.patientPhone}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={b.status} />
                <ActionMenu bookingId={b.id} currentStatus={b.status} />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-1">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: b.serviceType.color || "#6366f1" }}
                />
                {b.serviceType.name}
              </div>
              <span className="text-slate-300">•</span>
              {isOwner && b.user?.name && (
                <>
                  <span className="text-blue-600 font-medium">{b.user.name}</span>
                  <span className="text-slate-300">•</span>
                </>
              )}
              <span>
                {format(new Date(b.date), "d MMM", { locale: idLocale })}, {format(new Date(b.startTime), "HH:mm")}
              </span>
            </div>
            {b.cancelReason && (
              <p className="mt-1.5 text-xs text-red-500 italic">{b.cancelReason}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
