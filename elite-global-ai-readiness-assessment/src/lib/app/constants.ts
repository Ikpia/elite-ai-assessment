import type { SubmissionDraft } from "../../types";

export const RESPONDENT_STORAGE_KEY = "elite_respondent";
export const ANSWERS_STORAGE_KEY = "elite_assessment_answers";
export const ADMIN_SECRET_STORAGE_KEY = "elite_admin_secret";
export const MARKETING_SITE_URL =
  import.meta.env.VITE_MARKETING_SITE_URL || "https://eliteglobalai.com";

export const EMPTY_ENTRY_DRAFT: SubmissionDraft = {
  email: "",
  name: "",
  role: "",
  dept: "",
  orgName: "",
  consentAccepted: false
};
