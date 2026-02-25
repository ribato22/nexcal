"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getDataScope } from "@/lib/rbac";

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
 * Always self-scoped — both OWNER and STAFF create overrides for themselves.
 */
export async function createDateOverrideAction(
  _prevState: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  try {
    const scope = await getDataScope();
    if (!scope) {
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

    // Cek duplikasi tanggal (always self-scoped)
    const existing = await prisma.dateOverride.findFirst({
      where: {
        userId: scope.currentUserId,
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
          userId: scope.currentUserId,
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
 * Self-scoped: user can only delete their own overrides.
 */
export async function deleteDateOverrideAction(id: string) {
  const scope = await getDataScope();
  if (!scope) return;

  await prisma.dateOverride.delete({
    where: { id, userId: scope.currentUserId },
  });

  revalidatePath("/admin/schedule");
}

/**
 * Mengambil semua date overrides.
 * OWNER: sees all org overrides. STAFF: sees own only.
 */
export async function getDateOverrides() {
  const scope = await getDataScope();
  if (!scope) return [];

  return prisma.dateOverride.findMany({
    where: scope.userFilter,
    orderBy: { date: "asc" },
  });
}
