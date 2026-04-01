# Elite Next.js Fullstack

Self-contained Next.js fullstack version of the Elite Global AI Readiness Assessment platform.

This app combines:
- the public marketing and assessment experience
- the respondent assessment flow
- the director onboarding and team invite flow
- the public benchmark dashboard
- the admin dashboard and report workflow
- the API layer, persistence, scoring, and PDF generation

No separate Express backend is required.

## Overview

The application is built as a single Next.js project with:
- App Router route handlers under [`app/api`](./app/api)
- a catch-all frontend entry route at [`app/[[...slug]]/page.tsx`](./app/[[...slug]]/page.tsx)
- shared UI flow in [`components/assessment-shell.tsx`](./components/assessment-shell.tsx)
- MongoDB persistence through Mongoose
- PDF generation through `@react-pdf/renderer`
- email delivery through SMTP or Resend

## Core Flows

### Public Experience
- Landing page at `/`
- Start modal at `/start`
- One-question-per-screen assessment at `/assessment/:step`
- Completion screen at `/complete`
- Public benchmark dashboard at `/dashboard`

### Director Onboarding
- A director can start from the assessment entry form using the `Director` role
- Director onboarding creates or updates the firm admin record
- The system generates a firm invite link
- The invite link opens the same start form with:
  - `Type of Firm` prefilled
  - `Organisation Name` prefilled
  - `Director` removed from the role list
- Invite-based entry is locked so the modal can only be dismissed with `Cancel`

### Admin Access
- `/admin` uses email-based admin access
- The backend resolves the email into one of two scopes:
  - `super-admin`: full Elite Global AI access across all firms
  - `organisation-admin`: access limited to one firm
- Super admins can:
  - view all firms
  - create firm admin records
  - update any firm
  - delete firms
  - preview and send reports for any firm
- Firm admins can:
  - access only their own firm
  - update their own firm settings
  - preview and send their own firm report
  - never see other firms' data

### Reporting
- Organisation-level PDF reports are generated server-side
- Reports include:
  - aggregate readiness score
  - benchmark comparison
  - dimension-level breakdown
  - respondent roster with named respondent scores
- Reports can be previewed or emailed from the admin workflow

## Features

- Multi-sector question banks:
  - Financial Services
  - Healthcare
  - Consulting Firms
  - SMEs
- Server-side scoring and organisation aggregation
- Public benchmark dashboard with:
  - participating firms
  - average scoring
  - sector averages
  - firm comparisons
- Director onboarding and firm invite links
- Organisation-scoped admin access
- PDF report generation and delivery
- Vercel cron route for retention cleanup
- SMTP or Resend email delivery, with mock fallback in development

## Project Structure

```text
elite-nextjs-fullstack/
├── app/
│   ├── [[...slug]]/page.tsx
│   └── api/
├── components/
├── lib/
│   ├── server/
│   └── shared/
├── README.md
├── package.json
└── vercel.json
```

Important directories:
- [`app`](./app): frontend entry and API route handlers
- [`components`](./components): UI components and assessment shell
- [`lib/server`](./lib/server): database models, services, auth, report generation
- [`lib/shared`](./lib/shared): shared frontend/backend types and question metadata

## Routes

### Frontend
- `/`
- `/start`
- `/assessment/:step`
- `/complete`
- `/dashboard`
- `/admin`

### API

#### Health
- `GET /api/health`

#### Assessment
- `POST /api/assessment/validate-email`
- `POST /api/assessment/submit`
- `GET /api/assessment/status/:orgId`
- `POST /api/assessment/director-onboard`
- `GET /api/assessment/invite/:inviteToken`

#### Public Dashboard
- `GET /api/public/dashboard`

#### Admin
- `POST /api/admin/access/request`
- `GET /api/admin/organisations`
- `POST /api/admin/organisations`
- `PATCH /api/admin/organisations/:orgId`
- `DELETE /api/admin/organisations/:orgId`

