export function isBookingSlotConflict(error: unknown): boolean {
  // Prisma's PostgreSQL adapter includes the constraint name in the exclusion error.
  return error instanceof Error && error.message.includes("bookings_active_slot_exclusion");
}
