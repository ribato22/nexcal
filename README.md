<p align="center">
  <img src="public/icons/icon-192x192.png" alt="NexCal" width="80" />
</p>

<h1 align="center">NexCal</h1>

<p align="center">
  <strong>Free &amp; Open-Source Appointment Booking System</strong><br/>
  Calendly alternative — self-hosted, privacy-first, built for Indonesian healthcare practitioners.
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

**NexCal** is a modern, self-hosted appointment scheduling system designed for independent healthcare practitioners — midwives, dentists, GPs, or anyone who needs a clean booking page and an admin dashboard to manage appointments.

Think of it as a **free Calendly** that you own, control, and can customize. No subscription fees, no vendor lock-in.

---

## 🎯 Key Features

### For Patients (Public Booking Page)
- 🏥 **Service Selection** — Browse available services with descriptions and durations
- 📅 **Smart Calendar** — Only shows open dates; national holidays auto-blocked
- ⏰ **Real-time Slot Picker** — Slots generated live from provider schedule
- 📝 **Simple Booking Form** — Name, WhatsApp number, and optional notes

### For Practitioners (Admin Dashboard)
- 📊 **Live Dashboard** — Pending count, today's schedule, weekly completions
- 📋 **Booking Management** — Filter, search, and manage all reservations
- ✅ **Status Actions** — Confirm, Complete, Cancel (with reason), No-Show
- 🗓️ **Schedule Editor** — Set operating hours per day with multiple sessions
- 📅 **Date Overrides** — Block holidays, vacations, or special dates
- 🏷️ **Service Management** — CRUD services with custom colors and durations
- 🔒 **Secure Auth** — Cookie-based authentication with bcrypt password hashing

### 🛡️ 3-Layer Anti Double-Booking System

NexCal's most important feature: **zero possibility of double bookings**, guaranteed by three independent safety layers:

| Layer | Mechanism | Where |
|-------|-----------|-------|
| **Layer 1** | Zod schema validation — rejects invalid time ranges | Server Action |
| **Layer 2** | Real-time slot availability re-check before insert | Server Action |
| **Layer 3** | PostgreSQL unique constraint on `(userId, startTime)` | Database |

Even if two patients submit at the exact same millisecond, the database constraint catches it. **No conflicts, guaranteed.**

---

## 🖥️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router, React Server Components) |
| Language | TypeScript 5 |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 (with `@prisma/adapter-pg`) |
| Auth | Auth.js v5 (NextAuth) |
| Styling | Tailwind CSS v4 |
| Containerization | Docker (multi-stage Alpine build) |

---

## 🚀 Self-Hosting Guide

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- That's it! 🎉

### Quick Start (Docker — Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/nexcal.git
cd nexcal

# 2. Create environment file
cp .env.example .env

# 3. Generate a secure auth secret
#    Replace AUTH_SECRET in .env with the output:
openssl rand -base64 32

# 4. Launch! 🚀
docker compose -f docker-compose.prod.yml up -d --build

# 5. Open in browser
open http://localhost:3000
```

The first launch will automatically:
- ✅ Create database tables (Prisma migrations)
- ✅ Seed demo data (admin user + 5 services + sample bookings)

### Default Login

| Field | Value |
|-------|-------|
| Email | `bidan.sari@kliniku.com` |
| Password | `REDACTED_SEED_PASSWORD` |

> ⚠️ **Change the default password immediately after your first login!**

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
│   ├── schema.prisma       # Database models
│   ├── seed.ts             # Demo data seeder
│   └── migrations/         # Version-controlled migrations
├── src/
│   ├── app/
│   │   ├── admin/          # Admin dashboard (RSC)
│   │   ├── booking/[slug]/ # Public booking wizard
│   │   └── login/          # Auth page
│   ├── actions/            # Server Actions (forms & mutations)
│   ├── components/         # Reusable UI components
│   └── lib/                # Auth, Prisma client, slot engine
├── Dockerfile              # Multi-stage production build
├── docker-compose.yml      # Dev (PostgreSQL only)
├── docker-compose.prod.yml # Production (app + PostgreSQL)
└── docker-entrypoint.sh    # Auto-migration on startup
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

- [ ] WhatsApp booking reminders (via API)
- [ ] Multi-provider support (clinic with multiple practitioners)
- [ ] Patient appointment history portal
- [ ] Google Calendar sync
- [ ] Analytics dashboard with charts

---

<p align="center">
  Made with ❤️ for Indonesian healthcare practitioners<br/>
  <strong>NexCal</strong> — Your schedule, your rules.
</p>
