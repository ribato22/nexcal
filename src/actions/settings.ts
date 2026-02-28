"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ============================================================
// Get Organization Settings
// ============================================================

export async function getOrgSettings() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "OWNER") return null;

  const orgId = session.user.organizationId;
  if (!orgId) return null;

  return prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      multiwaUrl: true,
      multiwaApiKey: true,
      multiwaSessionId: true,
      gcalClientId: true,
      gcalClientSecret: true,
      midtransServerKey: true,
      midtransClientKey: true,
      midtransIsProd: true,
    },
  });
}

// ============================================================
// Save MultiWA Settings
// ============================================================

const multiwaSchema = z.object({
  multiwaUrl: z.string().url("URL tidak valid").or(z.literal("")),
  multiwaApiKey: z.string(),
  multiwaSessionId: z.string(),
});

export async function saveMultiwaSettings(
  _prevState: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "OWNER") {
      return { error: "Unauthorized", success: false };
    }

    const orgId = session.user.organizationId;
    if (!orgId) return { error: "Organisasi tidak ditemukan.", success: false };

    const raw = {
      multiwaUrl: (formData.get("multiwaUrl") as string) || "",
      multiwaApiKey: (formData.get("multiwaApiKey") as string) || "",
      multiwaSessionId: (formData.get("multiwaSessionId") as string) || "",
    };

    const parsed = multiwaSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Data tidak valid.", success: false };
    }

    await prisma.organization.update({
      where: { id: orgId },
      data: {
        multiwaUrl: parsed.data.multiwaUrl || null,
        multiwaApiKey: parsed.data.multiwaApiKey || null,
        multiwaSessionId: parsed.data.multiwaSessionId || null,
      },
    });

    revalidatePath("/admin/settings");
    return { error: null, success: true };
  } catch {
    return { error: "Gagal menyimpan pengaturan MultiWA.", success: false };
  }
}

// ============================================================
// Save GCal Settings
// ============================================================

const gcalSchema = z.object({
  gcalClientId: z.string(),
  gcalClientSecret: z.string(),
});

export async function saveGcalSettings(
  _prevState: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "OWNER") {
      return { error: "Unauthorized", success: false };
    }

    const orgId = session.user.organizationId;
    if (!orgId) return { error: "Organisasi tidak ditemukan.", success: false };

    const raw = {
      gcalClientId: (formData.get("gcalClientId") as string) || "",
      gcalClientSecret: (formData.get("gcalClientSecret") as string) || "",
    };

    const parsed = gcalSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Data tidak valid.", success: false };
    }

    await prisma.organization.update({
      where: { id: orgId },
      data: {
        gcalClientId: parsed.data.gcalClientId || null,
        gcalClientSecret: parsed.data.gcalClientSecret || null,
      },
    });

    revalidatePath("/admin/settings");
    return { error: null, success: true };
  } catch {
    return { error: "Gagal menyimpan pengaturan Google Calendar.", success: false };
  }
}

// ============================================================
// Save Midtrans Settings
// ============================================================

const midtransSchema = z.object({
  midtransServerKey: z.string(),
  midtransClientKey: z.string(),
  midtransIsProd: z.boolean(),
});

export async function saveMidtransSettings(
  _prevState: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "OWNER") {
      return { error: "Unauthorized", success: false };
    }

    const orgId = session.user.organizationId;
    if (!orgId) return { error: "Organisasi tidak ditemukan.", success: false };

    const raw = {
      midtransServerKey: (formData.get("midtransServerKey") as string) || "",
      midtransClientKey: (formData.get("midtransClientKey") as string) || "",
      midtransIsProd: formData.get("midtransIsProd") === "true",
    };

    const parsed = midtransSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Data tidak valid.", success: false };
    }

    await prisma.organization.update({
      where: { id: orgId },
      data: {
        midtransServerKey: parsed.data.midtransServerKey || null,
        midtransClientKey: parsed.data.midtransClientKey || null,
        midtransIsProd: parsed.data.midtransIsProd,
      },
    });

    revalidatePath("/admin/settings");
    return { error: null, success: true };
  } catch {
    return { error: "Gagal menyimpan pengaturan Midtrans.", success: false };
  }
}
