import "dotenv/config";

function getRequiredString(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getOptionalString(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function getNumber(name: string, fallback: number): number {
  const raw = process.env[name];

  if (raw === undefined || raw === "") {
    return fallback;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number.`);
  }

  return parsed;
}

function getBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name];

  if (raw === undefined || raw === "") {
    return fallback;
  }

  return raw.toLowerCase() === "true";
}

const port = getNumber("PORT", 4000);

export const env = {
  nodeEnv: process.env.NODE_ENV?.trim() || "development",
  port,
  mongodbUri: getRequiredString("MONGODB_URI"),
  adminSecret: getRequiredString("ADMIN_SECRET"),
  allowPersonalEmailDomains: getBoolean("ALLOW_PERSONAL_EMAIL_DOMAINS", true),
  resendApiKey: getOptionalString("RESEND_API_KEY"),
  resendFromEmail: getOptionalString("RESEND_FROM_EMAIL"),
  appBaseUrl: getOptionalString("APP_BASE_URL") || `http://localhost:${port}`,
  reportBenchmarkLocal: getNumber("REPORT_BENCHMARK_LOCAL", 31),
  reportBenchmarkGlobal: getNumber("REPORT_BENCHMARK_GLOBAL", 68)
};
