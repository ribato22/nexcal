/**
 * NexCal — Payment Provider Interface & Factory
 *
 * Gateway-agnostic architecture. Setiap payment gateway (Midtrans, Xendit,
 * Stripe, dll) mengimplementasikan interface `PaymentProvider`.
 * Factory `getPaymentProvider()` mengembalikan instance yang tepat
 * berdasarkan nama gateway.
 *
 * Config diambil dari database (Organization) per-tenant, dengan
 * fallback ke environment variables.
 */

import { prisma } from "@/lib/prisma";

// ============================================================
// Interface
// ============================================================

/**
 * Data yang dibutuhkan untuk membuat transaksi pembayaran.
 */
export interface CreateTransactionInput {
  /** ID booking (digunakan sebagai order_id di gateway) */
  bookingId: string;
  /** Jumlah yang harus dibayar (Rupiah integer, bukan float) */
  amount: number;
  /** Nama pelanggan */
  customerName: string;
  /** Nomor telepon pelanggan */
  customerPhone: string;
  /** Nama layanan (untuk deskripsi item di gateway) */
  serviceName: string;
  /** Nama klinik/bisnis (untuk branding di halaman pembayaran) */
  merchantName?: string;
}

/**
 * Hasil dari pembuatan transaksi.
 */
export interface CreateTransactionResult {
  /** Berhasil atau tidak */
  success: boolean;
  /** Token/Order ID dari gateway (untuk tracking) */
  paymentRefId?: string;
  /** URL redirect ke halaman pembayaran gateway */
  paymentUrl?: string;
  /** Pesan error jika gagal */
  error?: string;
}

/**
 * Interface standard yang harus diimplementasikan oleh setiap payment plugin.
 */
export interface PaymentProvider {
  /** Nama gateway (e.g., 'MIDTRANS', 'XENDIT') */
  readonly name: string;

  /**
   * Membuat transaksi pembayaran baru di gateway.
   * Mengembalikan token dan URL redirect untuk pelanggan.
   */
  createTransaction(
    input: CreateTransactionInput
  ): Promise<CreateTransactionResult>;

  /**
   * Memverifikasi status pembayaran berdasarkan paymentRefId.
   * Digunakan oleh webhook handler atau polling.
   */
  verifyTransaction(paymentRefId: string): Promise<{
    status: "PAID" | "PENDING" | "FAILED" | "EXPIRED";
    raw?: Record<string, unknown>;
  }>;
}

// ============================================================
// Factory
// ============================================================

/**
 * Mendapatkan instance PaymentProvider berdasarkan nama gateway.
 * Gateway yang didukung: MIDTRANS (lebih banyak segera hadir).
 *
 * @param gatewayName — Nama gateway (default: env DEFAULT_PAYMENT_GATEWAY)
 * @throws Error jika gateway tidak didukung
 */
export function getPaymentProvider(
  organizationId?: string | null,
  gatewayName?: string
): PaymentProvider {
  const name = (
    gatewayName || process.env.DEFAULT_PAYMENT_GATEWAY || "MIDTRANS"
  ).toUpperCase();

  switch (name) {
    case "MIDTRANS": {
      // Lazy import untuk menghindari loading module yang tidak dipakai
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { MidtransProvider } = require("./midtrans");
      return new MidtransProvider(organizationId);
    }

    // Future plugins:
    // case "XENDIT":
    //   const { XenditProvider } = require("./xendit");
    //   return new XenditProvider(organizationId);

    default:
      throw new Error(
        `Payment gateway "${name}" tidak didukung. ` +
        `Atur gateway di Pengaturan → Payment Gateway (didukung: MIDTRANS).`
      );
  }
}

/**
 * Cek apakah payment gateway sudah dikonfigurasi.
 * Berguna untuk menentukan apakah fitur pembayaran diaktifkan.
 */
export async function isPaymentEnabled(organizationId?: string | null): Promise<boolean> {
  // Check DB config first
  if (organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { midtransServerKey: true },
    });
    if (org?.midtransServerKey) return true;
  }
  // Fallback to env
  const gateway = process.env.DEFAULT_PAYMENT_GATEWAY;
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  return (!!gateway && gateway.trim().length > 0) || !!serverKey;
}

/**
 * Menghitung jumlah yang harus dibayar berdasarkan harga dan persentase DP.
 *
 * @param price - Harga layanan (Rupiah)
 * @param dpPercentage - Persentase DP (0-100). 0 = bayar penuh.
 * @returns Jumlah yang harus dibayar
 */
export function calculatePaymentAmount(
  price: number,
  dpPercentage: number
): number {
  if (price <= 0) return 0;
  if (dpPercentage <= 0 || dpPercentage >= 100) return price;
  return Math.ceil((price * dpPercentage) / 100);
}
