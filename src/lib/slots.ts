import {
  parse,
  format,
  addMinutes,
  isBefore,
  isEqual,
  startOfDay,
  eachDayOfInterval,
  getDay,
} from "date-fns";

/**
 * Representasi satu slot waktu yang tersedia.
 */
export interface TimeSlot {
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  available: boolean;
}

/**
 * Data jadwal operasional harian.
 */
export interface ScheduleSession {
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

/**
 * Data override tanggal (libur/cuti/custom hours).
 */
export interface DateOverrideData {
  date: Date;
  isBlocked: boolean;
  startTime: string | null; // null jika blocked
  endTime: string | null;
}

/**
 * Data booking yang sudah ada (termasuk buffer layanan).
 */
export interface ExistingBooking {
  startTime: Date;
  endTime: Date;
  bufferTime?: number; // Jeda setelah booking (menit), dari ServiceType
}

/**
 * Membuat daftar slot waktu dari satu sesi jadwal.
 * Memecah rentang waktu menjadi slot dengan durasi tertentu.
 *
 * @param sessionStart - Waktu mulai sesi ("HH:mm")
 * @param sessionEnd - Waktu selesai sesi ("HH:mm")
 * @param durationMinutes - Durasi per slot dalam menit
 * @returns Array slot waktu dengan availability = true
 */
export function generateSlotsFromSession(
  sessionStart: string,
  sessionEnd: string,
  durationMinutes: number
): TimeSlot[] {
  const refDate = new Date(2000, 0, 1); // Tanggal referensi untuk parsing
  const start = parse(sessionStart, "HH:mm", refDate);
  const end = parse(sessionEnd, "HH:mm", refDate);

  const slots: TimeSlot[] = [];
  let current = start;

  while (isBefore(addMinutes(current, durationMinutes), end) || isEqual(addMinutes(current, durationMinutes), end)) {
    const slotEnd = addMinutes(current, durationMinutes);
    slots.push({
      startTime: format(current, "HH:mm"),
      endTime: format(slotEnd, "HH:mm"),
      available: true,
    });
    current = slotEnd;
  }

  return slots;
}

/**
 * Menghitung slot yang tersedia untuk satu hari tertentu.
 *
 * Logika:
 * 1. Cek apakah ada DateOverride untuk tanggal ini
 *    - Jika isBlocked=true → tidak ada slot (hari libur)
 *    - Jika ada custom hours → gunakan jam override
 * 2. Jika tidak ada override → gunakan jadwal reguler untuk hari itu
 * 3. Generate slot dari setiap sesi
 * 4. Tandai slot yang sudah di-booking sebagai unavailable
 *    ↳ Buffer time dari booking sebelumnya diperhitungkan!
 *
 * @param date - Tanggal yang ingin dicek
 * @param schedules - Jadwal operasional mingguan
 * @param overrides - Override tanggal (libur/custom)
 * @param bookings - Booking yang sudah ada (termasuk bufferTime)
 * @param durationMinutes - Durasi layanan dalam menit
 * @param bufferMinutes - Jeda setelah layanan BARU yang ingin di-booking (menit)
 * @returns Array slot dengan status ketersediaan
 */
export function getAvailableSlots(
  date: Date,
  schedules: ScheduleSession[],
  overrides: DateOverrideData[],
  bookings: ExistingBooking[],
  durationMinutes: number,
  bufferMinutes: number = 0
): TimeSlot[] {
  const targetDate = startOfDay(date);
  const dayOfWeek = getDay(date); // 0=Sunday ... 6=Saturday

  // 1. Cek DateOverride
  const override = overrides.find(
    (o) => startOfDay(o.date).getTime() === targetDate.getTime()
  );

  if (override) {
    if (override.isBlocked) {
      return []; // Hari libur / diblokir
    }
    // Custom hours
    if (override.startTime && override.endTime) {
      const slots = generateSlotsFromSession(
        override.startTime,
        override.endTime,
        durationMinutes
      );
      return markBookedSlots(slots, bookings, date, bufferMinutes);
    }
  }

  // 2. Gunakan jadwal reguler
  const daySessions = schedules.filter((s) => s.dayOfWeek === dayOfWeek);

  if (daySessions.length === 0) {
    return []; // Hari tidak beroperasi
  }

  // 3. Generate slot dari semua sesi
  const allSlots: TimeSlot[] = [];
  for (const session of daySessions) {
    const sessionSlots = generateSlotsFromSession(
      session.startTime,
      session.endTime,
      durationMinutes
    );
    allSlots.push(...sessionSlots);
  }

  // 4. Tandai slot yang sudah di-booking (dengan buffer time)
  return markBookedSlots(allSlots, bookings, date, bufferMinutes);
}

/**
 * Menandai slot yang bertabrakan dengan booking yang sudah ada.
 *
 * Buffer Time Logic:
 * - Setiap booking yang ADA memperluas "zona blokir"-nya ke depan
 *   sebesar `booking.bufferTime` menit (jeda setelah booking sebelumnya).
 * - Slot BARU yang ingin di-booking juga perlu ruang `newBufferMinutes`
 *   setelahnya, sehingga slotEnd + newBuffer tidak boleh melampaui
 *   booking berikutnya.
 *
 * Contoh: Booking 08:00-08:30 (bufferTime=15)
 * → Zona blokir = 08:00-08:45
 * → Slot 08:30 TIDAK tersedia (tabrakan dengan zona buffer)
 * → Slot 08:45 TERSEDIA (mulai tepat setelah zona buffer)
 */
function markBookedSlots(
  slots: TimeSlot[],
  bookings: ExistingBooking[],
  date: Date,
  newBufferMinutes: number = 0
): TimeSlot[] {
  const targetDate = startOfDay(date);

  // Filter booking hanya untuk tanggal ini
  const dayBookings = bookings.filter(
    (b) => startOfDay(b.startTime).getTime() === targetDate.getTime()
  );

  if (dayBookings.length === 0) {
    return slots;
  }

  return slots.map((slot) => {
    const slotStart = parse(slot.startTime, "HH:mm", targetDate);
    const slotEnd = parse(slot.endTime, "HH:mm", targetDate);

    // Zona yang dibutuhkan slot baru: [slotStart, slotEnd + newBuffer)
    const slotEndWithBuffer = addMinutes(slotEnd, newBufferMinutes);

    // Cek apakah slot bertabrakan dengan booking yang ada (termasuk buffer)
    const isBooked = dayBookings.some((booking) => {
      // Zona blokir booking lama: [bookingStart, bookingEnd + bookingBuffer)
      const bookingBuffer = booking.bufferTime || 0;
      const bookingEndWithBuffer = addMinutes(booking.endTime, bookingBuffer);

      // Overlap: ada irisan antara zona slot baru dan zona booking lama
      // Condition 1: booking lama + buffernya overlap dengan slot baru
      const existingOverlap =
        isBefore(booking.startTime, slotEnd) &&
        isBefore(slotStart, bookingEndWithBuffer);

      // Condition 2: slot baru + buffernya overlap dengan booking lama
      const newBufferOverlap =
        isBefore(slotStart, booking.startTime) &&
        isBefore(booking.startTime, slotEndWithBuffer);

      return existingOverlap || newBufferOverlap;
    });

    return {
      ...slot,
      available: !isBooked,
    };
  });
}

/**
 * Menghitung slot yang tersedia untuk rentang tanggal.
 * Berguna untuk menampilkan kalender mingguan/bulanan.
 */
export function getAvailableSlotsForRange(
  startDate: Date,
  endDate: Date,
  schedules: ScheduleSession[],
  overrides: DateOverrideData[],
  bookings: ExistingBooking[],
  durationMinutes: number,
  bufferMinutes: number = 0
): Map<string, TimeSlot[]> {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const result = new Map<string, TimeSlot[]>();

  for (const day of days) {
    const dateKey = format(day, "yyyy-MM-dd");
    const slots = getAvailableSlots(
      day,
      schedules,
      overrides,
      bookings,
      durationMinutes,
      bufferMinutes
    );
    result.set(dateKey, slots);
  }

  return result;
}
