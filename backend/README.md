# Elite Global AI Backend

Express + TypeScript backend for the Elite Global AI Readiness Assessment platform described in [EliteGlobalAI_PRD-2.md](/mnt/c/Users/USER1/Downloads/Ubuntu/anu/elite-global/EliteGlobalAI_PRD-2.md).

The backend now lives in [backend](/mnt/c/Users/USER1/Downloads/Ubuntu/anu/elite-global/backend), so run all package commands from that directory.

## Stack

- Node.js 20+
- `pnpm`
- Express
- MongoDB with Mongoose
- `@react-pdf/renderer` for PDF reports
- Resend for report delivery

## Project Setup

1. Install dependencies:

```bash
cd backend
pnpm install
```

2. Copy the environment template:

```bash
cd backend
cp .env.example .env
```

3. Start the API in development:

```bash
cd backend
pnpm dev
```

4. Build for production:

```bash
cd backend
pnpm build
pnpm start
```

## Environment Variables

- `PORT`: API port. Defaults to `4000`.
- `MONGODB_URI`: MongoDB connection string.
- `ADMIN_SECRET`: Shared secret for admin-only endpoints.
- `RESEND_API_KEY`: Optional. If omitted, `/api/report/send/:orgId` runs in mock mode and returns the email payload without sending.
- `RESEND_FROM_EMAIL`: Sender email for live report delivery.
- `APP_BASE_URL`: Used in email CTA links.
- `REPORT_BENCHMARK_LOCAL`: Defaults to `31`.
- `REPORT_BENCHMARK_GLOBAL`: Defaults to `68`.
- `RETENTION_SWEEP_ENABLED`: Enables the 90-day raw-submission cleanup worker.
- `RETENTION_SWEEP_INTERVAL_HOURS`: Sweep interval for the cleanup worker.

## Admin Authentication

Admin routes accept either:

- `Authorization: Bearer <ADMIN_SECRET>`
- `x-admin-secret: <ADMIN_SECRET>`

## API Surface

### Public

- `POST /api/assessment/validate-email`
- `POST /api/assessment/submit`
- `GET /api/assessment/status/:orgId`
- `GET /api/health`

### Admin

- `GET /api/admin/organisations`
- `PATCH /api/admin/organisations/:orgId`
- `POST /api/report/generate/:orgId`
- `POST /api/report/send/:orgId`

## Expected Submit Payload

`POST /api/assessment/submit`

```json
{
  "orgName": "Example Bank",
  "respondentEmail": "analyst@examplebank.com",
  "respondentName": "Ada Okafor",
  "respondentRole": "manager",
  "respondentDept": "Operations",
  "consentAccepted": true,
  "answers": [
    { "questionId": 1, "value": "C" },
    { "questionId": 2, "value": "B" },
    { "questionId": 3, "value": "D" },
    {
      "questionId": 4,
      "value": [
        "generative-ai-document-drafting",
        "ai-assisted-data-analysis"
      ]
    },
    { "questionId": 5, "value": "C" }
  ]
}
```

The full answer set must include all 25 questions. Questions `1-3`, `5-25` use `A | B | C | D`. Question `4` is a multi-select answer using these keys:

- `generative-ai-document-drafting`
- `ai-assisted-data-analysis`
- `automated-customer-communication`
- `compliance-monitoring`
- `ml-credit-scoring`
- `llm-regulatory-analysis`
- `none-of-the-above`

## Notes

- Organisation scores are stored as respondent averages, not raw sums.
- Report generation returns a PDF file response.
- Raw submissions are purged 90 days after `reportSentAt` once the sweeper runs.
- The backend auto-creates organisations from respondent email domains. Admin metadata such as `directorEmail` and `expectedRespondents` is managed through the admin update route.
