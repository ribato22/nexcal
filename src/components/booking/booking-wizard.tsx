"use client";

import { useState, useEffect, useActionState } from "react";
import { getAvailableSlotsAction, getActiveServices } from "@/actions/slots";
import { createBookingAction } from "@/actions/booking";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isBefore,
  startOfDay,
  getDay,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "NexCal";

interface Provider {
  id: string;
  name: string;
  clinicName: string | null;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  dpPercentage: number;
  description: string | null;
  color: string | null;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

// ============================================================
// Step 1: Provider Selector (NEW in v2.0)
// ============================================================
function ProviderSelector({
  providers,
  selected,
  onSelect,
}: {
  providers: Provider[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  // If only 1 provider, auto-select
  useEffect(() => {
    if (providers.length === 1 && !selected) {
      onSelect(providers[0].id);
    }
  }, [providers, selected, onSelect]);

  // Don't render picker if only 1 provider
  if (providers.length <= 1) return null;

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-slate-900">
        Pilih Praktisi
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        Pilih staf atau dokter yang akan menangani Anda.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {providers.map((p) => {
          const isActive = selected === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={`group relative flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                isActive
                  ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-100"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {p.name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-900">
                  {p.name}
                </span>
                {p.clinicName && (
                  <p className="text-xs text-slate-500">{p.clinicName}</p>
                )}
              </div>
              {isActive && (
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Step 2: Service Selector (filtered by provider)
// ============================================================
function ServiceSelector({
  services,
  selected,
  onSelect,
  loading,
}: {
  services: Service[];
  selected: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <svg className="h-6 w-6 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="ml-2 text-sm text-slate-500">Memuat layanan...</span>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-slate-900">
        Pilih Layanan
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        Jenis layanan menentukan durasi slot reservasi Anda.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {services.map((s) => {
          const isActive = selected === s.id;
          const durationLabel =
            s.duration >= 60
              ? `${Math.floor(s.duration / 60)} jam${s.duration % 60 ? ` ${s.duration % 60} mnt` : ""}`
              : `${s.duration} menit`;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className={`group relative flex flex-col rounded-xl border-2 p-4 text-left transition-all ${
                isActive
                  ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-100"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: s.color || "#6366f1" }}
                />
                <span className="text-sm font-semibold text-slate-900">
                  {s.name}
                </span>
              </div>
              {s.description && (
                <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">
                  {s.description}
                </p>
              )}
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                {durationLabel}
              </span>
              <div className="mt-2 flex items-center gap-2">
                <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold ${
                  s.price > 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {s.price > 0 ? formatRupiah(s.price) : "Gratis"}
                </span>
                {s.price > 0 && s.dpPercentage > 0 && s.dpPercentage < 100 && (
                  <span className="inline-flex items-center rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                    DP {s.dpPercentage}%
                  </span>
                )}
              </div>
              {isActive && (
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Step 3: Calendar Picker
// ============================================================
function CalendarPicker({
  selectedDate,
  onSelect,
}: {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = startOfDay(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = getDay(monthStart);
  const paddingDays = Array.from({ length: startDayOfWeek }, (_, i) => i);

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-slate-900">
        Pilih Tanggal
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        Pilih tanggal reservasi Anda.
      </p>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h3 className="text-sm font-semibold text-slate-900">
            {format(currentMonth, "MMMM yyyy", { locale: idLocale })}
          </h3>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-slate-400">
          {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {paddingDays.map((i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const isPast = isBefore(day, today);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);

            return (
              <button
                key={day.toISOString()}
                type="button"
                disabled={isPast}
                onClick={() => onSelect(day)}
                className={`flex h-9 w-full items-center justify-center rounded-lg text-sm transition-all ${
                  isSelected
                    ? "bg-blue-600 font-semibold text-white shadow-sm"
                    : isPast
                      ? "cursor-not-allowed text-slate-300"
                      : isToday
                        ? "border border-blue-200 bg-blue-50 font-medium text-blue-700 hover:bg-blue-100"
                        : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Step 4: Time Slot Picker
// ============================================================
function SlotPicker({
  slots,
  selected,
  onSelect,
  loading,
}: {
  slots: TimeSlot[];
  selected: string | null;
  onSelect: (time: string) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <svg className="h-6 w-6 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="ml-2 text-sm text-slate-500">Memuat slot...</span>
      </div>
    );
  }

  const available = slots.filter((s) => s.available);

  if (slots.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-center">
        <p className="text-sm font-medium text-amber-700">
          ❌ Tidak ada jadwal operasional untuk tanggal ini.
        </p>
        <p className="mt-1 text-xs text-amber-600">
          Mungkin hari libur atau di luar jam operasional. Coba pilih tanggal lain.
        </p>
      </div>
    );
  }

  if (available.length === 0) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center">
        <p className="text-sm font-medium text-red-700">
          📅 Semua slot sudah terisi untuk tanggal ini.
        </p>
        <p className="mt-1 text-xs text-red-600">
          Silakan pilih tanggal lain.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">
        {available.length} slot tersedia
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((slot) => {
          const isSelected = selected === slot.startTime;
          return (
            <button
              key={slot.startTime}
              type="button"
              disabled={!slot.available}
              onClick={() => onSelect(slot.startTime)}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isSelected
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : slot.available
                    ? "border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                    : "cursor-not-allowed border border-slate-100 bg-slate-50 text-slate-300 line-through"
              }`}
            >
              {slot.startTime}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Step 5: Booking Form
// ============================================================
function BookingForm({
  serviceId,
  date,
  time,
  onBack,
}: {
  serviceId: string;
  date: string;
  time: string;
  onBack: () => void;
  }) {
  const [state, formAction, isPending] = useActionState(createBookingAction, {
    success: false,
    error: null,
    bookingId: null,
    summary: null,
  });

  if (state.success && state.summary) {
    return <BookingSuccess summary={state.summary} />;
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Kembali pilih waktu
      </button>

      <h2 className="mb-1 text-lg font-semibold text-slate-900">
        Data Reservasi
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        Lengkapi data berikut untuk menyelesaikan reservasi.
      </p>

      <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <p className="text-xs font-medium text-blue-600">Slot dipilih</p>
        <p className="text-sm font-semibold text-blue-900">
          {format(new Date(date), "EEEE, d MMMM yyyy", { locale: idLocale })} — pukul {time}
        </p>
      </div>

      {state.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          ⚠️ {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="serviceTypeId" value={serviceId} />
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="startTime" value={time} />

        <div>
          <label htmlFor="patientName" className="mb-1 block text-sm font-medium text-slate-700">
            Nama Lengkap *
          </label>
          <input
            id="patientName"
            name="patientName"
            type="text"
            required
            placeholder="Contoh: Siti Rahayu"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label htmlFor="patientPhone" className="mb-1 block text-sm font-medium text-slate-700">
            Nomor WhatsApp *
          </label>
          <input
            id="patientPhone"
            name="patientPhone"
            type="tel"
            required
            placeholder="08xxxxxxxxxx"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label htmlFor="patientNotes" className="mb-1 block text-sm font-medium text-slate-700">
            Keluhan / Catatan
          </label>
          <textarea
            id="patientNotes"
            name="patientNotes"
            rows={3}
            placeholder="Tuliskan keluhan atau catatan penting (opsional)"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Memproses Reservasi...
            </span>
          ) : (
            "✅ Konfirmasi Reservasi"
          )}
        </button>
      </form>
    </div>
  );
}

// ============================================================
// Booking Success
// ============================================================
function BookingSuccess({ summary }: { summary: { serviceName: string; date: string; time: string; patientName: string; paymentUrl?: string; totalPrice?: number; manageUrl?: string } }) {
  const needsPayment = !!summary.paymentUrl && (summary.totalPrice ?? 0) > 0;

  return (
    <div className="py-6 text-center">
      <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${needsPayment ? "bg-amber-100" : "bg-green-100"}`}>
        {needsPayment ? (
          <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
          </svg>
        ) : (
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        )}
      </div>
      <h2 className="text-xl font-bold text-slate-900">
        {needsPayment ? "Reservasi Tercatat! 📋" : "Reservasi Berhasil! 🎉"}
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        {needsPayment
          ? `Terima kasih, ${summary.patientName}. Silakan selesaikan pembayaran untuk mengonfirmasi.`
          : `Terima kasih, ${summary.patientName}. Reservasi Anda telah tercatat.`
        }
      </p>

      <div className="mx-auto mt-6 max-w-sm rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Ringkasan
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Layanan</span>
            <span className="font-medium text-slate-900">{summary.serviceName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Tanggal</span>
            <span className="font-medium text-slate-900">
              {format(new Date(summary.date), "EEEE, d MMMM yyyy", { locale: idLocale })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Pukul</span>
            <span className="font-medium text-slate-900">{summary.time} WIB</span>
          </div>
          {summary.totalPrice != null && summary.totalPrice > 0 && (
            <>
              <div className="my-2 border-t border-dashed border-slate-200" />
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Pembayaran</span>
                <span className="font-bold text-emerald-700">{formatRupiah(summary.totalPrice)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment CTA */}
      {needsPayment && (
        <a
          href={summary.paymentUrl}
          className="mt-6 inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-500 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
          </svg>
          💳 Bayar Sekarang — {formatRupiah(summary.totalPrice!)}
        </a>
      )}

      {!needsPayment && (
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs text-blue-600">
            💡 Status reservasi: <span className="font-semibold">PENDING</span>. Anda akan mendapat konfirmasi dari admin.
          </p>
        </div>
      )}

      {/* Patient Portal CTA */}
      {summary.manageUrl && (
        <div className="mx-auto mt-5 max-w-sm">
          <a
            href={summary.manageUrl}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-purple-500 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
            📋 Kelola Reservasi Anda
          </a>
          <p className="mt-2 text-[11px] text-slate-400">
            Simpan link ini untuk melihat status, menjadwalkan ulang, atau membatalkan reservasi.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-6 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50"
      >
        Buat Reservasi Lain
      </button>
    </div>
  );
}

// ============================================================
// Main Booking Wizard (Orchestrator) — v2.0 with Provider Step
// ============================================================
export function BookingWizard({ providers }: { providers: Provider[] }) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const hasMultipleProviders = providers.length > 1;

  // Fetch services when provider changes
  useEffect(() => {
    if (!selectedProvider) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        setLoadingServices(true);
        setSelectedService(null);
        setSelectedDate(null);
        setSelectedTime(null);
        setSlots([]);
      }
    });
    getActiveServices(selectedProvider).then((result) => {
      if (!cancelled) {
        setServices(result as Service[]);
        setLoadingServices(false);
      }
    });
    return () => { cancelled = true; };
  }, [selectedProvider]);

  // Fetch slots when service + date changes
  useEffect(() => {
    if (!selectedService || !selectedDate) return;
    let cancelled = false;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    Promise.resolve().then(() => {
      if (!cancelled) {
        setLoadingSlots(true);
        setSelectedTime(null);
      }
    });
    getAvailableSlotsAction(dateStr, selectedService).then((result) => {
      if (!cancelled) {
        setSlots(result.slots);
        setLoadingSlots(false);
      }
    });
    return () => { cancelled = true; };
  }, [selectedService, selectedDate]);

  // Step tracking — offset by 1 if multi-provider (step 0 = provider)
  const stepOffset = hasMultipleProviders ? 1 : 0;
  const currentStep =
    showForm
      ? 3 + stepOffset
      : selectedTime
        ? 2 + stepOffset
        : selectedDate
          ? 1 + stepOffset
          : selectedService
            ? 0 + stepOffset
            : selectedProvider
              ? 0 + stepOffset
              : 0;

  const stepLabels = hasMultipleProviders
    ? ["Praktisi", "Layanan", "Tanggal", "Waktu", "Data Diri"]
    : ["Layanan", "Tanggal", "Waktu", "Data Diri"];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-600 to-cyan-500">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900">{appName}</span>
          </div>
          <a
            href="/login"
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Admin Login
          </a>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center gap-2 text-xs">
            {stepLabels.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    i < currentStep
                      ? "bg-blue-600 text-white"
                      : i === currentStep
                        ? "border-2 border-blue-600 text-blue-600"
                        : "border border-slate-200 text-slate-400"
                  }`}
                >
                  {i < currentStep ? "✓" : i + 1}
                </span>
                <span className={`hidden sm:inline ${i <= currentStep ? "text-slate-700" : "text-slate-400"}`}>
                  {step}
                </span>
                {i < stepLabels.length - 1 && (
                  <div className={`h-px w-6 sm:w-10 ${i < currentStep ? "bg-blue-500" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {showForm && selectedService && selectedDate && selectedTime ? (
          <BookingForm
            serviceId={selectedService}
            date={format(selectedDate, "yyyy-MM-dd")}
            time={selectedTime}
            onBack={() => setShowForm(false)}
          />
        ) : (
          <div className="space-y-8">
            {/* Step 1: Provider (only if multiple) */}
            <ProviderSelector
              providers={providers}
              selected={selectedProvider}
              onSelect={(id) => {
                if (id !== selectedProvider) {
                  setSelectedProvider(id);
                }
              }}
            />

            {/* Step 2: Service (filtered by provider) */}
            {selectedProvider && (
              <ServiceSelector
                services={services}
                selected={selectedService}
                loading={loadingServices}
                onSelect={(id) => {
                  setSelectedService(id);
                  setSelectedDate(null);
                  setSelectedTime(null);
                  setSlots([]);
                }}
              />
            )}

            {/* Step 3: Calendar */}
            {selectedService && (
              <CalendarPicker
                selectedDate={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedTime(null);
                }}
              />
            )}

            {/* Step 4: Time Slots */}
            {selectedService && selectedDate && (
              <div>
                <h2 className="mb-1 text-lg font-semibold text-slate-900">
                  Pilih Waktu
                </h2>
                <p className="mb-4 text-sm text-slate-500">
                  Pilih salah satu slot yang tersedia.
                </p>
                <SlotPicker
                  slots={slots}
                  selected={selectedTime}
                  onSelect={setSelectedTime}
                  loading={loadingSlots}
                />
              </div>
            )}

            {/* Continue to Form */}
            {selectedTime && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="w-full rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98]"
              >
                Lanjut → Isi Data Diri
              </button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-4 text-center">
        <p className="text-xs text-slate-400">
          Powered by {appName} — Self-Hosted Booking System
        </p>
      </footer>
    </div>
  );
}
