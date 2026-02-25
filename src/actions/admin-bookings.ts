"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, format } from "date-fns";
import { notifyBookingConfirmed, notifyBookingCancelled } from "@/lib/whatsapp";
import { pushBookingToCalendar } from "@/lib/gcal";

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
}

// ============================================================
// getBookings — Ambil daftar reservasi dengan filter
// ============================================================

export async function getBookings(
  filters?: BookingFilters
): Promise<BookingWithService[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const where: Record<string, unknown> = {
    userId: session.user.id,
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
        select: {
          name: true,
          duration: true,
          color: true,
        },
      },
    },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
  }) as Promise<BookingWithService[]>;
}

// ============================================================
// updateBookingStatus — Ubah status reservasi
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
    const session = await auth();
    if (!session?.user?.id) {
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

    // Ambil booking + layanan + pemilik
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId: session.user.id },
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
        userId: session.user.id,
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
// getDashboardStats — Statistik dashboard real-time
// ============================================================

export interface DashboardStats {
  pendingCount: number;
  todayCount: number;
  completedThisWeek: number;
  activeServices: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Senin
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [pendingCount, todayCount, completedThisWeek, activeServices] =
    await Promise.all([
      // Reservasi PENDING
      prisma.booking.count({
        where: { userId, status: "PENDING" },
      }),
      // Jadwal hari ini (PENDING + CONFIRMED)
      prisma.booking.count({
        where: {
          userId,
          date: { gte: todayStart, lte: todayEnd },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      }),
      // Selesai minggu ini
      prisma.booking.count({
        where: {
          userId,
          status: "COMPLETED",
          updatedAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      // Layanan aktif
      prisma.serviceType.count({
        where: { userId, isActive: true },
      }),
    ]);

  return { pendingCount, todayCount, completedThisWeek, activeServices };
}

// ============================================================
// getTodayBookings — Booking hari ini untuk dashboard
// ============================================================

export async function getTodayBookings(): Promise<BookingWithService[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const now = new Date();

  return prisma.booking.findMany({
    where: {
      userId: session.user.id,
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
    },
    orderBy: { startTime: "asc" },
  }) as Promise<BookingWithService[]>;
}
