"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/** Get current Google Calendar connection status */
export async function getGCalStatus(): Promise<{
  connected: boolean;
  configured: boolean;
}> {
  const session = await auth();
  if (!session?.user?.id) return { connected: false, configured: false };

  const configured = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { googleRefreshToken: true },
  });

  return {
    connected: !!user?.googleRefreshToken,
    configured,
  };
}

/** Disconnect Google Calendar (remove tokens) */
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
