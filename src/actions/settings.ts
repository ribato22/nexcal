"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { calendarFeedUrl } from "@/lib/calendar-feed-download";
import { getCalendarBusyPeriods } from "@/lib/calendar-feed";

export async function saveCalendarFeed(
  _prevState: { error: string | null; success: boolean },
  formData: FormData,
): Promise<{ error: string | null; success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Silakan masuk kembali.", success: false };

  const value = formData.get("calendarFeedUrl");
  const remove = formData.get("remove") === "true";
  let url: string | null = null;
  if (!remove) {
    try {
      if (typeof value !== "string" || value.length > 2048) throw new Error("Invalid URL");
      url = calendarFeedUrl(value).href;
    } catch {
      return { error: "Masukkan tautan ICS publik dengan HTTPS atau webcal://.", success: false };
    }
    try {
      await getCalendarBusyPeriods(url, new Date(), 0, true);
    } catch {
      return { error: "Tautan ICS tidak dapat dibaca. Periksa tautan dan pengaturan publikasi kalender.", success: false };
    }
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { calendarFeedUrl: url },
    });
  } catch {
    return { error: "Gagal menyimpan kalender eksternal.", success: false };
  }
  revalidatePath("/admin/settings");
  return { error: null, success: true };
}

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
