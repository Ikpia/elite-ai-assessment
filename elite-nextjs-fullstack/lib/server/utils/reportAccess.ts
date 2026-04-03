import { createHmac, timingSafeEqual } from "crypto";

import { env } from "../config/env";
import { HttpError } from "./httpError";

const REPORT_ACCESS_TOKEN_VERSION = 1;
const REPORT_ACCESS_TTL_MS = 24 * 60 * 60 * 1000;

interface ReportAccessPayload {
  v: number;
  organisationId: string;
  recipientEmail: string;
  submissionId?: string;
  exp: number;
}

function encodePayload(payload: ReportAccessPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(encoded: string): ReportAccessPayload {
  try {
    return JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as ReportAccessPayload;
  } catch {
    throw new HttpError(400, "Report access link is invalid.");
  }
}

function signEncodedPayload(encodedPayload: string): string {
  return createHmac("sha256", env.adminSecret)
    .update(encodedPayload)
    .digest("base64url");
}

function signaturesMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createReportAccessToken(params: {
  organisationId: string;
  recipientEmail: string;
  submissionId?: string;
  expiresInMs?: number;
}): string {
  const payload: ReportAccessPayload = {
    v: REPORT_ACCESS_TOKEN_VERSION,
    organisationId: params.organisationId.trim(),
    recipientEmail: params.recipientEmail.trim().toLowerCase(),
    ...(params.submissionId ? { submissionId: params.submissionId.trim() } : {}),
    exp: Date.now() + (params.expiresInMs || REPORT_ACCESS_TTL_MS)
  };

  const encodedPayload = encodePayload(payload);
  const signature = signEncodedPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyReportAccessToken(token: string): ReportAccessPayload {
  const trimmedToken = token.trim();
  const separatorIndex = trimmedToken.lastIndexOf(".");

  if (separatorIndex <= 0) {
    throw new HttpError(400, "Report access link is invalid.");
  }

  const encodedPayload = trimmedToken.slice(0, separatorIndex);
  const providedSignature = trimmedToken.slice(separatorIndex + 1);
  const expectedSignature = signEncodedPayload(encodedPayload);

  if (!signaturesMatch(providedSignature, expectedSignature)) {
    throw new HttpError(400, "Report access link is invalid.");
  }

  const payload = decodePayload(encodedPayload);

  if (
    payload.v !== REPORT_ACCESS_TOKEN_VERSION ||
    typeof payload.organisationId !== "string" ||
    !payload.organisationId.trim() ||
    typeof payload.recipientEmail !== "string" ||
    !payload.recipientEmail.trim() ||
    (payload.submissionId !== undefined &&
      (typeof payload.submissionId !== "string" || !payload.submissionId.trim())) ||
    typeof payload.exp !== "number" ||
    payload.exp <= Date.now()
  ) {
    throw new HttpError(400, "Report access link has expired.");
  }

  return {
    ...payload,
    organisationId: payload.organisationId.trim(),
    recipientEmail: payload.recipientEmail.trim().toLowerCase(),
    ...(payload.submissionId ? { submissionId: payload.submissionId.trim() } : {})
  };
}
