import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStaffMembers } from "@/actions/staff";
import { StaffPageClient } from "@/components/admin/staff-page-client";

export default async function StaffPage() {
  const session = await auth();

  // RBAC: Only OWNER can access staff management
  if (!session?.user?.id || session.user.role !== "OWNER") {
    redirect("/admin/dashboard");
  }

  const members = await getStaffMembers();

  return <StaffPageClient members={members} />;
}
