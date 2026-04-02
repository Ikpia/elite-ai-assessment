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

function getStringList(name: string): string[] {
  const value = getOptionalString(name);

  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
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
  smtpHost: getOptionalString("SMTP_HOST"),
  smtpPort: getNumber("SMTP_PORT", 587),
  smtpSecure: getBoolean("SMTP_SECURE", false),
  smtpUser: getOptionalString("SMTP_USER"),
  smtpPass: getOptionalString("SMTP_PASS"),
  smtpFromEmail: getOptionalString("SMTP_FROM_EMAIL"),
  resendApiKey: getOptionalString("RESEND_API_KEY"),
  resendFromEmail: getOptionalString("RESEND_FROM_EMAIL"),
  appBaseUrl: getOptionalString("APP_BASE_URL") || `http://localhost:${port}`,
  superAdminEmails: getStringList("SUPER_ADMIN_EMAILS"),
  reportBenchmarkLocal: getNumber("REPORT_BENCHMARK_LOCAL", 31),
  reportBenchmarkGlobal: getNumber("REPORT_BENCHMARK_GLOBAL", 68),
  reportCalendlyUrl:
    getOptionalString("REPORT_CALENDLY_URL") || "https://calendly.com/eliteglobalai",
  reportContactName:
    getOptionalString("REPORT_CONTACT_NAME") || "Vwakpor Efuetanu",
  reportContactRole:
    getOptionalString("REPORT_CONTACT_ROLE") || "CEO, Elite Global AI",
  reportContactEmail:
    getOptionalString("REPORT_CONTACT_EMAIL") ||
    getOptionalString("RESEND_FROM_EMAIL") ||
    "reports@eliteglobalai.com",
  reportContactPhone:
    getOptionalString("REPORT_CONTACT_PHONE") || "Phone available on request",
  reportContactLinkedin:
    getOptionalString("REPORT_CONTACT_LINKEDIN") || "https://www.linkedin.com/company/elite-global-ai",
  reportContactWebsite:
    getOptionalString("REPORT_CONTACT_WEBSITE") ||
    getOptionalString("NEXT_PUBLIC_MARKETING_SITE_URL") ||
    "https://eliteglobalai.com"
};
