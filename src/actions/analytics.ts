"use server";

/**
 * NexCal v2.4 — Analytics & Business Intelligence Actions
 *
 * Fungsi agregasi data untuk dashboard analytics.
 * Semua fungsi mematuhi RBAC via getDataScope():
 *   OWNER → melihat seluruh organisasi
 *   STAFF → hanya data milik sendiri
 */

import { prisma } from "@/lib/prisma";
import { getDataScope } from "@/lib/rbac";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfDay,
  endOfDay,
  subDays,
  format,
} from "date-fns";

// ============================================================
// Types
// ============================================================

export interface RevenueStats {
  currentMonth: number;   // Pendapatan bulan ini (PAID only)
  previousMonth: number;  // Pendapatan bulan lalu
  growthPercent: number;   // Pertumbuhan (%)
  paidCount: number;       // Jumlah booking PAID bulan ini
  unpaidCount: number;     // Jumlah booking UNPAID bulan ini
}

export interface BookingSummaryStats {
  totalCompleted: number;
  totalCancelled: number;
  totalNoShow: number;
  cancellationRate: number; // Persentase pembatalan
}

export interface TopService {
  serviceId: string;
  serviceName: string;
  serviceColor: string | null;
  bookingCount: number;
  revenue: number;
}

export interface ProviderPerformance {
  userId: string;
  userName: string;
  bookingCount: number;
  completedCount: number;
  revenue: number;
}

export interface DailyTrend {
  date: string;       // Format: yyyy-MM-dd
  label: string;      // Format: dd MMM
  bookings: number;
  revenue: number;
}

export interface AnalyticsDashboard {
  revenue: RevenueStats;
  bookingSummary: BookingSummaryStats;
  topServices: TopService[];
  providerPerformance: ProviderPerformance[];
  dailyTrend: DailyTrend[];
  isOwner: boolean;
}

// ============================================================
// Main Analytics Function
// ============================================================

