"use client";

import { useActionState } from "react";
import { createDateOverrideAction, deleteDateOverrideAction } from "@/actions/date-override";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface Override {
  id: string;
  date: Date;
  isBlocked: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export function DateOverrideManager({
  overrides,
}: {
  overrides: Override[];
}) {
  const [state, formAction, isPending] = useActionState(
    createDateOverrideAction,
    { error: null, success: false }
  );

  return (
    <div>
      {/* Form Tambah Override */}
      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="date" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Tanggal
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="reason" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Keterangan
            </label>
            <input
              id="reason"
              name="reason"
              type="text"
              placeholder="Contoh: Hari Raya Idul Fitri"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="radio" name="isBlocked" value="true" defaultChecked className="text-blue-600" />
            Tutup (Libur penuh)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="radio" name="isBlocked" value="false" className="text-blue-600" />
            Jam Khusus
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startTime" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Jam Mulai (jika jam khusus)
            </label>
            <input
              id="startTime"
              name="startTime"
              type="time"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="endTime" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Jam Selesai (jika jam khusus)
            </label>
            <input
              id="endTime"
              name="endTime"
              type="time"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {state.error && (
          <p className="text-sm text-red-600 dark:text-red-400">❌ {state.error}</p>
        )}
        {state.success && (
          <p className="text-sm text-green-600 dark:text-green-400">✅ Override berhasil disimpan!</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          {isPending ? "Menyimpan..." : "+ Tambah Override"}
        </button>
      </form>

      {/* Daftar Override */}
      {overrides.length > 0 && (
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Override Terdaftar
          </h4>
          {overrides.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                    o.isBlocked
                      ? "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                      : "bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                  }`}
                >
                  {o.isBlocked ? "🚫" : "⏰"}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {format(new Date(o.date), "EEEE, d MMMM yyyy", { locale: idLocale })}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {o.isBlocked
                      ? "Libur penuh"
                      : `Jam khusus: ${o.startTime} — ${o.endTime}`}
                    {o.reason && ` · ${o.reason}`}
                  </p>
                </div>
              </div>
              <form action={deleteDateOverrideAction.bind(null, o.id)}>
                <button
                  type="submit"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
