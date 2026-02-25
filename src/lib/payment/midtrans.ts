/**
 * NexCal — Midtrans Payment Plugin
 *
 * Implementasi PaymentProvider untuk Midtrans Snap API.
 * Menggunakan Snap API (server-to-server) untuk membuat transaksi
 * dan mengembalikan token + redirect URL.
 *
 * Referensi: https://docs.midtrans.com/reference/create-transaction-token
 */

import type {
  PaymentProvider,
  CreateTransactionInput,
  CreateTransactionResult,
} from "./core";

// ============================================================
// Config
// ============================================================

function getMidtransConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY belum diatur di environment variables.");
  }

  const baseUrl = isProduction
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";

  return { serverKey, clientKey, isProduction, baseUrl };
}

// ============================================================
// Provider
// ============================================================

export class MidtransProvider implements PaymentProvider {
  readonly name = "MIDTRANS";

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
      const config = getMidtransConfig();

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
      const config = getMidtransConfig();
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
