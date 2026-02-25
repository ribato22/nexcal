import { getBookings } from "@/actions/admin-bookings";
import { BookingFilters, BookingTable } from "@/components/admin/booking-table";

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string }>;
}

export default async function BookingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status || "ALL";
  const search = params.search || "";

  const bookings = await getBookings({
    status: status !== "ALL" ? status : undefined,
    search: search || undefined,
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Daftar Reservasi
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Kelola reservasi pasien yang masuk. Total:{" "}
          <span className="font-semibold text-slate-700">{bookings.length}</span> reservasi.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <BookingFilters currentStatus={status} currentSearch={search} />
      </div>

      {/* Table */}
      <BookingTable bookings={bookings} />
    </div>
  );
}
