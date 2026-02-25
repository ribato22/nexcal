"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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
 * Menghapus semua jadwal lama dan mengganti dengan yang baru.
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

    // Transaction: hapus lama, masukkan baru
    await prisma.$transaction([
      prisma.schedule.deleteMany({
        where: { userId: session.user.id },
      }),
      ...sessions.map((s) =>
        prisma.schedule.create({
          data: {
            userId: session.user.id,
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
 */
export async function getSchedules() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.schedule.findMany({
    where: { userId: session.user.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}
