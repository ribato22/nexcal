<h1 align="center">🗓️ NexCal</h1>

<p align="center">
  <strong>The Self-Hosted Booking Platform That Rivals Premium SaaS</strong><br/>
  Multi-provider scheduling, built-in payments, Google Calendar sync, WhatsApp notifications — all in a single Docker container you own.<br/>
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

Unlike other open-source booking tools, NexCal ships with features you'd normally pay $50+/month for: **built-in payment gateway, virtual consultations via Google Meet, business intelligence dashboard, smart scheduling engine, and WhatsApp notifications** — all running on your own server.

> **One `docker compose up` and you're live.** No sign-ups. No monthly fees. No data leaving your server.

---

## 🎯 Killer Features

### 💳 Built-in Payment Gateway (Midtrans)

Accept payments directly through the booking flow — configured entirely from the Admin UI.

| Feature | Detail |
|---------|--------|
| **SaaS-Ready Config** | Server Key, Client Key, and Production mode configured via Admin → Settings (no `.env` needed!) |
| **Gateway-Agnostic Architecture** | Plugin system supports Midtrans, Xendit, Stripe (extensible) |
| **DP (Down Payment) Support** | Configure per-service: 50% DP, full payment, or free |
| **Payment Guard** | Admin cannot confirm paid bookings before payment is received |
| **Graceful Degradation** | No payment keys configured = payments disabled, booking works normally |
| **Patient Portal Payment** | "💳 Bayar Sekarang" button in patient self-service portal |

> 🔌 **Adding a new gateway?** Create one file (`lib/payment/xendit.ts`), implement the interface, add one `case` in the factory. Done.

### 💻 Virtual Consultations (Google Meet)

Turn any service into a virtual consultation with auto-generated Google Meet links.

| Feature | Detail |
|---------|--------|
| **Per-Service Toggle** | Mark services as "Konsultasi Online" from the service editor |
| **Auto-Generated Meet Links** | Google Meet link created automatically when admin confirms booking |
| **Confirmation Guard** | Virtual bookings cannot be confirmed if staff hasn't connected Google Calendar |
| **Patient Portal** | Meet link displayed in patient's self-service portal after confirmation |
| **Fallback UX** | Before confirmation, patients see "Tautan sedang diproses" placeholder |

### 📊 Business Intelligence Dashboard

Your admin dashboard is a **command center**, not just a schedule viewer.

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
- **Real-time past-time filter** — Slots before current time are auto-disabled for today
- **Cancelled slot recycling** — Cancelled bookings release their time slot for re-booking

### 🏢 Multi-Provider & Team Management
- **Organization-first architecture** — All staff belong to a single org, data isolated by default
- **Role-Based Access Control (RBAC):** `OWNER` manages the entire team; `STAFF` manages their own
- **Staff Management Page** — Add new practitioners with one click (OWNER-only)
- **Provider Selection** — Customers choose their practitioner before picking a service
- **Auto-skip logic** — If only 1 provider exists, the step is seamlessly skipped

### 👤 Patient Self-Service Portal

Patients get a unique management link (`/booking/manage/[token]`) to:

- 📋 View booking details, status, and payment info
- 💳 Pay outstanding invoices (redirect to Midtrans)
- 💻 Access Google Meet link (for virtual services)
- 📅 Reschedule appointments (up to 24 hours before)
- ❌ Cancel appointments (up to 24 hours before)

### 🏥 Admin Dashboard & Operations
- 📊 **Analytics Dashboard** — Revenue, trends, top services, staff performance
- 📋 **Booking Management** — Filter, search, manage with payment status badges
- ✅ **Status Actions** — Confirm (with payment guard), Complete, Cancel, No-Show
- 💰 **Mark as Paid** — Manual payment confirmation for cash/transfer payments
- 🗓️ **Schedule Editor** — Operating hours with multiple sessions per day
- 📅 **Date Overrides** — Block holidays, vacations, special dates
- 🏷️ **Service Management** — Custom prices, durations, colors, buffer times, virtual toggle

### ⚙️ Admin Settings (SaaS-Ready)

All integrations configured from the UI — **no `.env` file editing required for tenants**.

| Integration | Configuration |
|-------------|---------------|
| 💬 **WhatsApp** | MultiWA API URL, API Key, Session ID |
| 📆 **Google Calendar** | OAuth Client ID & Secret |
| 💳 **Midtrans** | Server Key, Client Key, Production/Sandbox toggle |

