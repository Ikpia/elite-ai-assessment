import {
  ANSWERS_STORAGE_KEY,
  RESPONDENT_STORAGE_KEY
} from "./constants";
import type { Organisation, SubmissionDraft } from "../../types";

export type AnswerState = Record<number, string | string[]>;

export type AdminDraftState = Record<
  string,
  {
    directorEmail: string;
    expectedRespondents: string;
  }
>;

export function clearAssessmentStorage(): void {
  localStorage.removeItem(RESPONDENT_STORAGE_KEY);
  localStorage.removeItem(ANSWERS_STORAGE_KEY);
}

export function hasAnswerValue(value: string | string[] | undefined): boolean {
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function formatDimensionLabel(key: string): string {
  return key.replace(/([A-Z])/g, " $1").trim();
}

export function getStatusBadgeClass(status: Organisation["status"]): string {
  switch (status) {
    case "sent":
      return "bg-green-50 text-green-600";
    case "approved":
      return "bg-blue-50 text-blue-600";
    case "ready":
      return "bg-amber-50 text-amber-600";
    default:
      return "bg-brand-50 text-brand-600";
  }
}

export function buildAdminDrafts(
  organisations: Organisation[]
): AdminDraftState {
  return organisations.reduce<AdminDraftState>((acc, org) => {
    acc[org.id] = {
      directorEmail: org.directorEmail || "",
      expectedRespondents:
        typeof org.expectedRespondents === "number"
          ? String(org.expectedRespondents)
          : ""
    };
    return acc;
  }, {});
}

export function isCompleteDraft(
  draft: SubmissionDraft | null
): draft is SubmissionDraft & {
  role: "c-suite" | "manager" | "ic";
  consentAccepted: true;
} {
  return Boolean(
    draft &&
      draft.email &&
      draft.name &&
      draft.role &&
      draft.dept &&
      draft.orgName &&
      draft.consentAccepted
  );
}
