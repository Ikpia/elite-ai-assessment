# Elite Next.js Fullstack

Next.js fullstack version of the Elite Global AI Readiness Assessment platform.

## What It Mirrors

- landing page, respondent entry, assessment flow, completion state, and admin dashboard
- multi-sector question banks for financial services, healthcare, consulting firms, and SMEs
- health, assessment, admin, and report APIs
- MongoDB persistence with Mongoose
- PDF report generation with `@react-pdf/renderer`
- Resend email delivery with mock fallback
- firm-type backfill and organisation identity sync bootstrapped lazily on first server access
- retention cleanup exposed as a secure cron route for Vercel

## Routes

- `/`
- `/start`
- `/assessment/:step`
- `/complete`
- `/admin`

## API

- `GET /api/health`
- `POST /api/assessment/validate-email`
- `POST /api/assessment/submit`
- `GET /api/assessment/status/:orgId`
- `GET /api/admin/organisations`
- `PATCH /api/admin/organisations/:orgId`
- `POST /api/report/generate/:orgId`
- `POST /api/report/send/:orgId`
- `GET /api/cron/retention`

## Environment

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/elite-global-ai
ADMIN_SECRET=replace-with-a-long-random-secret
ALLOW_PERSONAL_EMAIL_DOMAINS=true
RESEND_API_KEY=
RESEND_FROM_EMAIL=reports@eliteglobalai.com
APP_BASE_URL=http://localhost:3000
REPORT_BENCHMARK_LOCAL=31
REPORT_BENCHMARK_GLOBAL=68
CRON_SECRET=replace-with-a-second-secret-for-vercel-cron
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_MARKETING_SITE_URL=https://eliteglobalai.com
```

## Commands

```bash
npm install
npm run dev
```

## Vercel Deployment

- Deploy `elite-nextjs-fullstack` as a single Next.js project. No separate Express backend deployment is required.
- Set all environment variables from `.env.example` in Vercel.
- Add a MongoDB database URI that Vercel can reach.
- `NEXT_PUBLIC_API_BASE_URL` can be left empty when the frontend and API run in the same project.
- The included `vercel.json` schedules retention cleanup through `/api/cron/retention`. Set `CRON_SECRET` in Vercel so only Vercel cron can invoke it.

## Notes

- This app uses Next.js route handlers instead of a separate Express server.
- The app is now self-contained inside `elite-nextjs-fullstack` and no longer depends on the sibling `backend` or `elite-frontend` folders at runtime.
- The UI intentionally preserves the current project structure and flow.
- In this workspace I could not run `npm` or `pnpm` because there is no usable Linux `node` binary, so build verification is still pending.
