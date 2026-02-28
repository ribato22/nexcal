"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Get current Google Calendar connection status for the logged-in user.
 * Checks if GCal is configured at the org level (DB) or via env vars,
 * and whether the user has connected their personal Gmail.
 */
export async function getGCalStatus(): Promise<{
  connected: boolean;
  configured: boolean;
}> {
  const session = await auth();
  if (!session?.user?.id) return { connected: false, configured: false };

  // Check if GCal is configured: org DB first, then env vars
  let configured = false;
  const orgId = session.user.organizationId;

  if (orgId) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { gcalClientId: true, gcalClientSecret: true },
    });
    configured = !!(org?.gcalClientId && org?.gcalClientSecret);
  }

  if (!configured) {
    configured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  }

  // Check if THIS user has connected their personal Gmail
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { googleRefreshToken: true },
  });

  return {
    connected: !!user?.googleRefreshToken,
    configured,
  };
}

/** Disconnect Google Calendar (remove tokens for current user) */
export async function disconnectGCal(): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
    },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}
