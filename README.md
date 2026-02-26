<h1 align="center">🗓️ NexCal</h1>

<p align="center">
  <strong>The Self-Hosted Booking Platform That Rivals Premium SaaS</strong><br/>
  Multi-provider scheduling, built-in payments, business analytics — all in a single Docker container you own.<br/>
  Zero subscription fees. Zero vendor lock-in. 100% yours.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma" alt="Prisma 7" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
</p>

---

## ✨ What is NexCal?

**NexCal** is a production-grade, self-hosted appointment scheduling platform built for **teams** — clinics with multiple doctors, salons with many stylists, consulting firms, studios, and any business with multiple practitioners.

Unlike other open-source booking tools, NexCal ships with features you'd normally pay $50+/month for: **built-in payment gateway, business intelligence dashboard, smart scheduling engine, and WhatsApp notifications** — all running on your own server.

> **One `docker compose up` and you're live.** No sign-ups. No monthly fees. No data leaving your server.

---

## 🎯 Key Features

### 💳 Built-in Payment Gateway

Accept payments directly through the booking flow — no external plugins or third-party embeds needed.

| Feature | Detail |
|---------|--------|
| **Gateway-Agnostic Architecture** | Plugin system supports Midtrans, Xendit, Stripe (extensible) |
| **DP (Down Payment) Support** | Configure per-service: 50% DP, full payment, or free |
| **Auto-Confirm on Payment** | Webhook receives payment → booking auto-confirmed |
| **Admin Payment Dashboard** | Color-coded badges: Lunas, Belum Bayar, Gratis |
| **Graceful Degradation** | Leave `DEFAULT_PAYMENT_GATEWAY` empty = payments disabled, booking works normally |

> 🔌 **Adding a new gateway?** Create one file (`lib/payment/xendit.ts`), implement the interface, add one `case` in the factory. Done.

### 📊 Business Intelligence Dashboard

Your admin dashboard is now a **command center**, not just a schedule viewer.

| Component | What It Shows |
|-----------|---------------|
| 💰 **Revenue Card** | Monthly revenue (formatted Rupiah) with ▲/▼ growth vs last month |
| 📈 **30-Day Trend** | Pure CSS bar chart — hover for daily breakdown, zero external libraries |
| 🏆 **Top Services** | Ranked with visual progress bars + revenue per service |
| 👥 **Staff Performance** | Bookings, completions, revenue per practitioner (Owner-only) |
| ⏳ **Operational Metrics** | Pending count, total completed, cancellation rate % |

> All analytics respect **RBAC**: Owner sees org-wide data, Staff sees only their own.

### ⏱️ Smart Scheduling Engine

Dual-layer buffer time system that prevents provider burnout and appointment overlap.

```
Booking A ends 10:30 (30 min service)
├── Buffer: 10 minutes
├── Block zone: 10:00 – 10:40
└── Next available slot: 10:40+
```

- **Per-service buffer times** — Emergency consultation gets 5 min, surgery gets 30 min
- **Both directions** — Existing bookings block forward; new bookings require buffer after themselves
- **Admin visibility** — Amber "⏸ Jeda 10 mnt" badge on service cards

### 🏢 Multi-Provider & Team Management
- **Organization-first architecture** — All staff belong to a single org, data isolated by default
- **Role-Based Access Control (RBAC):** `OWNER` manages the entire team; `STAFF` manages their own
- **Staff Management Page** — Add new practitioners with one click (OWNER-only)
- **Provider Selection** — Customers choose their practitioner before picking a service
- **Auto-skip logic** — If only 1 provider exists, the step is seamlessly skipped

### 👤 Public Booking Wizard
- 🧑‍⚕️ **Provider Selector** — Choose your practitioner
- 🏷️ **Filtered Services** — Shows services with **live pricing** (Gratis / Rp 75.000 / DP 50%)
- 📅 **Smart Calendar** — Blocked dates auto-handled
- ⏰ **Real-time Slot Picker** — Generated from provider's schedule + buffer times
- 💳 **Payment CTA** — After booking, "💳 Bayar Sekarang" button redirects to payment gateway

### 🏥 Admin Dashboard & Operations
- 📊 **Analytics Dashboard** — Revenue, trends, top services, staff performance
- 📋 **Booking Management** — Filter, search, manage with payment status badges
- ✅ **Status Actions** — Confirm, Complete, Cancel (with reason), No-Show
- 🗓️ **Schedule Editor** — Operating hours with multiple sessions per day
- 📅 **Date Overrides** — Block holidays, vacations, special dates
- 🏷️ **Service Management** — Custom prices, durations, colors, buffer times

