"use client";

import { useState, useActionState } from "react";
import { createStaffAction, type CreateStaffResult } from "@/actions/staff";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  _count: { serviceTypes: number; bookings: number };
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${
        role === "OWNER"
          ? "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
          : "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
      }`}
    >
      {role === "OWNER" ? "👑 Owner" : "👤 Staff"}
    </span>
  );
}

function AddStaffModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createStaffAction, {
    success: false,
    error: null,
  } as CreateStaffResult);

  if (state.success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
          <div className="py-4 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Staf Berhasil Ditambahkan!</h3>
            <p className="mt-1 text-sm text-slate-500">Staf baru dapat login dengan email dan password yang telah dibuat.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Tambah Staf Baru
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {state.error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
            ⚠️ {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="staff-name" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nama Lengkap *
            </label>
            <input
              id="staff-name"
              name="name"
              type="text"
              required
              placeholder="Contoh: Dr. Ahmad"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="staff-email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email Login *
            </label>
            <input
              id="staff-email"
              name="email"
              type="email"
              required
              placeholder="staf@klinik.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="staff-password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password *
            </label>
            <input
              id="staff-password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl disabled:opacity-60"
            >
              {isPending ? "Menyimpan..." : "Tambah Staf"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function StaffPageClient({ members }: { members: StaffMember[] }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Tim Staf
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola anggota tim organisasi Anda. Total:{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">{members.length}</span> anggota.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Staf
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <div
            key={m.id}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Color accent */}
            <div
              className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl ${
                m.role === "OWNER"
                  ? "bg-linear-to-r from-purple-500 to-pink-500"
                  : "bg-linear-to-r from-blue-500 to-cyan-500"
              }`}
            />

            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  m.role === "OWNER"
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                }`}
              >
                {m.name
                  .split(" ")
                  .map((w: string) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {m.name}
                </h3>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {m.email}
                </p>
                <div className="mt-2">
                  <RoleBadge role={m.role} />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                </svg>
                {m._count.serviceTypes} layanan
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                {m._count.bookings} booking
              </span>
              <span className="ml-auto text-[10px]">
                Sejak {format(new Date(m.createdAt), "MMM yyyy", { locale: idLocale })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && <AddStaffModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
