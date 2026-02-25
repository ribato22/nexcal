"use client";

import { useActionState, useState } from "react";
import { saveScheduleAction } from "@/actions/schedule";

const DAY_LABELS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

interface Session {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export function ScheduleEditor({
  initialSessions,
}: {
  initialSessions: Session[];
}) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [state, formAction, isPending] = useActionState(saveScheduleAction, {
    error: null,
    success: false,
  });

  function addSession(dayOfWeek: number) {
    setSessions((prev) => [
      ...prev,
      { dayOfWeek, startTime: "08:00", endTime: "12:00" },
    ]);
  }

  function removeSession(dayOfWeek: number, index: number) {
    setSessions((prev) => {
      const daySessions = prev.filter((s) => s.dayOfWeek === dayOfWeek);
      const otherSessions = prev.filter((s) => s.dayOfWeek !== dayOfWeek);
      daySessions.splice(index, 1);
      return [...otherSessions, ...daySessions];
    });
  }

  function updateSession(
    dayOfWeek: number,
    index: number,
    field: "startTime" | "endTime",
    value: string
  ) {
    setSessions((prev) => {
      const newSessions = [...prev];
      let dayIndex = 0;
      for (let i = 0; i < newSessions.length; i++) {
        if (newSessions[i].dayOfWeek === dayOfWeek) {
          if (dayIndex === index) {
            newSessions[i] = { ...newSessions[i], [field]: value };
            break;
          }
          dayIndex++;
        }
      }
      return newSessions;
    });
  }

  return (
    <div>
      {/* Success/Error */}
      {state.success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
          ✅ Jadwal berhasil disimpan!
        </div>
      )}
      {state.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          ❌ {state.error}
        </div>
      )}

      <form
        action={(formData) => {
          formData.set("sessions", JSON.stringify({ sessions }));
          formAction(formData);
        }}
      >
        <div className="space-y-3">
          {DAY_LABELS.map((label, dayOfWeek) => {
            const daySessions = sessions.filter(
              (s) => s.dayOfWeek === dayOfWeek
            );
            const isActive = daySessions.length > 0;

            return (
              <div
                key={dayOfWeek}
                className={`rounded-xl border p-4 transition-all ${
                  isActive
                    ? "border-blue-200 bg-blue-50/30 dark:border-blue-800/50 dark:bg-blue-950/10"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                        isActive
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                          : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                      }`}
                    >
                      {label.substring(0, 2)}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        isActive
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {label}
                    </span>
                    {!isActive && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        (Libur)
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => addSession(dayOfWeek)}
                    className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-blue-100 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Sesi
                  </button>
                </div>

                {daySessions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {daySessions.map((session, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="time"
                          value={session.startTime}
                          onChange={(e) =>
                            updateSession(dayOfWeek, idx, "startTime", e.target.value)
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                        <span className="text-xs text-slate-400">→</span>
                        <input
                          type="time"
                          value={session.endTime}
                          onChange={(e) =>
                            updateSession(dayOfWeek, idx, "endTime", e.target.value)
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeSession(dayOfWeek, idx)}
                          className="ml-1 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-6 w-full rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {isPending ? "Menyimpan..." : "💾 Simpan Jadwal"}
        </button>
      </form>
    </div>
  );
}
