import "dotenv/config";
import { PrismaClient } from "@prisma/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding NexCal v2.0 (Multi-Provider)...\n");

  // ============================================================
  // 1. Organization
  // ============================================================
  const org = await prisma.organization.upsert({
    where: { slug: "klinik-sehat-utama" },
    update: {},
    create: {
      name: "Klinik Sehat Utama",
      slug: "klinik-sehat-utama",
    },
  });
  console.log(`✅ Organization: ${org.name} (${org.slug})`);

  // ============================================================
  // 2. Users: 1 OWNER + 2 STAFF
  // ============================================================
  const hashedPassword = await hash("REDACTED_SEED_PASSWORD", 12);

  const owner = await prisma.user.upsert({
    where: { email: "admin@kliniku.com" },
    update: {},
    create: {
      email: "admin@kliniku.com",
      hashedPassword,
      name: "Admin Utama",
      role: "OWNER",
      clinicName: "Klinik Sehat Utama",
      clinicAddress: "Jl. Kesehatan No. 1, Batam",
      phone: "08121234567",
      organizationId: org.id,
    },
  });
  console.log(`✅ OWNER: ${owner.name} (${owner.email})`);

  const drBudi = await prisma.user.upsert({
    where: { email: "dr.budi@kliniku.com" },
    update: {},
    create: {
      email: "dr.budi@kliniku.com",
      hashedPassword,
      name: "Dr. Budi Santoso",
      role: "STAFF",
      clinicName: "Klinik Sehat Utama",
      phone: "08129876543",
      organizationId: org.id,
    },
  });
  console.log(`✅ STAFF: ${drBudi.name} (${drBudi.email})`);

  const bidanSari = await prisma.user.upsert({
    where: { email: "bidan.sari@kliniku.com" },
    update: {},
    create: {
      email: "bidan.sari@kliniku.com",
      hashedPassword,
      name: "Bidan Sari Dewi",
      role: "STAFF",
      clinicName: "Klinik Sehat Utama",
      phone: "08131234567",
      organizationId: org.id,
    },
  });
  console.log(`✅ STAFF: ${bidanSari.name} (${bidanSari.email})`);

  // ============================================================
  // 3. Services — Different per Staff
  // ============================================================

  // Dr. Budi's services
  const konsultasiUmum = await prisma.serviceType.upsert({
    where: { id: "svc-konsultasi-umum" },
    update: {},
    create: {
      id: "svc-konsultasi-umum",
      name: "Konsultasi Umum",
      duration: 30,
      bufferTime: 10,
      price: 75000,
      dpPercentage: 0,
      description: "Pemeriksaan dan konsultasi kesehatan umum.",
      color: "#3B82F6",
      userId: drBudi.id,
    },
  });

  const medicalCheckup = await prisma.serviceType.upsert({
    where: { id: "svc-medical-checkup" },
    update: {},
    create: {
      id: "svc-medical-checkup",
      name: "Medical Check-up",
      duration: 60,
      bufferTime: 15,
      price: 350000,
      dpPercentage: 50,
      description: "Pemeriksaan kesehatan menyeluruh dengan laporan hasil.",
      color: "#8B5CF6",
      userId: drBudi.id,
    },
  });

  console.log(`✅ Dr. Budi services: ${konsultasiUmum.name}, ${medicalCheckup.name}`);

  // Bidan Sari's services
  const pemeriksaanKehamilan = await prisma.serviceType.upsert({
    where: { id: "svc-kehamilan" },
    update: {},
    create: {
      id: "svc-kehamilan",
      name: "Pemeriksaan Kehamilan",
      duration: 30,
      bufferTime: 10,
      price: 150000,
      dpPercentage: 0,
      description: "Pemeriksaan rutin kehamilan (ANC) termasuk USG dasar.",
      color: "#EC4899",
      userId: bidanSari.id,
    },
  });

  const imunisasi = await prisma.serviceType.upsert({
    where: { id: "svc-imunisasi" },
    update: {},
    create: {
      id: "svc-imunisasi",
      name: "Imunisasi Anak",
      duration: 15,
      bufferTime: 5,
      price: 0,
      dpPercentage: 0,
      description: "Imunisasi dasar dan lanjutan untuk bayi dan balita.",
      color: "#10B981",
      userId: bidanSari.id,
    },
  });

  const konsultasiLaktasi = await prisma.serviceType.upsert({
    where: { id: "svc-laktasi" },
    update: {},
    create: {
      id: "svc-laktasi",
      name: "Konsultasi Laktasi",
      duration: 45,
      bufferTime: 10,
      price: 100000,
      dpPercentage: 0,
      description: "Konsultasi menyusui dan manajemen ASI.",
      color: "#F59E0B",
      userId: bidanSari.id,
    },
  });

  console.log(
    `✅ Bidan Sari services: ${pemeriksaanKehamilan.name}, ${imunisasi.name}, ${konsultasiLaktasi.name}`
  );

  // ============================================================
  // 4. Schedules — Different per Staff
  // ============================================================

  // Dr. Budi: Senin-Jumat, 08:00-12:00 (Pagi) & 14:00-17:00 (Sore)
  const budiSchedules = [
    { dayOfWeek: 1, startTime: "08:00", endTime: "12:00" },
    { dayOfWeek: 1, startTime: "14:00", endTime: "17:00" },
    { dayOfWeek: 2, startTime: "08:00", endTime: "12:00" },
    { dayOfWeek: 2, startTime: "14:00", endTime: "17:00" },
    { dayOfWeek: 3, startTime: "08:00", endTime: "12:00" },
    { dayOfWeek: 3, startTime: "14:00", endTime: "17:00" },
    { dayOfWeek: 4, startTime: "08:00", endTime: "12:00" },
    { dayOfWeek: 4, startTime: "14:00", endTime: "17:00" },
    { dayOfWeek: 5, startTime: "08:00", endTime: "12:00" },
    { dayOfWeek: 5, startTime: "14:00", endTime: "17:00" },
  ];

  // Clear existing schedules for Dr. Budi
  await prisma.schedule.deleteMany({ where: { userId: drBudi.id } });
  for (const s of budiSchedules) {
    await prisma.schedule.create({
      data: { userId: drBudi.id, ...s },
    });
  }
  console.log(`✅ Dr. Budi schedules: Senin-Jumat (Pagi + Sore)`);

  // Bidan Sari: Senin-Sabtu, 09:00-15:00
  const sariSchedules = [
    { dayOfWeek: 1, startTime: "09:00", endTime: "15:00" },
    { dayOfWeek: 2, startTime: "09:00", endTime: "15:00" },
    { dayOfWeek: 3, startTime: "09:00", endTime: "15:00" },
    { dayOfWeek: 4, startTime: "09:00", endTime: "15:00" },
    { dayOfWeek: 5, startTime: "09:00", endTime: "15:00" },
    { dayOfWeek: 6, startTime: "09:00", endTime: "13:00" }, // Sabtu setengah hari
  ];

  await prisma.schedule.deleteMany({ where: { userId: bidanSari.id } });
  for (const s of sariSchedules) {
    await prisma.schedule.create({
      data: { userId: bidanSari.id, ...s },
    });
  }
  console.log(`✅ Bidan Sari schedules: Senin-Sabtu (09:00-15:00/13:00)`);

  // ============================================================
  // 5. Sample Bookings
  // ============================================================
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Dr. Budi — 2 bookings for tomorrow
  const budiBooking1Start = new Date(tomorrow);
  budiBooking1Start.setHours(9, 0, 0, 0);
  const budiBooking1End = new Date(tomorrow);
  budiBooking1End.setHours(9, 30, 0, 0);

  await prisma.booking.upsert({
    where: { id: "bk-budi-001" },
    update: {},
    create: {
      id: "bk-budi-001",
      userId: drBudi.id,
      serviceTypeId: konsultasiUmum.id,
      date: tomorrow,
      startTime: budiBooking1Start,
      endTime: budiBooking1End,
      patientName: "Ahmad Fauzi",
      patientPhone: "081234567890",
      patientNotes: "Keluhan batuk berkepanjangan",
      status: "CONFIRMED",
    },
  });

  const budiBooking2Start = new Date(tomorrow);
  budiBooking2Start.setHours(10, 0, 0, 0);
  const budiBooking2End = new Date(tomorrow);
  budiBooking2End.setHours(11, 0, 0, 0);

  await prisma.booking.upsert({
    where: { id: "bk-budi-002" },
    update: {},
    create: {
      id: "bk-budi-002",
      userId: drBudi.id,
      serviceTypeId: medicalCheckup.id,
      date: tomorrow,
      startTime: budiBooking2Start,
      endTime: budiBooking2End,
      patientName: "Rina Handayani",
      patientPhone: "082345678901",
      status: "PENDING",
    },
  });

  console.log(`✅ Dr. Budi bookings: 2 (1 CONFIRMED, 1 PENDING)`);

  // Bidan Sari — 2 bookings for tomorrow
  const sariBooking1Start = new Date(tomorrow);
  sariBooking1Start.setHours(9, 0, 0, 0);
  const sariBooking1End = new Date(tomorrow);
  sariBooking1End.setHours(9, 30, 0, 0);

  await prisma.booking.upsert({
    where: { id: "bk-sari-001" },
    update: {},
    create: {
      id: "bk-sari-001",
      userId: bidanSari.id,
      serviceTypeId: pemeriksaanKehamilan.id,
      date: tomorrow,
      startTime: sariBooking1Start,
      endTime: sariBooking1End,
      patientName: "Dewi Lestari",
      patientPhone: "083456789012",
      patientNotes: "Kehamilan 7 bulan, pemeriksaan rutin",
      status: "CONFIRMED",
    },
  });

  const sariBooking2Start = new Date(tomorrow);
  sariBooking2Start.setHours(10, 0, 0, 0);
  const sariBooking2End = new Date(tomorrow);
  sariBooking2End.setHours(10, 15, 0, 0);

  await prisma.booking.upsert({
    where: { id: "bk-sari-002" },
    update: {},
    create: {
      id: "bk-sari-002",
      userId: bidanSari.id,
      serviceTypeId: imunisasi.id,
      date: tomorrow,
      startTime: sariBooking2Start,
      endTime: sariBooking2End,
      patientName: "Putri Rahayu",
      patientPhone: "084567890123",
      patientNotes: "Imunisasi DPT lanjutan untuk bayi usia 6 bulan",
      status: "PENDING",
    },
  });

  console.log(`✅ Bidan Sari bookings: 2 (1 CONFIRMED, 1 PENDING)`);

  // ============================================================
  // Done
  // ============================================================
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 Seed complete! Login credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("OWNER:  admin@kliniku.com       / REDACTED_SEED_PASSWORD");
  console.log("STAFF:  dr.budi@kliniku.com     / REDACTED_SEED_PASSWORD");
  console.log("STAFF:  bidan.sari@kliniku.com  / REDACTED_SEED_PASSWORD");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
