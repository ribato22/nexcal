"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hash } from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// ============================================================
// Get Staff Members (OWNER only)
// ============================================================
export async function getStaffMembers() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "OWNER") return [];

  const orgId = session.user.organizationId;
  if (!orgId) return [];

  return prisma.user.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { serviceTypes: true, bookings: true } },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

// ============================================================
// Create Staff (OWNER only)
// ============================================================

const createStaffSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter.").max(100),
  email: z.string().email("Format email tidak valid."),
  password: z.string().min(6, "Password minimal 6 karakter."),
});

export interface CreateStaffResult {
  success: boolean;
  error: string | null;
}

export async function createStaffAction(
  _prevState: CreateStaffResult,
  formData: FormData
): Promise<CreateStaffResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "OWNER") {
    return { success: false, error: "Unauthorized — hanya OWNER yang dapat menambah staf." };
  }

  const orgId = session.user.organizationId;
  if (!orgId) {
    return { success: false, error: "Anda belum terhubung ke organisasi." };
  }

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = createStaffSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Data tidak valid." };
  }

  const { name, email, password } = parsed.data;

  // Check duplicate email
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return { success: false, error: "Email sudah terdaftar." };
  }

  const hashedPassword = await hash(password, 10);

  // Get org for clinicName
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  });

  await prisma.user.create({
    data: {
      name,
      email,
      hashedPassword,
      role: "STAFF",
      organizationId: orgId,
      clinicName: org?.name || null,
    },
  });

  revalidatePath("/admin/staff");
  return { success: true, error: null };
}
