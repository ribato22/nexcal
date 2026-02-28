"use client";

import { useActionState, useState, useTransition } from "react";
import { createServiceAction, updateServiceAction, deleteServiceAction } from "@/actions/service-actions";

const PRESET_COLORS = [
  "#6366f1", "#3b82f6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6",
];

// ============================================================
// Add Service Button (top-level)
// ============================================================

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

// ============================================================
// Service Card Actions (⋯ menu with Edit + Delete)
// ============================================================

interface ServiceData {
  id: string;
  name: string;
  duration: number;
  bufferTime: number;
  price: number;
  dpPercentage: number;
  description: string | null;
  isActive: boolean;
  isVirtual: boolean;
  color: string | null;
}

export function ServiceCardActions({ service }: { service: ServiceData }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
        </svg>
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-8 z-40 min-w-[140px] rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => { setMenuOpen(false); setEditOpen(true); }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => { setMenuOpen(false); setDeleteOpen(true); }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              Hapus
            </button>
          </div>
        </>
      )}

      {editOpen && <ServiceModal onClose={() => setEditOpen(false)} editData={service} />}
      {deleteOpen && <DeleteServiceDialog service={service} onClose={() => setDeleteOpen(false)} />}
    </div>
  );
}

// ============================================================
// Delete Confirmation Dialog
// ============================================================

function DeleteServiceDialog({ service, onClose }: { service: ServiceData; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteServiceAction(service.id);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hapus Layanan?</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Apakah Anda yakin ingin menghapus layanan <strong>{service.name}</strong>?
          {" "}Jika layanan ini memiliki booking, maka akan dinonaktifkan alih-alih dihapus permanen.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isPending ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Service Modal (Create / Edit)
// ============================================================

function ServiceModal({ onClose, editData }: { onClose: () => void; editData?: ServiceData }) {
  const isEdit = !!editData;
  const action = isEdit ? updateServiceAction : createServiceAction;

  const [state, formAction, isPending] = useActionState(action, {
    error: null,
    success: false,
  });

  const [name, setName] = useState(editData?.name || "");
  const [duration, setDuration] = useState(editData?.duration || 30);
  const [bufferTime, setBufferTime] = useState(editData?.bufferTime || 0);
  const [price, setPrice] = useState(editData?.price || 0);
  const [dpPercentage, setDpPercentage] = useState(editData?.dpPercentage || 0);
  const [description, setDescription] = useState(editData?.description || "");
  const [color, setColor] = useState(editData?.color || "#6366f1");
  const [isVirtual, setIsVirtual] = useState(editData?.isVirtual || false);

  if (state.success) {
    setTimeout(() => onClose(), 300);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEdit ? "Edit Layanan" : "Tambah Layanan Baru"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
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
            ✅ {isEdit ? "Layanan berhasil diperbarui!" : "Layanan berhasil ditambahkan!"}
          </div>
        )}

        <form
          action={(formData) => {
            const payload: Record<string, unknown> = { name, duration, bufferTime, price, dpPercentage, description, color, isVirtual };
            if (isEdit && editData) payload.id = editData.id;
            formData.set("payload", JSON.stringify(payload));
            formAction(formData);
          }}
          className="space-y-4"
        >
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Nama Layanan *</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Konsultasi Umum" required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Duration + Buffer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Durasi (menit) *</label>
              <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                min={5} max={480}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Jeda (menit)</label>
              <input type="number" value={bufferTime} onChange={(e) => setBufferTime(Number(e.target.value))}
                min={0} max={60}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Price + DP */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Harga (Rp)</label>
              <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))}
                min={0} step={1000}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">DP (%)</label>
              <input type="number" value={dpPercentage} onChange={(e) => setDpPercentage(Number(e.target.value))}
                min={0} max={100}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Deskripsi</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} placeholder="Deskripsi singkat layanan..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Virtual Consultation Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                🎥 Konsultasi Online
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Otomatis buat link Google Meet saat booking dikonfirmasi
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsVirtual(!isVirtual)}
              className={`relative h-6 w-11 rounded-full transition-colors ${isVirtual ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${isVirtual ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          {/* Color */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Warna</label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900" : "hover:scale-110"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="ml-2 h-7 w-7 cursor-pointer rounded border-0"
              />
            </div>
          </div>

          <button type="submit" disabled={isPending || !name}
            className="w-full rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {isPending ? "Menyimpan..." : isEdit ? "💾 Perbarui Layanan" : "💾 Simpan Layanan"}
          </button>
        </form>
      </div>
    </div>
  );
}
