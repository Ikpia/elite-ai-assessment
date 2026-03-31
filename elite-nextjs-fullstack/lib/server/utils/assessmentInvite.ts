import { createHmac, timingSafeEqual } from "crypto";

import { env } from "../config/env";
import { HttpError } from "./httpError";

const ASSESSMENT_INVITE_TOKEN_VERSION = 1;

interface AssessmentInvitePayload {
  v: number;
  organisationId: string;
}

function encodePayload(payload: AssessmentInvitePayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(encoded: string): AssessmentInvitePayload {
  try {
    return JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as AssessmentInvitePayload;
  } catch {
    throw new HttpError(400, "Assessment invite link is invalid.");
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

export function createAssessmentInviteToken(organisationId: string): string {
  const normalizedOrganisationId = organisationId.trim();

  if (!normalizedOrganisationId) {
    throw new Error("organisationId is required");
  }

  const payload: AssessmentInvitePayload = {
    v: ASSESSMENT_INVITE_TOKEN_VERSION,
    organisationId: normalizedOrganisationId
  };

  const encodedPayload = encodePayload(payload);
  const signature = signEncodedPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyAssessmentInviteToken(token: string): AssessmentInvitePayload {
  const trimmedToken = token.trim();
  const separatorIndex = trimmedToken.lastIndexOf(".");

  if (separatorIndex <= 0) {
    throw new HttpError(400, "Assessment invite link is invalid.");
  }

  const encodedPayload = trimmedToken.slice(0, separatorIndex);
  const providedSignature = trimmedToken.slice(separatorIndex + 1);
  const expectedSignature = signEncodedPayload(encodedPayload);

  if (!signaturesMatch(providedSignature, expectedSignature)) {
    throw new HttpError(400, "Assessment invite link is invalid.");
  }

  const payload = decodePayload(encodedPayload);

  if (
    payload.v !== ASSESSMENT_INVITE_TOKEN_VERSION ||
    typeof payload.organisationId !== "string" ||
    !payload.organisationId.trim()
  ) {
    throw new HttpError(400, "Assessment invite link is invalid.");
  }

  return {
    ...payload,
    organisationId: payload.organisationId.trim()
  };
}
