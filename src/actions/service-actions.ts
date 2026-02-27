"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getDataScope } from "@/lib/rbac";

// ============================================================
// Schemas
// ============================================================

const createServiceSchema = z.object({
  name: z.string().min(2, "Nama layanan minimal 2 karakter."),
  duration: z.number().min(5, "Durasi minimal 5 menit.").max(480, "Durasi maksimal 480 menit."),
  bufferTime: z.number().min(0).max(60).default(0),
  price: z.number().min(0).default(0),
  dpPercentage: z.number().min(0).max(100).default(0),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna harus format hex (#RRGGBB).").optional(),
});

// ============================================================
// Server Actions
// ============================================================

/**
 * Membuat layanan baru.
 * STAFF: membuat layanan untuk dirinya sendiri.
 * OWNER: juga membuat layanan untuk dirinya sendiri.
 */
export async function createServiceAction(
  _prevState: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  try {
    const scope = await getDataScope();
    if (!scope) {
      return { error: "Unauthorized", success: false };
    }

    const raw = formData.get("payload") as string;
    const parsed = createServiceSchema.safeParse(JSON.parse(raw));

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { error: firstError?.message || "Data layanan tidak valid.", success: false };
    }

    const { name, duration, bufferTime, price, dpPercentage, description, color } = parsed.data;

    await prisma.serviceType.create({
      data: {
        name,
        duration,
        bufferTime,
        price,
        dpPercentage,
        description: description || null,
        color: color || null,
        userId: scope.currentUserId,
      },
    });

    revalidatePath("/admin/services");
    return { error: null, success: true };
  } catch {
    return { error: "Gagal membuat layanan. Silakan coba lagi.", success: false };
  }
}
