/**
 * NexCal — Midtrans Payment Plugin
 *
 * Implementasi PaymentProvider untuk Midtrans Snap API.
 * Konfigurasi diambil SECARA DINAMIS dari tabel Organization di database,
 * BUKAN dari environment variables — sesuai prinsip SaaS B2B.
 *
 * Fallback: jika config DB kosong, cek env vars sebagai backup.
 *
 * Referensi: https://docs.midtrans.com/reference/create-transaction-token
 */

import type {
  PaymentProvider,
  CreateTransactionInput,
  CreateTransactionResult,
} from "./core";
import { prisma } from "@/lib/prisma";

// ============================================================
// Config — DB-first, env fallback
// ============================================================

interface MidtransConfig {
  serverKey: string;
  clientKey: string | null;
  isProduction: boolean;
  baseUrl: string;
}

async function getMidtransConfig(organizationId?: string | null): Promise<MidtransConfig | null> {
  // 1. Try DB config first
  if (organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        midtransServerKey: true,
        midtransClientKey: true,
        midtransIsProd: true,
      },
    });

    if (org?.midtransServerKey) {
      const isProduction = org.midtransIsProd;
      return {
        serverKey: org.midtransServerKey,
        clientKey: org.midtransClientKey,
        isProduction,
        baseUrl: isProduction
          ? "https://app.midtrans.com"
          : "https://app.sandbox.midtrans.com",
      };
    }
  }

  // 2. Fallback to env vars
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return null; // No config anywhere → payment not available

  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  return {
    serverKey,
    clientKey: process.env.MIDTRANS_CLIENT_KEY || null,
    isProduction,
    baseUrl: isProduction
      ? "https://app.midtrans.com"
      : "https://app.sandbox.midtrans.com",
  };
}

// ============================================================
// Provider
// ============================================================

export class MidtransProvider implements PaymentProvider {
  readonly name = "MIDTRANS";

  private organizationId?: string | null;

  constructor(organizationId?: string | null) {
    this.organizationId = organizationId;
  }

  /**
   * Membuat transaksi Snap dan mengembalikan token + redirect URL.
   *
   * Endpoint: POST /snap/v1/transactions
   * Auth: Basic (server_key:)
   */
  async createTransaction(
    input: CreateTransactionInput
  ): Promise<CreateTransactionResult> {
    try {
      const config = await getMidtransConfig(this.organizationId);
      if (!config) {
        console.warn("[Midtrans] Tidak ada konfigurasi Midtrans — payment dilewati.");
        return {
          success: false,
          error: "Payment gateway belum dikonfigurasi. Atur di Pengaturan → Payment Gateway.",
        };
      }

      const payload = {
        transaction_details: {
          order_id: `NEXCAL-${input.bookingId}`,
          gross_amount: input.amount,
        },
        item_details: [
          {
            id: input.bookingId,
            price: input.amount,
            quantity: 1,
            name: input.serviceName.substring(0, 50), // Midtrans limit
          },
        ],
        customer_details: {
          first_name: input.customerName.substring(0, 20),
          phone: input.customerPhone,
        },
        callbacks: {
          finish: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/booking/payment-status?order_id=NEXCAL-${input.bookingId}`,
        },
      };

      // Basic Auth: base64(serverKey + ":")
      const authString = Buffer.from(`${config.serverKey}:`).toString("base64");

      const response = await fetch(`${config.baseUrl}/snap/v1/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("[Midtrans] Snap API error:", response.status, errorBody);
        return {
          success: false,
          error: `Midtrans error: ${response.status} — ${errorBody}`,
        };
      }

      const data = (await response.json()) as {
        token: string;
        redirect_url: string;
      };

      return {
        success: true,
        paymentRefId: data.token,
        paymentUrl: data.redirect_url,
      };
    } catch (err) {
      console.error("[Midtrans] createTransaction failed:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown Midtrans error",
      };
    }
  }

  /**
   * Verifikasi status transaksi via Midtrans Status API.
   *
   * Endpoint: GET /v2/{order_id}/status
   */
  async verifyTransaction(paymentRefId: string): Promise<{
    status: "PAID" | "PENDING" | "FAILED" | "EXPIRED";
    raw?: Record<string, unknown>;
  }> {
    try {
      const config = await getMidtransConfig(this.organizationId);
      if (!config) return { status: "FAILED" };

      const authString = Buffer.from(`${config.serverKey}:`).toString("base64");

      // Midtrans Status API uses the base API URL, not Snap
      const apiBase = config.isProduction
        ? "https://api.midtrans.com"
        : "https://api.sandbox.midtrans.com";

      const response = await fetch(
        `${apiBase}/v2/${paymentRefId}/status`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Basic ${authString}`,
          },
        }
      );

      if (!response.ok) {
        return { status: "FAILED" };
      }

      const data = (await response.json()) as Record<string, unknown>;
      const txStatus = data.transaction_status as string;

      // Map Midtrans statuses → our enum
      switch (txStatus) {
        case "capture":
        case "settlement":
          return { status: "PAID", raw: data };
        case "pending":
          return { status: "PENDING", raw: data };
        case "expire":
          return { status: "EXPIRED", raw: data };
        case "deny":
        case "cancel":
        default:
          return { status: "FAILED", raw: data };
      }
    } catch (err) {
      console.error("[Midtrans] verifyTransaction failed:", err);
      return { status: "FAILED" };
    }
  }
}
