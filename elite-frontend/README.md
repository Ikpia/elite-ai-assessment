# Elite Frontend

This is the preserved original frontend layout, with the content personalized for the Elite Global AI Readiness Assessment platform.

The UI structure was intentionally kept intact. Changes in this folder are limited to:
- product copy and wording
- backend endpoint mapping
- API health connection
- local proxy configuration for the existing Express backend

## Backend Connection

Backend integration is centralized in:
- [lib/api.ts](./lib/api.ts)
- [lib/backend.ts](./lib/backend.ts)

The current frontend actively checks:
- `GET /api/health`

The endpoint map also includes the assessment, admin, and report routes for future wiring:
- `POST /api/assessment/validate-email`
- `POST /api/assessment/submit`
- `GET /api/admin/organisations`
- `PATCH /api/admin/organisations/:orgId`
- `POST /api/report/generate/:orgId`
- `POST /api/report/send/:orgId`

## Run Locally

1. Start the backend in `/backend`
   `pnpm dev`
2. Install frontend dependencies
   `npm install`
3. Run this frontend
   `npm run dev`

## Environment

Optional environment values:

```env
VITE_API_BASE_URL=
VITE_API_PROXY_TARGET=http://localhost:4000
```
