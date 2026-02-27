"use client";

import { useActionState, useState } from "react";
import { createServiceAction } from "@/actions/service-actions";

const PRESET_COLORS = [
  "#6366f1", "#3b82f6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6",
];

export function AddServiceButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Tambah Layanan
      </button>

      {isOpen && <ServiceModal onClose={() => setIsOpen(false)} />}
    </>
  );
}

function ServiceModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createServiceAction, {
    error: null,
    success: false,
  });

  const [name, setName] = useState("");
  const [duration, setDuration] = useState(30);
  const [bufferTime, setBufferTime] = useState(0);
  const [price, setPrice] = useState(0);
  const [dpPercentage, setDpPercentage] = useState(0);
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");

  // Close modal on success
  if (state.success) {
    setTimeout(() => onClose(), 300);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Tambah Layanan Baru
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Feedback */}
        {state.error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
            ❌ {state.error}
          </div>
        )}
        {state.success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
            ✅ Layanan berhasil ditambahkan!
          </div>
        )}

        {/* Form */}
        <form
          action={(formData) => {
            formData.set(
              "payload",
              JSON.stringify({ name, duration, bufferTime, price, dpPercentage, description, color })
            );
            formAction(formData);
          }}
          className="space-y-4"
        >
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nama Layanan *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Konsultasi Umum"
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Duration + Buffer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Durasi (menit) *
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={5}
                max={480}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Jeda (menit)
              </label>
              <input
                type="number"
                value={bufferTime}
                onChange={(e) => setBufferTime(Number(e.target.value))}
                min={0}
                max={60}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Price + DP */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Harga (Rp)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min={0}
                step={1000}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                DP (%)
              </label>
              <input
                type="number"
                value={dpPercentage}
                onChange={(e) => setDpPercentage(Number(e.target.value))}
                min={0}
                max={100}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Deskripsi
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Deskripsi singkat layanan..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Color */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Warna
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    color === c ? "scale-125 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="ml-2 h-7 w-7 cursor-pointer rounded border-0"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending || !name}
            className="w-full rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {isPending ? "Menyimpan..." : "💾 Simpan Layanan"}
          </button>
        </form>
      </div>
    </div>
  );
}
