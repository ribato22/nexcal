/**
 * ============================================================
 * NexCal — RBAC Utility (Role-Based Access Control)
 * ============================================================
 * Centralized helper for all admin actions.
 * Determines data scope based on the user's role:
 *   OWNER → sees all data in their organization
 *   STAFF → sees only their own data
 * ============================================================
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface RBACContext {
  userId: string;
  role: "OWNER" | "STAFF";
  organizationId: string | null;
}

export interface DataScope {
  /** Use this for Prisma `where` clauses — filters by userId or org member IDs */
  userFilter: { userId: string } | { userId: { in: string[] } };
  /** The authenticated user's ID */
  currentUserId: string;
  /** The authenticated user's role */
  role: "OWNER" | "STAFF";
  /** The organization ID (null for standalone users) */
  organizationId: string | null;
}

/**
 * Get the authenticated user's RBAC context and data scope.
 * Returns null if the user is not authenticated.
 *
 * Usage in server actions:
 * ```ts
 * const scope = await getDataScope();
 * if (!scope) return { error: "Unauthorized" };
 *
 * const bookings = await prisma.booking.findMany({
 *   where: { ...scope.userFilter, status: "PENDING" },
 * });
 * ```
 */
export async function getDataScope(): Promise<DataScope | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id: userId, role, organizationId } = session.user;

  // STAFF: only sees their own data
  if (role !== "OWNER" || !organizationId) {
    return {
      userFilter: { userId },
      currentUserId: userId,
      role: role as "OWNER" | "STAFF",
      organizationId: organizationId ?? null,
    };
  }

  // OWNER: sees all organization members' data
  const orgMembers = await prisma.user.findMany({
    where: { organizationId },
    select: { id: true },
  });

  const memberIds = orgMembers.map((m) => m.id);

  return {
    userFilter: { userId: { in: memberIds } },
    currentUserId: userId,
    role: "OWNER",
    organizationId,
  };
}

/**
 * Get all staff members in the current user's organization.
 * Returns empty array for STAFF role or users without an organization.
 */
export async function getOrgMembers(): Promise<
  Array<{ id: string; name: string; email: string; role: string }>
> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const { role, organizationId } = session.user;

  if (role !== "OWNER" || !organizationId) return [];

  return prisma.user.findMany({
    where: { organizationId },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
}
