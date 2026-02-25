"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getDataScope } from "@/lib/rbac";

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
 * STAFF: selalu menyimpan jadwal sendiri.
 * OWNER: juga menyimpan jadwal sendiri (bukan seluruh org).
 */
export async function saveScheduleAction(
  _prevState: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  try {
    const scope = await getDataScope();
    if (!scope) {
      return { error: "Unauthorized", success: false };
    }

    const raw = formData.get("sessions") as string;
    const parsed = bulkScheduleSchema.safeParse(JSON.parse(raw));

    if (!parsed.success) {
      return { error: "Data jadwal tidak valid.", success: false };
    }

    const { sessions } = parsed.data;

    // Validasi: endTime harus setelah startTime
    for (const session of sessions) {
      if (session.startTime >= session.endTime) {
        return {
          error: `Jam selesai harus setelah jam mulai (${session.startTime} - ${session.endTime}).`,
          success: false,
        };
      }
    }

    // Transaction: hapus lama, masukkan baru (always self-scoped)
    await prisma.$transaction([
      prisma.schedule.deleteMany({
        where: { userId: scope.currentUserId },
      }),
      ...sessions.map((s) =>
        prisma.schedule.create({
          data: {
            userId: scope.currentUserId,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
          },
        })
      ),
    ]);

    revalidatePath("/admin/schedule");
    return { error: null, success: true };
  } catch {
    return { error: "Gagal menyimpan jadwal. Silakan coba lagi.", success: false };
  }
}

/**
 * Mengambil semua jadwal operasional.
 * OWNER: sees all org schedules.
 * STAFF: sees own schedules only.
 */
export async function getSchedules() {
  const scope = await getDataScope();
  if (!scope) return [];

  return prisma.schedule.findMany({
    where: scope.userFilter,
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}
