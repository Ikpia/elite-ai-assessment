import { FREE_EMAIL_DOMAINS } from "../constants/emailBlocklist";
import { env } from "../config/env";

export interface EmailValidationResult {
  valid: boolean;
  blocked: boolean;
  normalizedEmail: string | null;
  domain: string | null;
  reason: string | null;
}

const BASIC_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmailAddress(email: string): string {
  return email.trim().toLowerCase();
}

export function extractEmailDomain(email: string): string {
  return normalizeEmailAddress(email).split("@")[1] || "";
}

export function validateCompanyEmail(email: string): EmailValidationResult {
  const normalizedEmail = normalizeEmailAddress(email);

  if (!BASIC_EMAIL_REGEX.test(normalizedEmail)) {
    return {
      valid: false,
      blocked: false,
      normalizedEmail: null,
      domain: null,
      reason: "Invalid email format."
    };
  }

  const domain = extractEmailDomain(normalizedEmail);

  if (!env.allowPersonalEmailDomains && FREE_EMAIL_DOMAINS.has(domain)) {
    return {
      valid: false,
      blocked: true,
      normalizedEmail,
      domain,
      reason: "Please use your organisation email address."
    };
  }

  return {
    valid: true,
    blocked: false,
    normalizedEmail,
    domain,
    reason: null
  };
}
