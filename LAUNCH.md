# 🚀 NexCal v2.4 — Launch Kit

> Internal marketing asset. Use these drafts as starting points for launch posts.
> Adjust tone and details as needed for each platform.

---

## 📝 Draft 1: Reddit (r/selfhosted & r/nextjs)

### Title Options (pick one):
- `I built a self-hosted Calendly alternative with built-in payments and zero chart library dependencies`
- `NexCal — open-source multi-provider booking system with payment gateway, analytics, and WhatsApp notifications`
- `After 3 months, my self-hosted booking platform now has features I'd pay $50/month for`

### Body:

Hey r/selfhosted!

I've been building **NexCal** — a self-hosted booking/appointment system for businesses with multiple practitioners (clinics, salons, studios, consulting firms). It started as a simple calendar tool but has grown into something I'm genuinely proud of.

**What makes it different from other open-source booking tools:**

🏢 **Multi-provider by design** — Not just "one person, one calendar." NexCal has organizations, OWNER/STAFF roles, and each provider manages their own services and schedule. Customers choose their provider → service → time slot.

💳 **Built-in payment gateway** — Gateway-agnostic architecture (Midtrans included, extensible to Stripe/Xendit). Supports full payment or down payment (DP) per service. Webhook auto-confirms bookings when payment settles. Leave the env var empty = payments disabled, booking works normally.

📊 **Analytics dashboard with ZERO chart library** — Revenue tracking, 30-day trend chart, top services, staff performance — all built with pure CSS flexbox bars. No recharts, no chart.js, no bundle bloat. The analytics engine runs 9 parallel Prisma queries for maximum performance.

⏱️ **Smart scheduling** — Dual-layer buffer times prevent back-to-back burnout. A 30-minute consultation with 10-minute buffer blocks 10:00–10:40, not just 10:00–10:30.

🛡️ **3-layer anti double-booking** — Zod validation → slot re-check → PostgreSQL unique constraint. Even millisecond-simultaneous submissions can't create conflicts.

📢 **WhatsApp notifications** — Optional integration with MultiWA (another open-source project of mine) for automated booking reminders and payment receipts.

**Tech stack:** Next.js 16, TypeScript, Prisma 7, PostgreSQL, Tailwind CSS 4, Docker.

**Self-hosting:** `docker compose up` and you're live. Auto-migrations, demo seed data included.

GitHub: https://github.com/ribato22/nexcal

I'd love feedback from the community. What features would make you switch from Calendly/Cal.com?

---

## 🐦 Draft 2: Twitter/X Thread

### Thread:

**Tweet 1 (Hook):**
I was paying $48/month for Calendly Pro.

Then I realized I could build a better version — with payments, analytics, and WhatsApp notifications — for $0/month.

Meet NexCal. Open-source. Self-hosted. MIT licensed.

🧵 Here's what 3 months of building looks like:

---

**Tweet 2:**
Most open-source booking tools are single-user calendars.

NexCal is built for TEAMS from day one:
• Organizations with OWNER/STAFF roles
• Each provider manages their own schedule
• Customers pick: Provider → Service → Time
• RBAC controls who sees what data

---

**Tweet 3:**
The payment system that took me 3 days to architect:

Gateway-agnostic. Plugin pattern. One interface, infinite gateways.

✅ Midtrans (Indonesia) — shipped
🔜 Stripe, Xendit — just add one file

DP support, webhook auto-confirm, WhatsApp receipts.

Leave the env var empty? Payments disabled. Zero friction.

---

**Tweet 4:**
The analytics dashboard that uses ZERO chart libraries:

• Revenue tracking (current vs last month, growth %)
• 30-day trend — pure CSS bar chart with hover tooltips
• Top 5 services ranked with progress bars
• Staff performance table (Owner-only, RBAC-aware)

9 parallel Prisma queries. One Promise.all. Instant load.

---

**Tweet 5:**
Anti double-booking? 3 independent layers:

Layer 1: Zod schema validation
Layer 2: Real-time slot re-check before insert
Layer 3: PostgreSQL unique constraint

Even if 2 customers submit at the EXACT same millisecond — the database catches it.

Zero conflicts. Guaranteed.

---

**Tweet 6 (CTA):**
NexCal v2.4 is live:

⏱️ Smart buffer time scheduling
💳 Built-in payment gateway
📊 Business intelligence dashboard
📢 WhatsApp notifications
🐳 One `docker compose up`

Free. Forever. MIT License.

⭐ https://github.com/ribato22/nexcal

If you're tired of paying $50+/month for appointment scheduling — star the repo and try it.

---

## 💼 Draft 3: LinkedIn Post

### Post:

**Announcing NexCal v2.4 — The Open-Source Scheduling Platform for Growing Businesses**

After 3 months of intensive development, I'm excited to share NexCal — a production-grade appointment scheduling system built for multi-provider businesses like clinics, salons, studios, and consulting firms.

**The problem we solved:**
Small and medium businesses pay $30-100/month per provider for scheduling tools like Calendly and Acuity. That's $1,200+/year for a 3-person clinic — and you don't even own the data.

**What NexCal brings to the table:**

💳 **Integrated Payment Processing**
Accept payments directly through the booking flow with down payment (DP) support. When payment settles, the booking auto-confirms and the customer receives a WhatsApp receipt. No more chasing no-shows — prepayment reduces no-show rates by up to 70%.

📊 **Business Intelligence Dashboard**
Revenue tracking with month-over-month growth analysis. Service performance ranking. Staff productivity metrics. All in real-time, all RBAC-compliant — business owners see the full picture, staff members see their own performance.

⏱️ **Smart Scheduling Engine**
Configurable buffer times between appointments prevent provider burnout and ensure quality of service. A 30-minute consultation with a 10-minute buffer ensures the next patient isn't waiting while the doctor finishes notes.

🏢 **Team-first Architecture**
Organizations, role-based access, per-provider schedules. NexCal isn't a personal calendar — it's built for teams from the ground up.

**Technology:** Next.js 16, TypeScript, PostgreSQL, Docker. Self-hosted with a single command. Zero runtime dependencies for charts (pure CSS visualization). MIT Licensed.

**What this means for business owners:**
- Own your data (GDPR/privacy compliance simplified)
- Zero monthly subscription fees
- Reduce no-shows with prepayment integration
- Data-driven decisions with built-in analytics
- Scale from 1 to 50+ providers without changing tools

The complete source code is available on GitHub: https://github.com/ribato22/nexcal

I'd love to hear from clinic managers, salon owners, and business operators — what scheduling pain points keep you up at night?

#OpenSource #SaaS #HealthTech #BusinessIntelligence #SelfHosted #NextJS #Scheduling

---

## 📋 Platform Posting Checklist

| Platform | Subreddit / Channel | Timing | Status |
|----------|---------------------|--------|--------|
| Reddit | r/selfhosted | Weekday 9-11 AM EST | ⬜ |
| Reddit | r/nextjs | Weekday 10 AM EST | ⬜ |
| Reddit | r/webdev | Weekend morning | ⬜ |
| Twitter/X | Main account | Tuesday or Wednesday 2 PM WIB | ⬜ |
| LinkedIn | Personal profile | Tuesday 8-10 AM WIB | ⬜ |
| Hacker News | Show HN | Weekday 9 AM EST | ⬜ |
| Dev.to | Article (longer form) | Any weekday | ⬜ |
| Product Hunt | Launch | Tuesday-Thursday | ⬜ |

> **Pro tip:** Post on Reddit first (#1 traffic source for self-hosted), then Twitter thread for developer audience, then LinkedIn for B2B leads.