#### Reports
- `POST /api/report/generate/:orgId`
- `POST /api/report/send/:orgId`

#### Cron
- `GET /api/cron/retention`

## Environment Variables

Use [`.env.example`](./.env.example) as the source of truth.

### Required

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/elite-global-ai
ADMIN_SECRET=replace-with-a-long-random-secret
SUPER_ADMIN_EMAILS=admin@eliteglobalai.com
ALLOW_PERSONAL_EMAIL_DOMAINS=true
APP_BASE_URL=http://localhost:3000
REPORT_BENCHMARK_LOCAL=31
REPORT_BENCHMARK_GLOBAL=68
CRON_SECRET=replace-with-a-second-secret-for-vercel-cron
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_MARKETING_SITE_URL=https://eliteglobalai.com
```

### Email Providers

SMTP takes priority when configured:

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=
```

If SMTP is not configured, Resend is used:

```env
RESEND_API_KEY=
RESEND_FROM_EMAIL=reports@eliteglobalai.com
```

Notes:
- In development, failed email delivery falls back to `mock` mode instead of crashing the flow
- In production, delivery failures are returned as API errors
- If you use Gmail SMTP, use an app password, not your main Gmail password

## Local Development

### Prerequisites
- Node.js LTS
- `pnpm`
- reachable MongoDB instance

### Install

```bash
pnpm install
```

### Run

```bash
pnpm dev
```

Open:
- `http://localhost:3000`

### Build

```bash
pnpm build
```

### Start Production Build Locally

```bash
pnpm start
```

## Deployment

### Vercel

Deploy `elite-nextjs-fullstack` as the project root.

Recommended settings:
- Framework Preset: `Next.js`
- Root Directory: `elite-nextjs-fullstack`

Deployment notes:
- No separate backend deployment is required
- Set all required environment variables in Vercel
- `NEXT_PUBLIC_API_BASE_URL` can be left empty when frontend and API are deployed together
- `vercel.json` schedules retention cleanup through `/api/cron/retention`
- Set `CRON_SECRET` so only your cron caller can hit the retention endpoint

## Email Delivery Behavior

Provider order:
1. SMTP
2. Resend
3. Mock fallback

Behavior:
- If SMTP is configured, the app uses SMTP
- If SMTP is not configured but Resend is configured, the app uses Resend
- If neither is configured, email returns `mock` mode
- In development, provider failures fall back to `mock` mode

This applies to:
- director invite emails
- admin access emails
- report delivery emails

## Auth Model

Admin access is enforced server-side in [`lib/server/runtime.ts`](./lib/server/runtime.ts).

Supported admin credentials:
- `ADMIN_SECRET`: legacy full-access secret, treated as super-admin access
- session token from `/api/admin/access/request`

Session tokens are scoped as:
- `super-admin`
- `organisation-admin`

Organisation admins are restricted to their own `organisationId` for dashboard, settings, PDF preview, and report send actions.

## Data Model Notes

- Organisations are identified by normalized organisation name
- `directorEmail` is used as the firm admin email
- `directorEmail` is uniqueness-protected at the database level
- Public dashboard data only includes firms with at least one submission
- Admin dashboard returns:
  - all firms for super admins
  - one firm for organisation admins

## Verification

This Next.js app has been build-verified in this workspace with:

```bash
pnpm build
```

## Troubleshooting

### Emails work only for your own address with Resend

If you use `onboarding@resend.dev`, Resend restricts delivery to your own test address. Use either:
- SMTP
- a verified Resend domain and sender

### SMTP times out

For Gmail, prefer:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

If `465` times out, it is usually a network or firewall issue rather than an app issue.

### Build issues after dependency changes

If Next.js starts failing with stale generated chunk errors, remove `.next` and rebuild.

## Summary

This project is a standalone Next.js fullstack assessment platform with:
- public marketing and assessment flows
- director onboarding and invite links
- scoped admin access
- public benchmark reporting
- server-generated PDF reports
- MongoDB persistence
- SMTP or Resend email delivery
