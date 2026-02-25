import "dotenv/config";
import { PrismaClient, Role, BookingStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Memulai seeding database...\n");

  // ============================================================
  // 1. Buat User Admin (Bidan Sari)
  // ============================================================
  const hashedPassword = await hash("REDACTED_SEED_PASSWORD", 12);

  const bidanSari = await prisma.user.upsert({
    where: { email: "bidan.sari@kliniku.com" },
    update: {},
    create: {
      email: "bidan.sari@kliniku.com",
      hashedPassword,
      name: "Bidan Sari, Amd.Keb",
      role: Role.PROVIDER,
      clinicName: "Praktik Mandiri Bidan Sari",
      clinicAddress: "Jl. Kesehatan No. 42, Batam",
      phone: "08123456789",
    },
  });

  console.log(`✅ User dibuat: ${bidanSari.name} (${bidanSari.email})`);
  console.log(`   Password: REDACTED_SEED_PASSWORD\n`);

  // ============================================================
  // 2. Buat Jenis Layanan (ServiceType)
  // ============================================================
  const services = [
    {
      name: "Pemeriksaan Kehamilan (ANC)",
      duration: 30,
      description:
        "Pemeriksaan rutin kehamilan meliputi tekanan darah, berat badan, tinggi fundus, dan detak jantung janin.",
      color: "#EC4899", // Pink
    },
    {
      name: "Imunisasi Bayi & Anak",
      duration: 15,
      description:
        "Pemberian vaksinasi sesuai jadwal imunisasi nasional (BCG, DPT, Polio, Campak, dll).",
      color: "#3B82F6", // Blue
    },
    {
      name: "Konsultasi KB",
      duration: 20,
      description:
        "Konsultasi dan pemasangan alat kontrasepsi (Pil, Suntik, Implan, IUD).",
      color: "#10B981", // Green
    },
    {
      name: "Pemeriksaan Nifas",
      duration: 30,
      description:
        "Pemeriksaan pasca persalinan meliputi involusi uterus, luka perineum, dan laktasi.",
      color: "#F59E0B", // Amber
    },
    {
      name: "Tindakan Persalinan Normal",
      duration: 120,
      description:
        "Pertolongan persalinan normal di klinik. Slot waktu akan diblokir selama 2 jam.",
      color: "#EF4444", // Red
    },
  ];

  for (const service of services) {
    await prisma.serviceType.upsert({
      where: {
        id: `seed-service-${service.name.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}`,
      },
      update: {},
      create: {
        id: `seed-service-${service.name.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}`,
        name: service.name,
        duration: service.duration,
        description: service.description,
        color: service.color,
        isActive: true,
        userId: bidanSari.id,
      },
    });
  }

  console.log(`✅ ${services.length} jenis layanan dibuat`);

  // ============================================================
  // 3. Buat Jadwal Operasional Mingguan (Schedule)
  // ============================================================
  // Senin-Jumat: 08:00-12:00 (Pagi) & 13:00-16:00 (Sore)
  // Sabtu: 08:00-12:00 (Pagi saja)
  // Minggu: Libur
  const dayNames = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];

  const schedules: { dayOfWeek: number; startTime: string; endTime: string }[] =
    [];

  // Senin-Jumat (1-5): Pagi & Sore
  for (let day = 1; day <= 5; day++) {
    schedules.push(
      { dayOfWeek: day, startTime: "08:00", endTime: "12:00" },
      { dayOfWeek: day, startTime: "13:00", endTime: "16:00" }
    );
  }

  // Sabtu (6): Pagi saja
  schedules.push({ dayOfWeek: 6, startTime: "08:00", endTime: "12:00" });

  for (const schedule of schedules) {
    await prisma.schedule.upsert({
      where: {
        userId_dayOfWeek_startTime: {
          userId: bidanSari.id,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
        },
      },
      update: {},
      create: {
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isActive: true,
        userId: bidanSari.id,
      },
    });
  }

  console.log(`✅ ${schedules.length} jadwal sesi dibuat:`);
  for (const s of schedules) {
    console.log(
      `   ${dayNames[s.dayOfWeek]}: ${s.startTime} - ${s.endTime}`
    );
  }

  // ============================================================
  // 4. Buat DateOverride contoh (Libur Nasional)
  // ============================================================
  const overrides = [
    {
      date: new Date("2026-03-28"), // Sabtu — contoh libur khusus
      isBlocked: true,
      reason: "Isra Mi'raj Nabi Muhammad SAW",
    },
    {
      date: new Date("2026-04-03"), // Jumat — Wafat Isa Al-Masih
      isBlocked: true,
      reason: "Wafat Isa Al-Masih",
    },
  ];

  for (const override of overrides) {
    await prisma.dateOverride.upsert({
      where: {
        userId_date: {
          userId: bidanSari.id,
          date: override.date,
        },
      },
      update: {},
      create: {
        date: override.date,
        isBlocked: override.isBlocked,
        reason: override.reason,
        userId: bidanSari.id,
      },
    });
  }

  console.log(`\n✅ ${overrides.length} tanggal libur dibuat:`);
  for (const o of overrides) {
    console.log(`   ${o.date.toISOString().slice(0, 10)}: ${o.reason}`);
  }

  // ============================================================
  // 5. Buat Booking contoh
  // ============================================================
  // Buat booking untuk hari Senin depan sebagai demo
  const now = new Date();
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));

  const sampleBookings = [
    {
      patientName: "Ibu Ratna Dewi",
      patientPhone: "081234567001",
      patientNotes: "Kehamilan trimester 3, kontrol rutin bulanan.",
      startHour: 8,
      startMinute: 0,
      serviceIndex: 0, // ANC 30 menit
    },
    {
      patientName: "Ibu Fitri Handayani",
      patientPhone: "081234567002",
      patientNotes: "Imunisasi DPT anak usia 4 bulan.",
      startHour: 8,
      startMinute: 30,
      serviceIndex: 1, // Imunisasi 15 menit
    },
    {
      patientName: "Ibu Siti Aminah",
      patientPhone: "081234567003",
      patientNotes: "Konsultasi ganti metode KB dari suntik ke implan.",
      startHour: 9,
      startMinute: 0,
      serviceIndex: 2, // Konsultasi KB 20 menit
    },
  ];

  const serviceIds = services.map(
    (s) =>
      `seed-service-${s.name.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}`
  );

  for (const booking of sampleBookings) {
    const bookingDate = new Date(nextMonday);
    bookingDate.setHours(0, 0, 0, 0);

    const startTime = new Date(nextMonday);
    startTime.setHours(booking.startHour, booking.startMinute, 0, 0);

    const serviceDuration = services[booking.serviceIndex].duration;
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + serviceDuration);

    await prisma.booking.upsert({
      where: {
        userId_startTime: {
          userId: bidanSari.id,
          startTime: startTime,
        },
      },
      update: {},
      create: {
        date: bookingDate,
        startTime: startTime,
        endTime: endTime,
        patientName: booking.patientName,
        patientPhone: booking.patientPhone,
        patientNotes: booking.patientNotes,
        status: BookingStatus.CONFIRMED,
        userId: bidanSari.id,
        serviceTypeId: serviceIds[booking.serviceIndex],
      },
    });
  }

  console.log(`\n✅ ${sampleBookings.length} booking contoh dibuat untuk Senin ${nextMonday.toISOString().slice(0, 10)}:`);
  for (const b of sampleBookings) {
    const hour = b.startHour.toString().padStart(2, "0");
    const minute = b.startMinute.toString().padStart(2, "0");
    console.log(
      `   ${hour}:${minute} — ${b.patientName} (${services[b.serviceIndex].name})`
    );
  }

  console.log("\n🎉 Seeding selesai! Database siap digunakan.");
  console.log("━".repeat(50));
  console.log("📧 Login admin: bidan.sari@kliniku.com");
  console.log("🔑 Password:    REDACTED_SEED_PASSWORD");
  console.log("━".repeat(50));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding gagal:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
