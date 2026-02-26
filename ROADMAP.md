# 🗺️ NexCal Roadmap

> **Current Release:** v2.4.0 (Stable)
> **Status:** Feature-frozen. Accepting bug fixes and community contributions only.

This document outlines the long-term vision for NexCal. If you're a contributor interested in building any of these features, please open an issue to discuss the approach before starting work.

---

## ✅ Completed (v1.0 – v2.4)

| Version | Feature | Status |
|---------|---------|--------|
| v1.0 | Multi-provider booking system with RBAC | ✅ Shipped |
| v1.0 | 3-layer anti double-booking engine | ✅ Shipped |
| v1.0 | WhatsApp reminders via MultiWA | ✅ Shipped |
| v1.0 | Google Calendar sync (1-way push) | ✅ Shipped |
| v2.0 | Organization & staff management | ✅ Shipped |
| v2.2 | Smart scheduling engine (dual-layer buffer times) | ✅ Shipped |
| v2.3 | Gateway-agnostic payment system (Midtrans plugin) | ✅ Shipped |
| v2.3 | Payment webhook with auto-confirm + WhatsApp receipt | ✅ Shipped |
| v2.4 | Business intelligence dashboard (revenue, trends, staff perf) | ✅ Shipped |

---

## 🔮 v3.0 — "Global Scheduling Platform"

Two major features that transform NexCal from a physical booking tool into a global virtual consulting and subscription scheduling platform.

---

### 🎥 Feature 1: Virtual Consulting — Auto-Generated Meeting Links

**Problem:** Online consultants, therapists, tutors, and telemedicine providers need booking systems that automatically provision video conference rooms. Currently, they manually create Zoom links and paste them into messages — error-prone and unprofessional.

**Solution:** NexCal auto-generates meeting links when a virtual service is booked.

#### User Flow

```
1. Admin marks a service as "Virtual" or "Hybrid" in Service Management
2. Customer books the service through the normal booking wizard
3. NexCal auto-generates a Zoom or Google Meet link via API
4. Meeting link is sent to the customer via WhatsApp and stored in booking
5. At appointment time → 1-click join from both customer and admin dashboard
6. After appointment → meeting link auto-expires
```

#### Proposed Architecture

```
src/lib/meeting/
├── core.ts           # MeetingProvider interface + factory
│                     # (same plugin pattern as lib/payment/)
├── zoom.ts           # Zoom Server-to-Server OAuth + Create Meeting API
└── google-meet.ts    # Google Calendar API (existing OAuth reusable)
```

**Interface Design:**

```typescript
// lib/meeting/core.ts

interface MeetingProvider {
  createMeeting(params: {
    topic: string;
    startTime: Date;
    durationMinutes: number;
    hostEmail?: string;
  }): Promise<{
    meetingUrl: string;
    meetingId: string;
    hostUrl?: string;    // Host-specific URL (Zoom)
    password?: string;   // Meeting password (Zoom)
  }>;

  cancelMeeting(meetingId: string): Promise<void>;
}

function getMeetingProvider(): MeetingProvider | null {
  switch (process.env.DEFAULT_MEETING_PROVIDER) {
    case "ZOOM": return new ZoomProvider();
    case "GOOGLE_MEET": return new GoogleMeetProvider();
    default: return null;
  }
}
```

**Schema Changes:**

```prisma
enum ServiceMode {
  PHYSICAL
  VIRTUAL
  HYBRID
}

model ServiceType {
  // ... existing fields
  mode            ServiceMode @default(PHYSICAL)
}

model Booking {
  // ... existing fields
  meetingUrl       String?
  meetingProvider   String?
  meetingId        String?
}
```

**Environment Variables:**

```env
DEFAULT_MEETING_PROVIDER=ZOOM    # or GOOGLE_MEET, empty = disabled
ZOOM_ACCOUNT_ID=...
ZOOM_CLIENT_ID=...
ZOOM_CLIENT_SECRET=...
```

**Target Market Expansion:** Telemedicine, online tutoring, coaching, therapy, legal consulting — a global market valued at $50B+.

---

### 🔄 Feature 2: Recurring Bookings — Subscription Scheduling

