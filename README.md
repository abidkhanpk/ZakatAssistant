# ZakatAssistant

Next.js App Router + PostgreSQL + Prisma application for bilingual (English/Urdu) Zakat management.

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Run migrations: `npx prisma migrate dev`.
3. Seed defaults: `npx prisma db seed`.
4. Run: `npm run dev`.

Default admin after seeding:
- username: `admin`
- password: `admin123`

## Features

- Authentication with email verification
- Admin user management and SMTP settings (encrypted password)
- Dynamic unlimited categories and line items
- Server-side Zakat calculations
- Annual reminders cron endpoint (`/api/cron/annual-reminder`)
- In-app + email notifications
- PWA installable (`manifest.webmanifest` + `sw.js`)
- Locale routes: `/en/*` and `/ur/*` with Gulzar RTL for Urdu
