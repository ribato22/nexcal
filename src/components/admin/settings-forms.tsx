"use client";

import { useActionState } from "react";
import { saveMultiwaSettings, saveGcalSettings, saveMidtransSettings } from "@/actions/settings";

// ============================================================
// Feedback Banner
// ============================================================

function Feedback({ state }: { state: { error: string | null; success: boolean } }) {
  if (state.success) {
    return (
      <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
        ✅ Pengaturan berhasil disimpan!
      </div>
    );
  }
  if (state.error) {
    return (
      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
        ❌ {state.error}
      </div>
    );
  }
  return null;
}

// ============================================================
// MultiWA Settings Form
// ============================================================

interface MultiwaData {
  multiwaUrl: string | null;
  multiwaApiKey: string | null;
  multiwaSessionId: string | null;
}

export function MultiwaSettingsForm({ data }: { data: MultiwaData }) {
  const [state, formAction, isPending] = useActionState(saveMultiwaSettings, {
    error: null,
    success: false,
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950/50">
          <svg className="h-5 w-5 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">WhatsApp (MultiWA)</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Konfigurasi gateway notifikasi WhatsApp</p>
        </div>
      </div>

      <Feedback state={state} />

      <form action={formAction} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">API URL</label>
          <input name="multiwaUrl" type="url" defaultValue={data.multiwaUrl || ""}
            placeholder="https://wa.example.com"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">API Key</label>
          <input name="multiwaApiKey" type="password" defaultValue={data.multiwaApiKey || ""}
            placeholder="Your API Key"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Session ID</label>
          <input name="multiwaSessionId" type="text" defaultValue={data.multiwaSessionId || ""}
            placeholder="default"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <button type="submit" disabled={isPending}
          className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
        >
          {isPending ? "Menyimpan..." : "💾 Simpan Pengaturan WhatsApp"}
        </button>
      </form>
    </div>
  );
}

// ============================================================
// GCal Settings Form
// ============================================================

interface GcalData {
  gcalClientId: string | null;
  gcalClientSecret: string | null;
}

export function GcalSettingsForm({ data }: { data: GcalData }) {
  const [state, formAction, isPending] = useActionState(saveGcalSettings, {
    error: null,
    success: false,
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/50">
          <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.5 22.5H4.5C3.12 22.5 2 21.38 2 20V6C2 4.62 3.12 3.5 4.5 3.5H6V2H8V3.5H16V2H18V3.5H19.5C20.88 3.5 22 4.62 22 6V20C22 21.38 20.88 22.5 19.5 22.5ZM4.5 5.5C4.22 5.5 4 5.72 4 6V20C4 20.28 4.22 20.5 4.5 20.5H19.5C19.78 20.5 20 20.28 20 20V6C20 5.72 19.78 5.5 19.5 5.5H4.5ZM20 9.5H4V7.5H20V9.5Z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Google Calendar</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Kredensial OAuth untuk sinkronisasi kalender</p>
        </div>
      </div>

      <Feedback state={state} />

      <form action={formAction} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Client ID</label>
          <input name="gcalClientId" type="text" defaultValue={data.gcalClientId || ""}
            placeholder="xxxx.apps.googleusercontent.com"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Client Secret</label>
          <input name="gcalClientSecret" type="password" defaultValue={data.gcalClientSecret || ""}
            placeholder="GOCSPX-xxxx"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <button type="submit" disabled={isPending}
          className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isPending ? "Menyimpan..." : "💾 Simpan Pengaturan Google Calendar"}
        </button>
      </form>
    </div>
  );
}

// ============================================================
// Midtrans Settings Form
// ============================================================

interface MidtransData {
  midtransServerKey: string | null;
  midtransClientKey: string | null;
  midtransIsProd: boolean;
}

export function MidtransSettingsForm({ data }: { data: MidtransData }) {
  const [state, formAction, isPending] = useActionState(saveMidtransSettings, {
    error: null,
    success: false,
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/50">
          <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Payment Gateway (Midtrans)</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Konfigurasi pembayaran online via Midtrans Snap</p>
        </div>
      </div>

      <Feedback state={state} />

      <form action={formAction} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Server Key</label>
          <input name="midtransServerKey" type="password" defaultValue={data.midtransServerKey || ""}
            placeholder="SB-Mid-server-xxxx atau Mid-server-xxxx"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Client Key</label>
          <input name="midtransClientKey" type="password" defaultValue={data.midtransClientKey || ""}
            placeholder="SB-Mid-client-xxxx atau Mid-client-xxxx"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Mode Produksi</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {data.midtransIsProd ? "🟢 Aktif — Transaksi uang sungguhan" : "🟡 Sandbox — Mode pengujian"}
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" name="midtransIsProd" value="true" defaultChecked={data.midtransIsProd}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full dark:bg-slate-600 dark:peer-checked:bg-amber-500" />
          </label>
        </div>
        <button type="submit" disabled={isPending}
          className="w-full rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {isPending ? "Menyimpan..." : "💾 Simpan Pengaturan Midtrans"}
        </button>
      </form>
    </div>
  );
}
