"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ============================================================
// Schemas
// ============================================================

const createOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isBlocked: z.boolean(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  reason: z.string().max(200).optional(),
});

// ============================================================
// Server Actions
// ============================================================

/**
 * Membuat date override (libur/cuti/jam khusus).
 */
export async function createDateOverrideAction(
  _prevState: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const isBlocked = formData.get("isBlocked") === "true";

    const parsed = createOverrideSchema.safeParse({
      date: formData.get("date"),
      isBlocked,
      startTime: isBlocked ? null : formData.get("startTime"),
      endTime: isBlocked ? null : formData.get("endTime"),
      reason: formData.get("reason") || undefined,
    });

    if (!parsed.success) {
      return { error: "Data tidak valid. Periksa kembali input Anda.", success: false };
    }

    const { date, startTime, endTime, reason } = parsed.data;

    // Validasi jam jika bukan blocked
    if (!isBlocked && startTime && endTime && startTime >= endTime) {
      return {
        error: "Jam selesai harus setelah jam mulai.",
        success: false,
      };
    }

    // Cek duplikasi tanggal
    const existing = await prisma.dateOverride.findFirst({
      where: {
        userId: session.user.id,
        date: new Date(date),
      },
    });

    if (existing) {
      // Update existing
      await prisma.dateOverride.update({
        where: { id: existing.id },
        data: {
          isBlocked,
          startTime,
          endTime,
          reason,
        },
      });
    } else {
      await prisma.dateOverride.create({
        data: {
          userId: session.user.id,
          date: new Date(date),
          isBlocked,
          startTime,
          endTime,
          reason,
        },
      });
    }

    revalidatePath("/admin/schedule");
    return { error: null, success: true };
  } catch {
    return { error: "Gagal menyimpan override. Silakan coba lagi.", success: false };
  }
}

/**
 * Menghapus date override.
 */
export async function deleteDateOverrideAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.dateOverride.delete({
    where: { id, userId: session.user.id },
  });

  revalidatePath("/admin/schedule");
}

/**
 * Mengambil semua date overrides.
 */
export async function getDateOverrides() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.dateOverride.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "asc" },
  });
}
