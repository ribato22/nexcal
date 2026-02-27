import { prisma } from "@/lib/prisma";
import { getDataScope } from "@/lib/rbac";
import { auth } from "@/lib/auth";
import { AddServiceButton } from "@/components/admin/service-form";

interface ServiceWithProvider {
  id: string;
  name: string;
  duration: number;
  bufferTime: number;
  description: string | null;
  isActive: boolean;
  color: string | null;
  user?: { name: string };
}

export default async function ServicesPage() {
  const [scope, session] = await Promise.all([getDataScope(), auth()]);
  if (!scope) return null;

  const isOwner = session?.user?.role === "OWNER";

  const services: ServiceWithProvider[] = await prisma.serviceType.findMany({
    where: scope.userFilter,
    select: {
      id: true,
      name: true,
      duration: true,
      bufferTime: true,
      description: true,
      isActive: true,
      color: true,
      ...(isOwner ? { user: { select: { name: true } } } : {}),
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Jenis Layanan
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola layanan yang tersedia beserta durasi konsultasi/tindakan.
          </p>
        </div>
        <AddServiceButton />
      </div>

      {/* Services Grid */}
      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 dark:border-slate-800">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
            </svg>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">Belum ada layanan</p>
          <p className="mt-1 text-xs text-slate-500">Jalankan `npm run db:seed` untuk membuat data demo.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} isOwner={isOwner} />
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceCard({
  service,
  isOwner,
}: {
  service: ServiceWithProvider;
  isOwner: boolean;
}) {
  const durasiLabel = service.duration >= 60
    ? `${Math.floor(service.duration / 60)} jam${service.duration % 60 > 0 ? ` ${service.duration % 60} menit` : ""}`
    : `${service.duration} menit`;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      {/* Color accent */}
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
        style={{ backgroundColor: service.color || "#6366f1" }}
      />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {service.name}
            </h3>
          </div>

          {service.description && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
              {service.description}
            </p>
          )}

          <div className="mt-4 flex items-center gap-3">
            {/* Duration badge */}
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {durasiLabel}
            </span>

            {/* Buffer time badge */}
            {service.bufferTime > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                </svg>
                Jeda {service.bufferTime} mnt
              </span>
            )}

            {/* Status badge */}
            <span
              className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${
                service.isActive
                  ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                  : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
              }`}
            >
              {service.isActive ? "Aktif" : "Nonaktif"}
            </span>

            {/* Provider badge (OWNER only) */}
            {isOwner && service.user?.name && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                {service.user.name}
              </span>
            )}
          </div>
        </div>

        {/* Color indicator */}
        <div
          className="h-4 w-4 shrink-0 rounded-full ring-2 ring-white shadow-sm dark:ring-slate-900"
          style={{ backgroundColor: service.color || "#6366f1" }}
        />
      </div>
    </div>
  );
}
