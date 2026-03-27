import { FIRM_TYPES, ROLE_LEVELS } from "../constants/assessment";
import type {
  AssessmentAnswerInput,
  FirmType,
  RoleLevel,
  SubmissionPayload
} from "../types/assessment";
import { HttpError } from "../utils/httpError";

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, `${label} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, `${label} is required.`);
  }

  return value.trim();
}

function parseRole(value: unknown): RoleLevel {
  if (typeof value !== "string" || !ROLE_LEVELS.includes(value as RoleLevel)) {
    throw new HttpError(
      400,
      `respondentRole must be one of: ${ROLE_LEVELS.join(", ")}.`
    );
  }

  return value as RoleLevel;
}

function parseFirmType(value: unknown): FirmType {
  if (typeof value !== "string" || !FIRM_TYPES.includes(value as FirmType)) {
    throw new HttpError(
      400,
      `firmType must be one of: ${FIRM_TYPES.join(", ")}.`
    );
  }

  return value as FirmType;
}

function parseAnswers(value: unknown): AssessmentAnswerInput[] {
  if (!Array.isArray(value)) {
    throw new HttpError(400, "answers must be an array.");
  }

  return value.map((answer, index) => {
    const parsed = asRecord(answer, `answers[${index}]`);
    const questionId = parsed.questionId;
    const rawValue = parsed.value;

    if (!Number.isInteger(questionId)) {
      throw new HttpError(400, `answers[${index}].questionId must be an integer.`);
    }

    if (
      typeof rawValue !== "string" &&
      !(
        Array.isArray(rawValue) &&
        rawValue.every((item) => typeof item === "string")
      )
    ) {
      throw new HttpError(
        400,
        `answers[${index}].value must be a string or an array of strings.`
      );
    }

    return {
      questionId,
      value: rawValue
    } as AssessmentAnswerInput;
  });
}

export function parseValidateEmailBody(body: unknown): { email: string } {
  const payload = asRecord(body, "Request body");
  return {
    email: requireString(payload.email, "email")
  };
}

export function parseSubmissionPayload(body: unknown): SubmissionPayload {
  const payload = asRecord(body, "Request body");

  if (payload.consentAccepted !== true) {
    throw new HttpError(400, "consentAccepted must be true before submission.");
  }

  return {
    firmType:
      payload.firmType === undefined
        ? "financial-services"
        : parseFirmType(payload.firmType),
    orgName: requireString(payload.orgName, "orgName"),
    respondentEmail: requireString(payload.respondentEmail, "respondentEmail"),
    respondentName: requireString(payload.respondentName, "respondentName"),
    respondentRole: parseRole(payload.respondentRole),
    respondentDept: requireString(payload.respondentDept, "respondentDept"),
    consentAccepted: true,
    answers: parseAnswers(payload.answers)
  };
}

export function parseOrganisationUpdateBody(
  body: unknown
): {
  orgName?: string;
  directorEmail?: string;
  expectedRespondents?: number | null;
} {
  const payload = asRecord(body, "Request body");
  const updates: {
    orgName?: string;
    directorEmail?: string;
    expectedRespondents?: number | null;
  } = {};

  if (payload.orgName !== undefined) {
    updates.orgName = requireString(payload.orgName, "orgName");
  }

  if (payload.directorEmail !== undefined) {
    updates.directorEmail = requireString(payload.directorEmail, "directorEmail");
  }

  if (payload.expectedRespondents !== undefined) {
    if (payload.expectedRespondents === null) {
      updates.expectedRespondents = null;
    } else if (
      Number.isInteger(payload.expectedRespondents) &&
      Number(payload.expectedRespondents) > 0
    ) {
      updates.expectedRespondents = Number(payload.expectedRespondents);
    } else {
      throw new HttpError(
        400,
        "expectedRespondents must be a positive integer or null."
      );
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new HttpError(400, "At least one organisation field must be provided.");
  }

  return updates;
}

export function parseSendReportBody(body: unknown): { directorEmail?: string } {
  if (body === undefined || body === null) {
    return {};
  }

  const payload = asRecord(body, "Request body");

  if (payload.directorEmail === undefined) {
    return {};
  }

  return {
    directorEmail: requireString(payload.directorEmail, "directorEmail")
  };
}
