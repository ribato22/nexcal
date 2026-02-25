"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, format } from "date-fns";
import { notifyBookingConfirmed, notifyBookingCancelled } from "@/lib/whatsapp";
import { pushBookingToCalendar } from "@/lib/gcal";
import { getDataScope } from "@/lib/rbac";

// ============================================================
// Tipe & Interface
// ============================================================

export interface BookingFilters {
  status?: string;
  search?: string;
}

export interface BookingWithService {
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

// ============================================================
// getBookings — Ambil daftar reservasi dengan filter (RBAC)
// ============================================================

export async function getBookings(
  filters?: BookingFilters
): Promise<BookingWithService[]> {
  const scope = await getDataScope();
  if (!scope) throw new Error("Unauthorized");

  const where: Record<string, unknown> = {
    ...scope.userFilter,
  };

  // Filter status
  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  // Filter pencarian (nama / nomor WA)
  if (filters?.search && filters.search.trim() !== "") {
    const term = filters.search.trim();
    where.OR = [
      { patientName: { contains: term, mode: "insensitive" } },
      { patientPhone: { contains: term, mode: "insensitive" } },
    ];
  }

  return prisma.booking.findMany({
    where,
    select: {
      id: true,
      status: true,
      date: true,
      startTime: true,
      endTime: true,
      patientName: true,
      patientPhone: true,
      patientNotes: true,
      cancelReason: true,
      createdAt: true,
      serviceType: {
        select: { name: true, duration: true, color: true },
      },
      // OWNER sees provider name per booking
      user: {
        select: { name: true },
      },
    },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
  }) as Promise<BookingWithService[]>;
}

// ============================================================
// updateBookingStatus — Ubah status reservasi (RBAC)
// ============================================================

const updateStatusSchema = z.object({
  bookingId: z.string().min(1, "Booking ID wajib diisi."),
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]),
  cancelReason: z.string().max(500).optional(),
});

export interface UpdateStatusResult {
  success: boolean;
  error: string | null;
}

export async function updateBookingStatus(
  formData: FormData
): Promise<UpdateStatusResult> {
  try {
    const scope = await getDataScope();
    if (!scope) {
      return { success: false, error: "Sesi tidak valid. Silakan login ulang." };
    }

    const raw = {
      bookingId: formData.get("bookingId") as string,
      status: formData.get("status") as string,
      cancelReason: (formData.get("cancelReason") as string) || undefined,
    };

    const parsed = updateStatusSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Data tidak valid.",
      };
    }

    const { bookingId, status, cancelReason } = parsed.data;

    // Ambil booking — RBAC: OWNER bisa akses semua booking org, STAFF hanya miliknya
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, ...scope.userFilter },
      include: {
        serviceType: { select: { name: true, duration: true } },
        user: { select: { clinicName: true } },
      },
    });

    if (!booking) {
      return { success: false, error: "Reservasi tidak ditemukan." };
    }

    // Update status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        cancelReason: status === "CANCELLED" ? (cancelReason || null) : null,
      },
    });

    // Fire-and-forget WhatsApp notification
    const notifInfo = {
      patientName: booking.patientName,
      patientPhone: booking.patientPhone,
      serviceName: booking.serviceType.name,
      date: booking.date,
      startTime: format(booking.startTime, "HH:mm"),
      duration: booking.serviceType.duration,
      clinicName: booking.user.clinicName || undefined,
    };

    if (status === "CONFIRMED") {
      notifyBookingConfirmed(notifInfo);
      // Push to Google Calendar (fire-and-forget)
      pushBookingToCalendar({
        userId: booking.userId,
        patientName: booking.patientName,
        patientPhone: booking.patientPhone,
        serviceName: booking.serviceType.name,
        startTime: booking.startTime,
        endTime: booking.endTime,
        notes: booking.patientNotes,
        clinicName: booking.user.clinicName,
      });
    } else if (status === "CANCELLED") {
      notifyBookingCancelled(notifInfo, cancelReason);
    }

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/dashboard");

    return { success: true, error: null };
  } catch {
    return { success: false, error: "Terjadi kesalahan sistem." };
  }
}

// ============================================================
// getDashboardStats — Statistik dashboard real-time (RBAC)
// ============================================================

export interface DashboardStats {
  pendingCount: number;
  todayCount: number;
  completedThisWeek: number;
  activeServices: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const scope = await getDataScope();
  if (!scope) throw new Error("Unauthorized");

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [pendingCount, todayCount, completedThisWeek, activeServices] =
    await Promise.all([
      // Reservasi PENDING — scope by role
      prisma.booking.count({
        where: { ...scope.userFilter, status: "PENDING" },
      }),
      // Jadwal hari ini (PENDING + CONFIRMED)
      prisma.booking.count({
        where: {
          ...scope.userFilter,
          date: { gte: todayStart, lte: todayEnd },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      }),
      // Selesai minggu ini
      prisma.booking.count({
        where: {
          ...scope.userFilter,
          status: "COMPLETED",
          updatedAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      // Layanan aktif
      prisma.serviceType.count({
        where: { ...scope.userFilter, isActive: true },
      }),
    ]);

  return { pendingCount, todayCount, completedThisWeek, activeServices };
}

// ============================================================
// getTodayBookings — Booking hari ini untuk dashboard (RBAC)
// ============================================================

export async function getTodayBookings(): Promise<BookingWithService[]> {
  const scope = await getDataScope();
  if (!scope) throw new Error("Unauthorized");

  const now = new Date();

  return prisma.booking.findMany({
    where: {
      ...scope.userFilter,
      date: { gte: startOfDay(now), lte: endOfDay(now) },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: {
      id: true,
      status: true,
      date: true,
      startTime: true,
      endTime: true,
      patientName: true,
      patientPhone: true,
      patientNotes: true,
      cancelReason: true,
      createdAt: true,
      serviceType: {
        select: { name: true, duration: true, color: true },
      },
      user: {
        select: { name: true },
      },
    },
    orderBy: { startTime: "asc" },
  }) as Promise<BookingWithService[]>;
}
