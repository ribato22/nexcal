import { notFound } from "next/navigation";
import { getBookingByToken, type ManagedBooking } from "@/actions/booking-manage";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import PatientPortalClient from "./client";

// Force dynamic rendering (token is unique per request)
export const dynamic = "force-dynamic";

function canModifyBooking(booking: ManagedBooking): {
  canCancel: boolean;
  canReschedule: boolean;
  reason?: string;
} {
  const isActive = ["PENDING", "CONFIRMED"].includes(booking.status);
  if (!isActive) {
    return { canCancel: false, canReschedule: false, reason: "Booking sudah tidak aktif." };
  }
  const now = new Date();
  const hoursUntilStart = (new Date(booking.startTime).getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilStart < 24) {
    return {
      canCancel: false,
      canReschedule: false,
      reason: "🔒 Tombol Ubah/Batal dinonaktifkan karena jadwal Anda kurang dari 24 jam dari sekarang. Silakan hubungi admin langsung via WhatsApp jika ada keadaan darurat.",
    };
  }
  const canReschedule = booking.rescheduleCount < 1;
  return {
    canCancel: true,
    canReschedule,
    reason: canReschedule ? undefined : "Batas perubahan jadwal telah habis. Silakan hubungi admin.",
  };
}

export default async function ManageBookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const booking = await getBookingByToken(token);

  if (!booking) notFound();

  const modification = canModifyBooking(booking);

  const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
    PENDING: { label: "Menunggu Konfirmasi", color: "amber", icon: "⏳" },
    CONFIRMED: { label: "Dikonfirmasi", color: "green", icon: "✅" },
    COMPLETED: { label: "Selesai", color: "blue", icon: "🎉" },
    CANCELLED: { label: "Dibatalkan", color: "red", icon: "❌" },
    NO_SHOW: { label: "Tidak Hadir", color: "gray", icon: "👻" },
  };

  const status = statusLabels[booking.status] || statusLabels.PENDING;

  const paymentLabels: Record<string, string> = {
    PAID: "Lunas",
    UNPAID: "Belum Bayar",
    REFUNDED: "Dikembalikan",
    FAILED: "Gagal",
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="border-b border-blue-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-lg px-4 py-4">
          <h1 className="text-lg font-bold text-slate-900">
            {booking.user.clinicName || "NexCal"}
          </h1>
          <p className="text-xs text-slate-500">Portal Pasien — Kelola Reservasi</p>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        {/* Status Badge */}
        <div className={`rounded-2xl border p-4 ${
          status.color === "green"
            ? "border-green-200 bg-green-50"
            : status.color === "amber"
            ? "border-amber-200 bg-amber-50"
            : status.color === "red"
            ? "border-red-200 bg-red-50"
            : status.color === "blue"
            ? "border-blue-200 bg-blue-50"
            : "border-slate-200 bg-slate-50"
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{status.icon}</span>
            <div>
              <p className="text-sm font-medium text-slate-500">Status Reservasi</p>
              <p className="text-lg font-bold text-slate-900">{status.label}</p>
            </div>
          </div>
          {booking.cancelReason && (
            <p className="mt-2 text-sm text-red-600">Alasan: {booking.cancelReason}</p>
          )}
        </div>

        {/* Booking Details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Detail Reservasi
          </h2>

          <div className="space-y-3">
            <DetailRow
              label="Layanan"
              value={booking.serviceType.name}
              badge={booking.serviceType.isVirtual ? "🎥 Online" : undefined}
            />
            <DetailRow
              label="Tanggal"
              value={format(new Date(booking.date), "EEEE, d MMMM yyyy", { locale: localeId })}
            />
            <DetailRow
              label="Waktu"
              value={`${format(new Date(booking.startTime), "HH:mm")} — ${format(new Date(booking.endTime), "HH:mm")} (${booking.serviceType.duration} menit)`}
            />
            <DetailRow label="Penyedia" value={booking.user.name} />
            <DetailRow label="Pasien" value={booking.patientName} />
            {booking.patientNotes && (
              <DetailRow label="Catatan" value={booking.patientNotes} />
            )}
          </div>
        </div>

        {/* Payment Receipt */}
        {booking.totalPrice > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Informasi Pembayaran
            </h2>
            <div className="space-y-3">
              <DetailRow
                label="Total"
                value={`Rp ${booking.totalPrice.toLocaleString("id-ID")}`}
              />
              {booking.dpAmount > 0 && booking.dpAmount < booking.totalPrice && (
                <DetailRow
                  label="DP Dibayar"
                  value={`Rp ${booking.dpAmount.toLocaleString("id-ID")}`}
                />
              )}
              <DetailRow
                label="Status Bayar"
                value={paymentLabels[booking.paymentStatus] || booking.paymentStatus}
              />
            </div>

            {/* Payment CTA for UNPAID bookings */}
            {booking.paymentStatus === "UNPAID" && booking.paymentUrl ? (
              <a
                href={booking.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                </svg>
                💳 Bayar Sekarang — Rp {booking.totalPrice.toLocaleString("id-ID")}
              </a>
            ) : booking.paymentStatus === "UNPAID" && !booking.paymentUrl ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-xs text-red-700">
                  ⚠️ Tautan pembayaran gagal dibuat. Silakan hubungi admin untuk melakukan pembayaran langsung.
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Google Meet Link */}
        {booking.meetingUrl ? (
          <a
            href={booking.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 transition-colors hover:bg-blue-100"
          >
            <span className="text-2xl">🎥</span>
            <div>
              <p className="text-sm font-semibold text-blue-900">Link Google Meet</p>
              <p className="text-xs text-blue-600">Klik untuk bergabung ke konsultasi online</p>
            </div>
          </a>
        ) : booking.serviceType.isVirtual && ["PENDING", "CONFIRMED"].includes(booking.status) ? (
          <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <span className="text-2xl">💻</span>
            <div>
              <p className="text-sm font-semibold text-indigo-900">Google Meet — Menunggu Konfirmasi</p>
              <p className="text-xs text-indigo-600">
                Tautan Google Meet sedang diproses. Tautan akan otomatis muncul di sini setelah admin mengkonfirmasi reservasi Anda.
              </p>
            </div>
          </div>
        ) : null}

        {/* Action Buttons (Client Component) */}
        <PatientPortalClient
          token={token}
          canCancel={modification.canCancel}
          canReschedule={modification.canReschedule}
          reason={modification.reason}
          bookingStatus={booking.status}
          rescheduleCount={booking.rescheduleCount}
        />

        {/* Footer */}
        <div className="pt-4 text-center">
          <p className="text-xs text-slate-400">
            ID: {booking.id.slice(0, 8)}… · Dibuat {format(new Date(booking.createdAt), "d MMM yyyy HH:mm")}
          </p>
          {booking.user.phone && (
            <p className="mt-1 text-xs text-slate-400">
              Hubungi admin: {booking.user.phone}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900">
        {value}
        {badge && (
          <span className="ml-1.5 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
            {badge}
          </span>
        )}
      </span>
    </div>
  );
}