export async function getAnalytics(): Promise<AnalyticsDashboard> {
  const scope = await getDataScope();
  if (!scope) throw new Error("Unauthorized");

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  // 30-day window for trend
  const trendStart = startOfDay(subDays(now, 29));
  const trendEnd = endOfDay(now);

  const baseFilter = scope.userFilter;

  // Parallel queries for maximum performance
  const [
    currentMonthPaid,
    prevMonthPaid,
    unpaidThisMonth,
    completedAll,
    cancelledAll,
    noShowAll,
    topServicesRaw,
    trendBookings,
    providerBookings,
  ] = await Promise.all([
    // Revenue: bulan ini (PAID + non-cancelled/no-show)
    prisma.booking.aggregate({
      where: {
        ...baseFilter,
        paymentStatus: "PAID",
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
        date: { gte: currentMonthStart, lte: currentMonthEnd },
      },
      _sum: { totalPrice: true },
      _count: true,
    }),

    // Revenue: bulan lalu (PAID + non-cancelled/no-show)
    prisma.booking.aggregate({
      where: {
        ...baseFilter,
        paymentStatus: "PAID",
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
        date: { gte: prevMonthStart, lte: prevMonthEnd },
      },
      _sum: { totalPrice: true },
    }),

    // UNPAID this month
    prisma.booking.count({
      where: {
        ...baseFilter,
        paymentStatus: "UNPAID",
        totalPrice: { gt: 0 },
        date: { gte: currentMonthStart, lte: currentMonthEnd },
      },
    }),

    // Completed all-time
    prisma.booking.count({
      where: { ...baseFilter, status: "COMPLETED" },
    }),

    // Cancelled all-time
    prisma.booking.count({
      where: { ...baseFilter, status: "CANCELLED" },
    }),

    // No-show all-time
    prisma.booking.count({
      where: { ...baseFilter, status: "NO_SHOW" },
    }),

    // Top services: booking count + revenue (bulan ini, exclude CANCELLED/NO_SHOW)
    prisma.booking.groupBy({
      by: ["serviceTypeId"],
      where: {
        ...baseFilter,
        date: { gte: currentMonthStart, lte: currentMonthEnd },
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
      },
      _count: true,
      _sum: { totalPrice: true },
      orderBy: { _count: { serviceTypeId: "desc" } },
      take: 5,
    }),

    // 30-day trend: all bookings
    prisma.booking.findMany({
      where: {
        ...baseFilter,
        date: { gte: trendStart, lte: trendEnd },
        status: { notIn: ["CANCELLED"] },
      },
      select: {
        date: true,
        totalPrice: true,
        paymentStatus: true,
      },
    }),

    // Provider performance (Owner only, exclude CANCELLED/NO_SHOW)
    prisma.booking.groupBy({
      by: ["userId"],
      where: {
        ...baseFilter,
        date: { gte: currentMonthStart, lte: currentMonthEnd },
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
      },
      _count: true,
      _sum: { totalPrice: true },
    }),
  ]);

  // ---------- Process Revenue ----------
  const currentRevenue = currentMonthPaid._sum.totalPrice || 0;
  const previousRevenue = prevMonthPaid._sum.totalPrice || 0;
  const growthPercent = previousRevenue > 0
    ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
    : currentRevenue > 0 ? 100 : 0;

  // ---------- Process Top Services (enrich with names) ----------
  const serviceIds = topServicesRaw.map((s: { serviceTypeId: string }) => s.serviceTypeId);
  const serviceDetails = await prisma.serviceType.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, name: true, color: true },
  });
  const serviceMap = new Map(serviceDetails.map((s: { id: string; name: string; color: string | null }) => [s.id, s]));

  const topServices: TopService[] = topServicesRaw.map((s: { serviceTypeId: string; _count: number; _sum: { totalPrice: number | null } }) => {
    const detail = serviceMap.get(s.serviceTypeId) as { id: string; name: string; color: string | null } | undefined;
    return {
      serviceId: s.serviceTypeId,
      serviceName: detail?.name || "Unknown",
      serviceColor: detail?.color || null,
      bookingCount: s._count,
      revenue: s._sum.totalPrice || 0,
    };
  });

  // ---------- Process Provider Performance ----------
  const userIds = providerBookings.map((p: { userId: string }) => p.userId);
  const userDetails = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const userMap = new Map(userDetails.map((u: { id: string; name: string }) => [u.id, u]));

  // Also need completed counts per provider
  const completedByProvider = await prisma.booking.groupBy({
    by: ["userId"],
    where: {
      ...baseFilter,
      date: { gte: currentMonthStart, lte: currentMonthEnd },
      status: "COMPLETED",
    },
    _count: true,
  });
  const completedMap = new Map(completedByProvider.map((c: { userId: string; _count: number }) => [c.userId, c._count]));

  const providerPerformance: ProviderPerformance[] = providerBookings
    .map((p: { userId: string; _count: number; _sum: { totalPrice: number | null } }) => {
      const user = userMap.get(p.userId) as { id: string; name: string } | undefined;
      return {
        userId: p.userId,
        userName: user?.name || "Unknown",
        bookingCount: p._count,
        completedCount: completedMap.get(p.userId) || 0,
        revenue: p._sum.totalPrice || 0,
      };
    })
    .sort((a: ProviderPerformance, b: ProviderPerformance) => b.revenue - a.revenue);

  // ---------- Process Daily Trend ----------
  // Use local date components (getFullYear/getMonth/getDate) to avoid
  // UTC vs local timezone mismatch that causes key collisions.
  function toLocalDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const trendMap = new Map<string, { bookings: number; revenue: number }>();
  for (let i = 0; i < 30; i++) {
    const d = subDays(now, 29 - i);
    const key = toLocalDateKey(d);
    trendMap.set(key, { bookings: 0, revenue: 0 });
  }

  let matchedCount = 0;
  for (const b of trendBookings) {
    const bDate = new Date(b.date);
    const key = toLocalDateKey(bDate);
    const entry = trendMap.get(key);
    if (entry) {
      entry.bookings += 1;
      matchedCount++;
      if (b.paymentStatus === "PAID") {
        entry.revenue += b.totalPrice;
      }
    }
  }

  // Debug: log trend data to terminal
  console.log(`[Analytics] Trend: ${trendBookings.length} bookings queried, ${matchedCount} matched to 30-day window`);
  if (trendBookings.length > 0 && matchedCount === 0) {
    const sample = trendBookings[0];
    const sampleDate = new Date(sample.date);
    console.log(`[Analytics] Sample booking date raw:`, sample.date);
    console.log(`[Analytics] Sample as Date:`, sampleDate.toString());
    console.log(`[Analytics] Sample local key:`, toLocalDateKey(sampleDate));
    console.log(`[Analytics] TrendMap keys (first 5):`, [...trendMap.keys()].slice(0, 5));
  }

  const dailyTrend: DailyTrend[] = Array.from(trendMap.entries()).map(
    ([dateStr, data]) => ({
      date: dateStr,
      label: format(new Date(dateStr + "T12:00:00"), "dd MMM"),
      bookings: data.bookings,
      revenue: data.revenue,
    })
  );

  // ---------- Booking Summary ----------
  const totalFinished = completedAll + cancelledAll + noShowAll;
  const cancellationRate = totalFinished > 0
    ? Math.round(((cancelledAll + noShowAll) / totalFinished) * 100)
    : 0;

  return {
    revenue: {
      currentMonth: currentRevenue,
      previousMonth: previousRevenue,
      growthPercent,
      paidCount: currentMonthPaid._count,
      unpaidCount: unpaidThisMonth,
    },
    bookingSummary: {
      totalCompleted: completedAll,
      totalCancelled: cancelledAll,
      totalNoShow: noShowAll,
      cancellationRate,
    },
    topServices,
    providerPerformance,
    dailyTrend,
    isOwner: scope.role === "OWNER",
  };
}
