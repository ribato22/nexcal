"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth";

// ============================================================
// Schemas
// ============================================================

const scheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const bulkScheduleSchema = z.object({
  sessions: z.array(scheduleSchema),
});

// ============================================================
// Server Actions
// ============================================================

/**
 * Menyimpan jadwal operasional mingguan secara bulk.
 * Strategy: DELETE ALL current user's schedules first, then INSERT new ones.
 * Uses interactive transaction to guarantee atomicity.
 * 
 * IMPORTANT: Always operates on the CURRENT USER's schedules only,
 * regardless of role (OWNER or STAFF). Each user manages their own schedule.
 */
export async function saveScheduleAction(
  _prevState: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const userId = session.user.id;

    const raw = formData.get("sessions") as string;
    const parsed = bulkScheduleSchema.safeParse(JSON.parse(raw));

    if (!parsed.success) {
      return { error: "Data jadwal tidak valid.", success: false };
    }

    const { sessions } = parsed.data;

    // Validasi: endTime harus setelah startTime
    for (const s of sessions) {
      if (s.startTime >= s.endTime) {
        return {
          error: `Jam selesai harus setelah jam mulai (${s.startTime} - ${s.endTime}).`,
          success: false,
        };
      }
    }

    // Interactive transaction: guaranteed sequential execution
    await prisma.$transaction(async (tx) => {
      // Step 1: DELETE all existing schedules for THIS user
      await tx.schedule.deleteMany({
        where: { userId },
      });

      // Step 2: INSERT new schedules (only if there are any)
      if (sessions.length > 0) {
        await tx.schedule.createMany({
          data: sessions.map((s) => ({
            userId,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        });
      }
    });

    revalidatePath("/admin/schedule");
    return { error: null, success: true };
  } catch {
    return { error: "Gagal menyimpan jadwal. Silakan coba lagi.", success: false };
  }
}

/**
 * Mengambil jadwal operasional MILIK USER YANG SEDANG LOGIN SAJA.
 * OWNER maupun STAFF hanya melihat jadwalnya sendiri di editor ini.
 * (Untuk OWNER yang ingin melihat jadwal seluruh staf, buat halaman terpisah.)
 */
export async function getSchedules() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.schedule.findMany({
    where: { userId: session.user.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}
