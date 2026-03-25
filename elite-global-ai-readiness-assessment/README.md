# Elite Global AI Readiness Assessment Frontend

This is the Vite + React frontend for the Elite Global AI Readiness Assessment platform.

It is designed to run against the backend service in [backend](/mnt/c/Users/USER1/Downloads/Ubuntu/anu/elite-global/backend).

## Run Locally

1. Install dependencies:

```bash
cd elite-global-ai-readiness-assessment
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env
```

3. Start the backend from [backend](/mnt/c/Users/USER1/Downloads/Ubuntu/anu/elite-global/backend):

```bash
pnpm dev
```

4. Start the frontend:

```bash
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:4000` by default.

## Environment Variables

- `VITE_API_BASE_URL`: Optional absolute backend URL for deployed environments.
- `VITE_API_PROXY_TARGET`: Local backend target for the Vite proxy.
- `VITE_MARKETING_SITE_URL`: URL used on the completion screen CTA.
