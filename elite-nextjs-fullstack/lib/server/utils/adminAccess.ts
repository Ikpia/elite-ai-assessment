import { createHmac, timingSafeEqual } from "crypto";

import { env } from "../config/env";
import { HttpError } from "./httpError";

const ADMIN_SESSION_TOKEN_VERSION = 1;
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export type AdminSessionPayload =
  | {
      v: number;
      scope: "super-admin";
      email: string;
      exp: number;
    }
  | {
      v: number;
      scope: "organisation";
      organisationId: string;
      directorEmail: string;
      exp: number;
    };

function encodePayload(payload: AdminSessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(encoded: string): AdminSessionPayload {
  try {
    return JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as AdminSessionPayload;
  } catch {
    throw new HttpError(401, "Admin session is invalid.");
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

export function getAdminSessionTtlMs(): number {
  return ADMIN_SESSION_TTL_MS;
}

export function createSuperAdminSessionToken(params: {
  email: string;
  expiresInMs?: number;
}): string {
  const payload: AdminSessionPayload = {
    v: ADMIN_SESSION_TOKEN_VERSION,
    scope: "super-admin",
    email: params.email.toLowerCase(),
    exp: Date.now() + (params.expiresInMs || ADMIN_SESSION_TTL_MS)
  };

  const encodedPayload = encodePayload(payload);
  const signature = signEncodedPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function createOrganisationAdminSessionToken(params: {
  organisationId: string;
  directorEmail: string;
  expiresInMs?: number;
}): string {
  const payload: AdminSessionPayload = {
    v: ADMIN_SESSION_TOKEN_VERSION,
    scope: "organisation",
    organisationId: params.organisationId,
    directorEmail: params.directorEmail.toLowerCase(),
    exp: Date.now() + (params.expiresInMs || ADMIN_SESSION_TTL_MS)
  };

  const encodedPayload = encodePayload(payload);
  const signature = signEncodedPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSessionToken(token: string): AdminSessionPayload {
  const trimmedToken = token.trim();
  const separatorIndex = trimmedToken.lastIndexOf(".");

  if (separatorIndex <= 0) {
    throw new HttpError(401, "Admin session is invalid.");
  }

  const encodedPayload = trimmedToken.slice(0, separatorIndex);
  const providedSignature = trimmedToken.slice(separatorIndex + 1);
  const expectedSignature = signEncodedPayload(encodedPayload);

  if (!signaturesMatch(providedSignature, expectedSignature)) {
    throw new HttpError(401, "Admin session is invalid.");
  }

  const payload = decodePayload(encodedPayload);

  if (
    payload.v !== ADMIN_SESSION_TOKEN_VERSION ||
    typeof payload.exp !== "number" ||
    payload.exp <= Date.now()
  ) {
    throw new HttpError(401, "Admin session has expired.");
  }

  if (
    payload.scope === "super-admin" &&
    typeof payload.email === "string" &&
    payload.email
  ) {
    return payload;
  }

  if (
    payload.scope === "organisation" &&
    typeof payload.organisationId === "string" &&
    payload.organisationId &&
    typeof payload.directorEmail === "string" &&
    payload.directorEmail
  ) {
    return payload;
  }

  throw new HttpError(401, "Admin session is invalid.");
}