### 🔗 Integrations
- 📢 **WhatsApp Notifications** — Auto-notify via [MultiWA](https://github.com/ribato22/MultiWA) on booking + payment confirmation
- 📆 **Google Calendar Sync** — Confirmed bookings → provider's Google Calendar
- 💳 **Midtrans Payment** — Snap API with webhook auto-confirmation
- 🔒 **Secure Auth** — Cookie-based authentication with bcrypt hashing

### 🛡️ 3-Layer Anti Double-Booking System

**Zero possibility of double bookings**, guaranteed by three independent safety layers:

| Layer | Mechanism | Where |
|-------|-----------|-------|
| **Layer 1** | Zod schema validation — rejects invalid time ranges | Server Action |
| **Layer 2** | Real-time slot availability re-check before insert | Server Action |
| **Layer 3** | PostgreSQL unique constraint on `(userId, startTime)` | Database |

Even if two customers submit at the exact same millisecond, the database constraint catches it.

---

## 🖥️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router, React Server Components) |
| Language | TypeScript 5 (Strict mode) |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 (with `@prisma/adapter-pg`) |
| Auth | Auth.js v5 (NextAuth) |
| Styling | Tailwind CSS v4 |
| Payments | Gateway-agnostic factory (Midtrans plugin included) |
| Charts | Pure CSS (zero chart library dependencies) |
| Notifications | WhatsApp via MultiWA, Google Calendar sync |
| Containerization | Docker (multi-stage Alpine build) |

---

## 🚀 Self-Hosting Guide

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- That's it! 🎉

### Quick Start (Docker — Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/ribato22/nexcal.git
cd nexcal

# 2. Create environment file
cp .env.example .env

# 3. Generate a secure auth secret
#    Replace AUTH_SECRET in .env with the output:
openssl rand -base64 32

# 4. (Optional) Configure payment gateway
#    Edit .env and set MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY
#    Leave DEFAULT_PAYMENT_GATEWAY empty to disable payments

# 5. Launch! 🚀
docker compose -f docker-compose.prod.yml up -d --build

# 6. Open in browser
open http://localhost:3000
```

The first launch will automatically:
- ✅ Create database tables (Prisma migrations)
- ✅ Seed demo data (1 org, 3 users, services with prices, schedules, bookings)

### Default Logins (Multi-Provider Demo)

| Role | Email |
|------|-------|
| 👑 OWNER | `admin@kliniku.com` |
| 👤 STAFF | `dr.budi@kliniku.com` |
| 👤 STAFF | `bidan.sari@kliniku.com` |

> 🔑 **Default password** is defined in [`prisma/seed.ts`](prisma/seed.ts). Change all passwords immediately after deployment!

### Local Development

```bash
# Start PostgreSQL
docker compose up -d

# Install dependencies
npm install

# Setup database
npx prisma migrate dev
npx prisma db seed

# Start dev server
npm run dev
```

---

## 📁 Project Structure

```
nexcal/
├── prisma/
│   ├── schema.prisma           # Database models (ServiceType, Booking, PaymentStatus)
│   ├── seed.ts                 # Demo data with realistic pricing
│   └── migrations/             # Version-controlled migrations
├── src/
│   ├── app/
│   │   ├── admin/              # Admin dashboard + analytics (RSC)
│   │   ├── api/payment/        # Payment webhook endpoint
│   │   └── login/              # Auth page
│   ├── actions/
│   │   ├── analytics.ts        # BI engine (9 parallel RBAC queries)
│   │   ├── booking.ts          # Booking creation + payment flow
│   │   └── admin-bookings.ts   # CRUD with payment status
│   ├── components/
│   │   ├── booking/            # Public booking wizard
│   │   └── admin/              # Dashboard, tables, badges
│   └── lib/
│       ├── payment/
│       │   ├── core.ts         # PaymentProvider interface + factory
│       │   └── midtrans.ts     # Midtrans Snap API plugin
│       ├── slots.ts            # Slot engine with buffer time
│       └── rbac.ts             # Role-Based Access Control
├── Dockerfile                  # Multi-stage production build
├── docker-compose.yml          # Dev (PostgreSQL only)
├── docker-compose.prod.yml     # Production (app + PostgreSQL)
└── docker-entrypoint.sh        # Auto-migration on startup
```

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | Secret for signing auth tokens (min 32 chars) |
| `AUTH_TRUST_HOST` | ✅ | Set `true` behind a reverse proxy |
| `NEXT_PUBLIC_APP_NAME` | ❌ | Display name (default: "NexCal") |
| `NEXT_PUBLIC_APP_URL` | ❌ | Public URL (default: "http://localhost:3000") |
| `DEFAULT_PAYMENT_GATEWAY` | ❌ | `MIDTRANS` to enable payments (empty = disabled) |
| `MIDTRANS_SERVER_KEY` | ❌ | Midtrans server key (sandbox or production) |
| `MIDTRANS_CLIENT_KEY` | ❌ | Midtrans client key |
| `MIDTRANS_IS_PRODUCTION` | ❌ | `true` for live, `false` for sandbox (default) |
| `MULTIWA_API_URL` | ❌ | MultiWA API base URL (enables WhatsApp notifications) |
| `MULTIWA_API_KEY` | ❌ | MultiWA API key |
| `MULTIWA_SESSION_ID` | ❌ | MultiWA session ID |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID (enables Calendar sync) |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth client secret |

See [`.env.example`](.env.example) for the full template.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 💡 Roadmap

### ✅ Completed (v1.0 – v2.4)
- [x] Multi-provider support (organizations with OWNER/STAFF roles)
- [x] Staff management UI & provider-aware booking wizard
- [x] WhatsApp booking reminders (via [MultiWA](https://github.com/ribato22/MultiWA))
- [x] Google Calendar sync (1-way push on confirm)
- [x] ⏱️ Smart buffer time scheduling engine (v2.2)
- [x] 💳 Gateway-agnostic payment system + Midtrans plugin (v2.3)
- [x] 📊 Analytics dashboard with revenue tracking & BI (v2.4)

### 🔮 Future (v3.0+)
- [ ] 🎥 Virtual consulting — Zoom/Google Meet auto-link generation
- [ ] 🔄 Recurring bookings — Weekly/monthly subscription schedules
- [ ] 🌍 Multi-language support (i18n)
- [ ] 📱 Progressive Web App (PWA) with push notifications

---

<p align="center">
  Made with ❤️ in Indonesia<br/>
  <strong>NexCal</strong> — Your schedule, your data, your rules.
</p>