### 🔗 Integrations
- 📢 **WhatsApp Notifications** — Auto-notify via [MultiWA](https://github.com/ribato22/MultiWA) on booking + payment confirmation
- 📆 **Google Calendar Sync** — Confirmed bookings → provider's Google Calendar with Meet link
- 💳 **Midtrans Payment** — Snap API with redirect-based payment flow
- 🔒 **Secure Auth** — Cookie-based authentication with bcrypt hashing

### 🛡️ Anti Double-Booking System

**Zero possibility of double bookings**, guaranteed by two independent safety layers:

| Layer | Mechanism | Where |
|-------|-----------|-------|
| **Layer 1** | Zod schema validation — rejects invalid time ranges | Server Action |
| **Layer 2** | Real-time slot availability re-check with status filter `['PENDING', 'CONFIRMED']` | Server Action |

Cancelled and no-show bookings are automatically excluded, freeing up slots for new patients.

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
| Video | Google Meet (via Calendar API) |
| Charts | Pure CSS (zero chart library dependencies) |
| Notifications | WhatsApp via MultiWA, Google Calendar sync |
| Containerization | Docker (multi-stage Alpine build, standalone output) |

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
cp .env.production.example .env

# 3. Edit .env — set your passwords and auth secret
#    Generate auth secret: openssl rand -base64 32
nano .env

# 4. Launch! 🚀
docker compose -f docker-compose.prod.yml up -d --build

# 5. Open in browser
open http://localhost:3000
```

The first launch will automatically:
- ✅ Create database tables (Prisma migrations)
- ✅ Seed demo data (1 org, 3 users, services with prices, schedules, bookings)

> 💡 **After first login**, go to **Admin → Settings** to configure Midtrans, WhatsApp, and Google Calendar — all from the UI!

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
npx prisma db push
npx prisma db seed

# Start dev server
npm run dev
```

---

## 📁 Project Structure

```
nexcal/
├── prisma/
│   ├── schema.prisma           # Database models (Organization, ServiceType, Booking)
│   ├── seed.ts                 # Demo data with realistic pricing
│   └── migrations/             # Version-controlled migrations
├── src/
│   ├── app/
│   │   ├── admin/              # Admin dashboard + analytics (RSC)
│   │   ├── booking/manage/     # Patient self-service portal
│   │   └── login/              # Auth page
│   ├── actions/
│   │   ├── analytics.ts        # BI engine (9 parallel RBAC queries)
│   │   ├── booking.ts          # Booking creation + payment flow
│   │   ├── admin-bookings.ts   # CRUD with payment + GCal guards
│   │   └── settings.ts         # Org settings (WhatsApp, GCal, Midtrans)
│   ├── components/
│   │   ├── booking/            # Public booking wizard (multi-step)
│   │   └── admin/              # Dashboard, tables, badges, settings forms
│   └── lib/
│       ├── payment/
│       │   ├── core.ts         # PaymentProvider interface + factory
│       │   └── midtrans.ts     # Midtrans Snap plugin (DB-first config)
│       ├── gcal.ts             # Google Calendar + Meet link generation
│       ├── slots.ts            # Slot engine with buffer time + past-time filter
│       └── rbac.ts             # Role-Based Access Control
├── Dockerfile                  # Multi-stage production build (standalone)
├── docker-compose.yml          # Dev (PostgreSQL only)
├── docker-compose.prod.yml     # Production (app + PostgreSQL)
└── docker-entrypoint.sh        # Auto-migration + seed on startup
```

---

## 🔧 Environment Variables

NexCal follows a **SaaS-first architecture**: integration credentials (Midtrans, Google Calendar, WhatsApp) are configured per-organization via the Admin UI, **not** via environment variables.

### Server-Level (Required in `.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | Secret for signing auth tokens (`openssl rand -base64 32`) |
| `AUTH_TRUST_HOST` | ✅ | Set `true` behind a reverse proxy |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public URL (e.g., `https://booking.yourdomain.com`) |
| `NEXT_PUBLIC_APP_NAME` | ❌ | Display name (default: "NexCal") |
| `SEED_PASSWORD` | ❌ | Admin password for initial seed |

### Tenant-Level (Configured via Admin → Settings UI)

| Integration | Fields |
|-------------|--------|
| 💳 Midtrans | Server Key, Client Key, Production/Sandbox mode |
| 📆 Google Calendar | OAuth Client ID, Client Secret |
| 💬 WhatsApp | MultiWA URL, API Key, Session ID |

> See [`.env.production.example`](.env.production.example) for the full server template.

---

## 🌐 Deployment Recommendations

| Strategy | Best For | Pros | Cons |
|----------|----------|------|------|
| **Docker on VPS** (DigitalOcean, Hetzner, AWS EC2) | Full control, single-tenant | Complete ownership, predictable cost ($5-10/mo), easy backup | Manual SSL/updates |
| **Vercel + Neon/Supabase** | Serverless, zero-ops | Auto-scaling, free tier, built-in CDN | Cold starts, function timeouts, vendor lock-in |
| **Docker on Coolify/CapRover** | Self-hosted PaaS | Git-push deploy, auto-SSL, still your server | Learning curve |

**Our recommendation:** For an Indonesian SaaS MVP, **Docker on a $6/mo Hetzner VPS** with Caddy (auto-SSL) gives you the best cost-to-performance ratio. Add Cloudflare as CDN for free.

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

### ✅ Completed (v1.0 – v2.5)
- [x] Multi-provider support (organizations with OWNER/STAFF roles)
- [x] Staff management UI & provider-aware booking wizard
- [x] WhatsApp booking reminders (via [MultiWA](https://github.com/ribato22/MultiWA))
- [x] Google Calendar sync (1-way push on confirm)
- [x] ⏱️ Smart buffer time scheduling engine (v2.2)
- [x] 💳 Gateway-agnostic payment system + Midtrans plugin (v2.3)
- [x] 📊 Analytics dashboard with revenue tracking & BI (v2.4)
- [x] 💻 Virtual consultations with auto Google Meet links (v2.5)
- [x] 🏥 Patient self-service portal with reschedule/cancel (v2.5)
- [x] ⚙️ SaaS-ready admin settings — Midtrans, GCal, WhatsApp via UI (v2.5)
- [x] 🛡️ Payment guard, GCal error handling, past-time filter (v2.5)

### 🔮 Future (v3.0+)
- [ ] 🔄 Recurring bookings — Weekly/monthly subscription schedules
- [ ] 🌍 Multi-language support (i18n)
- [ ] 📱 Progressive Web App (PWA) with push notifications
- [ ] 🏪 Multi-tenant SaaS mode (shared instance, org isolation)

---

<p align="center">
  Made with ❤️ in Indonesia<br/>
  <strong>NexCal</strong> — Your schedule, your data, your rules.
</p>
