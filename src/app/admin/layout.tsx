import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "OpenSlot";

export const metadata: Metadata = {
  title: {
    default: `Dashboard — ${appName}`,
    template: `%s — ${appName} Admin`,
  },
  description: `Panel administrasi ${appName}`,
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminSidebar user={session.user} />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