**Problem:** Patients in physiotherapy book weekly sessions. Piano students book every Tuesday at 4 PM. Currently, they must manually re-book each time — tedious and leads to missed appointments.

**Solution:** Customers or admins can create recurring schedules that auto-generate future bookings.

#### User Flow

```
1. Customer/Admin selects "Jadwal Berulang" (Recurring Schedule) during booking
2. Choose frequency: Weekly / Bi-weekly / Monthly
3. Set duration: 4 weeks, 8 weeks, or specific end date
4. NexCal auto-generates all future bookings in a single transaction
5. Optional: Package payment (10 sessions = 15% discount)
6. Automatic reminders before each session
7. Admin: "Kelola Paket" page shows remaining sessions
```

#### Proposed Architecture

**Schema Changes:**

```prisma
model RecurringSchedule {
  id              String    @id @default(cuid())
  bookingPattern  String    // "WEEKLY" | "BIWEEKLY" | "MONTHLY"
  dayOfWeek       Int?      // 0-6 (for weekly)
  preferredTime   String    // "10:00"
  startDate       DateTime
  endDate         DateTime?
  maxOccurrences  Int       @default(12)
  totalSessions   Int
  completedCount  Int       @default(0)
  status          String    @default("ACTIVE") // ACTIVE | PAUSED | COMPLETED | CANCELLED

  // Payment package
  packagePrice    Int       @default(0)
  packagePaid     Boolean   @default(false)

  // Relations
  userId          String
  serviceTypeId   String
  bookings        Booking[]
  createdAt       DateTime  @default(now())
}

model Booking {
  // ... existing fields
  recurringScheduleId  String?
  recurringSchedule    RecurringSchedule? @relation(fields: [recurringScheduleId], references: [id])
}
```

**Key Components:**

```
src/actions/recurring.ts     # CRUD for recurring schedules
src/lib/recurring-engine.ts  # Generate next batch of bookings
                             # (can run via cron or on-demand)
src/app/admin/packages/      # Admin UI for managing packages
```

**Business Logic:**

```typescript
// lib/recurring-engine.ts

async function generateRecurringBookings(schedule: RecurringSchedule) {
  const dates = calculateFutureDates(
    schedule.bookingPattern,
    schedule.startDate,
    schedule.endDate,
    schedule.maxOccurrences - schedule.completedCount
  );

  // Batch-check slot availability for all dates
  const available = await checkBatchAvailability(dates, schedule);

  // Create bookings in a single transaction
  await prisma.$transaction(
    available.map(date =>
      prisma.booking.create({
        data: {
          date,
          startTime: parseTime(schedule.preferredTime),
          serviceTypeId: schedule.serviceTypeId,
          userId: schedule.userId,
          recurringScheduleId: schedule.id,
          status: schedule.packagePaid ? "CONFIRMED" : "PENDING",
        }
      })
    )
  );
}
```

**Business Impact:**
- 3-5x customer retention rate
- Predictable Monthly Recurring Revenue (MRR)
- Complete differentiation from all open-source booking tools

---

## 🌍 v3.1+ — Future Ideas

These are lower-priority ideas. Community input welcome.

| Feature | Description | Priority |
|---------|-------------|----------|
| 🌐 Multi-language (i18n) | English, Indonesian, + community translations | Medium |
| 📱 PWA + Push Notifications | Installable app with browser push reminders | Medium |
| 🧑‍💼 Customer Portal | Appointment history, reschedule, cancel self-service | Medium |
| 📧 Email Notifications | Transactional emails as WhatsApp fallback | Low |
| 🔌 Zapier/Webhook Integration | Generic webhook on booking events for automation | Low |
| 📊 Export Reports | CSV/PDF export for revenue and booking reports | Low |

---

## 🤝 Contributing to the Roadmap

1. **Pick a feature** from the list above
2. **Open an issue** with your proposed implementation approach
3. **Discuss** with maintainers before writing code
4. **Submit a PR** following the existing architecture patterns

The codebase follows consistent patterns (e.g., `PaymentProvider` interface for payments, `getDataScope()` for RBAC). New features should follow these patterns for consistency.

---

<p align="center">
  <strong>NexCal</strong> — Open-source scheduling, built for the future.
</p>
