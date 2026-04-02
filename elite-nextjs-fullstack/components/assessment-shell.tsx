"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Facebook,
  FileText,
  Globe,
  Instagram,
  Linkedin,
  Loader2,
  LogOut,
  Mail,
  Menu,
  Plus,
  Send,
  Trash2,
  Users,
  Youtube,
  X
} from "lucide-react";

import {
  AssessmentCompletionDetailsScreen,
  AssessmentDimensionTransitionScreen,
  AssessmentFinalResultScreen,
  AssessmentProcessingScreen,
  AssessmentQuestionScreen,
  AssessmentSplitEntryScreen,
  AssessmentWelcomeScreen,
  DirectorSetupScreen,
  type AssessmentResultSnapshot
} from "./assessment/assessment-screens";
import { PerformanceMetricDiagram, SurfaceCodeDiagram } from "@/components/diagrams";
import { SpinningGlobeScene } from "@/components/quantum-scene";
import { ApiError, buildApiUrl, type AdminAuthCredential } from "@/lib/api";
import { BACKEND_ENDPOINTS, backendApi } from "@/lib/backend";
import {
  DEFAULT_FIRM_TYPE,
  DIMENSION_LABELS,
  FIRM_TYPE_OPTIONS,
  TOTAL_QUESTIONS,
  getFirmTypeLabel,
  getQuestionsForFirmType
} from "@/lib/shared/questions";
import type {
  AssessmentCompleteResponse,
  AssessmentInvitePrefillResponse,
  FirmType,
  Organisation,
  PublicDashboardResponse,
  RoleLevel,
  SubmissionDraft
} from "@/lib/shared/types";

type AppRoute =
  | { name: "landing" }
  | { name: "dashboard" }
  | { name: "start" }
  | { name: "director-setup" }
  | { name: "assessment"; step: number }
  | { name: "assessment-details" }
  | { name: "assessment-processing" }
  | { name: "assessment-result" }
  | { name: "admin" };

type AnswerState = Record<number, string | string[]>;
type BackendStatus = "checking" | "connected" | "offline";
type AdminAccessScope = "super-admin" | "organisation-admin";
type RespondentEntryView = "split" | "welcome";
type AdminSessionAuth = AdminAuthCredential & {
  directorEmail?: string;
  accessScope?: AdminAccessScope;
};

type LastSubmissionSnapshot = AssessmentResultSnapshot;

interface DirectorEntryDraft {
  firmType: FirmType;
  orgName: string;
  email: string;
  name: string;
  dept: string;
  consentAccepted: boolean;
}

interface AdminDraft {
  orgName: string;
  directorEmail: string;
  expectedRespondents: string;
}

type AdminDraftState = Record<string, AdminDraft>;

interface CreateOrganisationDraft {
  orgName: string;
  directorEmail: string;
  firmType: FirmType;
  expectedRespondents: string;
}

interface PublicDashboardCacheEntry {
  data: PublicDashboardResponse;
  cachedAt: number;
}

const RESPONDENT_STORAGE_KEY = "elite-frontend:respondent";
const ANSWERS_STORAGE_KEY = "elite-frontend:answers";
const LAST_SUBMISSION_STORAGE_KEY = "elite-frontend:last-submission";
const ADMIN_AUTH_STORAGE_KEY = "elite-frontend:admin-auth";
const ANSWER_OWNER_STORAGE_KEY = "elite-frontend:answer-owner";
const PUBLIC_DASHBOARD_STORAGE_KEY = "elite-frontend:public-dashboard";
const ASSESSMENT_INVITE_QUERY_PARAM = "invite";
const MARKETING_SITE_URL = (
  process.env.NEXT_PUBLIC_MARKETING_SITE_URL || "https://eliteglobalai.com"
).replace(/\/$/, "");
const PUBLIC_DASHBOARD_CACHE_TTL_MS = 30_000;
const PUBLIC_DASHBOARD_PREFETCH_DELAY_MS = 1200;
const PROCESSING_SCREEN_MIN_DURATION_MS = 47_000;
const DIMENSION_TRANSITION_DURATION_MS = 3_000;
const FOOTER_SOCIALS = [
  { label: "LinkedIn", href: MARKETING_SITE_URL, icon: Linkedin },
  { label: "Instagram", href: MARKETING_SITE_URL, icon: Instagram },
  { label: "Facebook", href: MARKETING_SITE_URL, icon: Facebook },
  { label: "YouTube", href: MARKETING_SITE_URL, icon: Youtube },
  { label: "Website", href: MARKETING_SITE_URL, icon: Globe }
] as const;

const EMPTY_ENTRY_DRAFT: SubmissionDraft = {
  firmType: "",
  orgName: "",
  email: "",
  name: "",
  role: "",
  dept: "",
  phone: "",
  attribution: "",
  consentAccepted: false
};

const EMPTY_DIRECTOR_ENTRY_DRAFT: DirectorEntryDraft = {
  firmType: DEFAULT_FIRM_TYPE,
  orgName: "",
  email: "",
  name: "",
  dept: "",
  consentAccepted: false
};

const EMPTY_CREATE_ORG_DRAFT: CreateOrganisationDraft = {
  orgName: "",
  directorEmail: "",
  firmType: DEFAULT_FIRM_TYPE,
  expectedRespondents: ""
};

const ADMIN_NOTES = [
  "Elite Global AI admins can onboard each firm by assigning its admin email and organisation details.",
  "Firm admins only see their own organisation dashboard, reports, and readiness data.",
  "Generate and send the PDF report only when you are satisfied with the aggregate data."
];

const ROLE_OPTIONS: Array<{ value: RoleLevel; label: string }> = [
  { value: "c-suite", label: "C-Suite / Board" },
  { value: "director", label: "Director / VP" },
  { value: "senior-manager", label: "Senior Manager" },
  { value: "manager", label: "Manager" },
  { value: "specialist", label: "Specialist" }
];
const availableRoleOptions = ROLE_OPTIONS;
const isDirectorOnboardingFlow = false;

const ATTRIBUTION_OPTIONS = [
  "Elite Global AI website",
  "LinkedIn",
  "Email invitation",
  "Referral",
  "Event or webinar",
  "Other"
] as const;

const statusBadgeClasses: Record<Organisation["status"], string> = {
  collecting: "border-stone-200 bg-white text-stone-600",
  ready: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-blue-200 bg-blue-50 text-blue-700",
  sent: "border-emerald-200 bg-emerald-50 text-emerald-700"
};

const AuthorCard = ({ name, role, delay }: { name: string; role: string; delay: string }) => (
  <div
    className="flex w-full max-w-xs flex-col items-center rounded-xl border border-stone-200 bg-white p-8 shadow-sm transition-all duration-300 hover:border-nobel-gold/50 hover:shadow-md"
    style={{ animationDelay: delay }}
  >
    <h3 className="mb-3 text-center font-serif text-2xl text-stone-900">{name}</h3>
    <div className="mb-4 h-0.5 w-12 bg-nobel-gold opacity-60" />
    <p className="text-center text-xs font-bold uppercase tracking-widest text-stone-500">
      {role}
    </p>
  </div>
);

const SummaryCard = ({
  icon: Icon,
  label,
  value
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) => (
  <div className="rounded-[20px] border border-blue-100 bg-white px-4 py-3.5 shadow-sm">
    <div className="flex min-h-[58px] items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-[8px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
          {label}
        </p>
        <p className="font-serif text-[0.92rem] font-medium leading-[1.35] tracking-[0.01em] text-slate-900 sm:text-[0.98rem]">
          {value}
        </p>
      </div>
    </div>
  </div>
);

const InlineBanner = ({
  tone,
  message,
  onClose,
  className = ""
}: {
  tone: "success" | "error";
  message: string;
  onClose: () => void;
  className?: string;
}) => {
  const isSuccess = tone === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={`rounded-[18px] border px-4 py-3 text-[14px] shadow-[0_10px_24px_rgba(15,23,42,0.06)] sm:rounded-[22px] sm:text-[15px] ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
      } ${className}`}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 font-semibold">{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current/15 bg-white/50 text-current transition-colors hover:bg-white/80"
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

function parseRoute(pathname: string): AppRoute {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";

  if (normalizedPath === "/") {
    return { name: "landing" };
  }

  if (normalizedPath === "/start") {
    return { name: "start" };
  }

  if (normalizedPath === "/director-setup") {
    return { name: "director-setup" };
  }

  if (normalizedPath === "/dashboard") {
    return { name: "dashboard" };
  }

  if (normalizedPath === "/assessment/details") {
    return { name: "assessment-details" };
  }

  if (normalizedPath === "/assessment/processing") {
    return { name: "assessment-processing" };
  }

  if (normalizedPath === "/assessment/result") {
    return { name: "assessment-result" };
  }

  if (normalizedPath === "/admin") {
    return { name: "admin" };
  }

  const assessmentMatch = normalizedPath.match(/^\/assessment\/(\d+)$/);
  if (assessmentMatch) {
    const step = Number(assessmentMatch[1]);
    if (step >= 1 && step <= TOTAL_QUESTIONS) {
      return { name: "assessment", step };
    }
  }

  return { name: "landing" };
}

function getCurrentRoute(): AppRoute {
  if (typeof window === "undefined") {
    return { name: "landing" };
  }

  return parseRoute(window.location.pathname);
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = window.localStorage.getItem(key);
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

function removeStorage(key: string) {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(key);
  }
}

function readStoredLastSubmission(): LastSubmissionSnapshot | null {
  const stored = readStorage<
    | (Partial<LastSubmissionSnapshot> & {
        totalScore?: number;
        readinessLevel?: string;
      })
    | null
  >(LAST_SUBMISSION_STORAGE_KEY, null);

  if (!stored || typeof stored !== "object") {
    return null;
  }

  const fallbackScore =
    typeof stored.totalScore === "number" ? stored.totalScore : undefined;
  const fallbackReadinessLevel =
    typeof stored.readinessLevel === "string" ? stored.readinessLevel : undefined;
  const latestTotalScore =
    typeof stored.latestTotalScore === "number"
      ? stored.latestTotalScore
      : fallbackScore;
  const latestReadinessLevel =
    typeof stored.latestReadinessLevel === "string"
      ? stored.latestReadinessLevel
      : latestTotalScore !== undefined
        ? getReadinessLabel(latestTotalScore)
        : fallbackReadinessLevel;
  const respondentTotalScore =
    typeof stored.respondentTotalScore === "number"
      ? stored.respondentTotalScore
      : fallbackScore;
  const respondentReadinessLevel =
    typeof stored.respondentReadinessLevel === "string"
      ? stored.respondentReadinessLevel
      : respondentTotalScore !== undefined
        ? getReadinessLabel(respondentTotalScore)
        : fallbackReadinessLevel;

  if (
    typeof stored.organisationId !== "string" ||
    typeof stored.organisationKey !== "string" ||
    typeof stored.firmType !== "string" ||
    typeof stored.orgName !== "string" ||
    latestTotalScore === undefined ||
    !latestReadinessLevel ||
    respondentTotalScore === undefined ||
    !respondentReadinessLevel ||
    typeof stored.submissionCount !== "number" ||
    typeof stored.recipientEmail !== "string" ||
    typeof stored.reportViewUrl !== "string" ||
    typeof stored.generatedAt !== "string" ||
    (stored.deliveryMode !== "mock" && stored.deliveryMode !== "live")
  ) {
    return null;
  }

  return {
    organisationId: stored.organisationId,
    organisationKey: stored.organisationKey,
    firmType: stored.firmType as FirmType,
    orgName: stored.orgName,
    latestTotalScore,
    latestReadinessLevel,
    respondentTotalScore,
    respondentReadinessLevel,
    submissionCount: stored.submissionCount,
    recipientEmail: stored.recipientEmail,
    reportViewUrl: stored.reportViewUrl,
    generatedAt: stored.generatedAt,
    deliveryMode: stored.deliveryMode
  };
}

function getInitialRespondentEntryView(): RespondentEntryView {
  if (typeof window === "undefined") {
    return "split";
  }

  if (parseRoute(window.location.pathname).name !== "start") {
    return "split";
  }

  const inviteToken =
    new URL(window.location.href).searchParams.get(ASSESSMENT_INVITE_QUERY_PARAM)?.trim() || "";
  const storedDraft = readStorage<Partial<SubmissionDraft>>(RESPONDENT_STORAGE_KEY, {});

  if (inviteToken || storedDraft.orgName || storedDraft.role) {
    return "welcome";
  }

  return "split";
}

function readStoredAdminAuth(): AdminSessionAuth | null {
  if (typeof window === "undefined") {
    return null;
  }

  const structuredValue = window.sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY);

  if (structuredValue) {
    try {
      const parsed = JSON.parse(structuredValue) as Partial<AdminSessionAuth>;

      if (
        (parsed.type === "secret" || parsed.type === "token") &&
        typeof parsed.value === "string" &&
        parsed.value.trim()
      ) {
        return {
          type: parsed.type,
          value: parsed.value,
          accessScope:
            parsed.accessScope === "super-admin" || parsed.accessScope === "organisation-admin"
              ? parsed.accessScope
              : undefined,
          directorEmail:
            typeof parsed.directorEmail === "string" ? parsed.directorEmail : undefined
        };
      }
    } catch {
      window.sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    }
  }
  return null;
}

function writeStoredAdminAuth(auth: AdminSessionAuth | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!auth) {
    window.sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(auth));
}

function readPublicDashboardCacheEntry(): PublicDashboardCacheEntry | null {
  const cached = readStorage<PublicDashboardCacheEntry | null>(
    PUBLIC_DASHBOARD_STORAGE_KEY,
    null
  );

  if (!cached || typeof cached.cachedAt !== "number" || !cached.data) {
    return null;
  }

  return cached;
}

function isFreshPublicDashboardCache(cachedAt: number): boolean {
  return Date.now() - cachedAt < PUBLIC_DASHBOARD_CACHE_TTL_MS;
}

function hasAnswerValue(answer: unknown): boolean {
  if (Array.isArray(answer)) {
    return answer.length > 0;
  }

  return typeof answer === "string" && answer.trim().length > 0;
}

function isAssessmentContextReady(
  draft: SubmissionDraft
): draft is SubmissionDraft & {
  firmType: FirmType;
  role: RoleLevel;
} {
  return Boolean(draft.firmType && draft.orgName.trim() && draft.role);
}

function isCompleteDraft(
  draft: SubmissionDraft
): draft is SubmissionDraft & {
  firmType: FirmType;
  role: RoleLevel;
} {
  return isAssessmentContextReady(draft);
}

function isRespondentDetailsReady(draft: SubmissionDraft): boolean {
  return Boolean(
    draft.name.trim() &&
      draft.email.trim() &&
      draft.consentAccepted
  );
}

function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function getNextIncompleteStep(questions: Array<{ id: number }>, answers: AnswerState): number {
  const firstIncomplete = questions.findIndex((question) => !hasAnswerValue(answers[question.id]));
  return firstIncomplete === -1 ? questions.length : firstIncomplete + 1;
}

function buildAdminDrafts(organisations: Organisation[]): AdminDraftState {
  return organisations.reduce<AdminDraftState>((accumulator, organisation) => {
    accumulator[organisation.id] = {
      orgName: organisation.orgName,
      directorEmail: organisation.directorEmail || "",
      expectedRespondents: organisation.expectedRespondents
        ? String(organisation.expectedRespondents)
        : ""
    };
    return accumulator;
  }, {});
}

function getReadinessLabel(total: number): string {
  if (total <= 25) {
    return "AI Unaware";
  }
  if (total <= 50) {
    return "AI Exploring";
  }
  if (total <= 75) {
    return "AI Developing";
  }
  return "AI Proficient";
}

function formatReportDate(value: string | null): string {
  if (!value) {
    return "Not sent yet";
  }

  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatDisplayDate(value: string): string {
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatScoreValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatScoreDelta(value: number): string {
  const rounded = Number(value.toFixed(1));
  const normalized = Object.is(rounded, -0) ? 0 : rounded;
  return `${normalized > 0 ? "+" : ""}${formatScoreValue(normalized)}`;
}

function getScoreTone(total: number): {
  badge: string;
  chip: string;
  progress: string;
} {
  if (total <= 25) {
    return {
      badge: "border-red-200 bg-red-50 text-red-700",
      chip: "bg-red-500",
      progress: "from-red-400 via-red-500 to-rose-500"
    };
  }

  if (total <= 50) {
    return {
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      chip: "bg-amber-500",
      progress: "from-amber-400 via-amber-500 to-orange-500"
    };
  }

  if (total <= 75) {
    return {
      badge: "border-blue-200 bg-blue-50 text-blue-700",
      chip: "bg-blue-600",
      progress: "from-sky-400 via-blue-500 to-indigo-500"
    };
  }

  return {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    chip: "bg-emerald-500",
    progress: "from-emerald-400 via-emerald-500 to-teal-500"
  };
}

function getOrganisationInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "EG";
  }

  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
}

function getCompletionRatio(org: Organisation): number | null {
  if (!org.expectedRespondents || org.expectedRespondents <= 0) {
    return null;
  }
  return Math.min(100, (org.submissionCount / org.expectedRespondents) * 100);
}

function buildAnswerOwnerSignature(draft: SubmissionDraft): string {
  return [
    draft.firmType,
    draft.orgName.trim().toLowerCase(),
    draft.role
  ].join("|");
}

function getRoleLabel(role: RoleLevel | ""): string {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label || "";
}

export function AssessmentShell() {
  const [hasMounted, setHasMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [route, setRoute] = useState<AppRoute>(getCurrentRoute);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [backendEnvironment, setBackendEnvironment] = useState("");
  const [backendService, setBackendService] = useState("");
  const [directorForm, setDirectorForm] = useState<DirectorEntryDraft>(EMPTY_DIRECTOR_ENTRY_DRAFT);
  const [formData, setFormData] = useState<SubmissionDraft>(() => ({
    ...EMPTY_ENTRY_DRAFT,
    ...readStorage<Partial<SubmissionDraft>>(RESPONDENT_STORAGE_KEY, {})
  }));
  const [answers, setAnswers] = useState<AnswerState>(() =>
    readStorage<AnswerState>(ANSWERS_STORAGE_KEY, {})
  );
  const [lastSubmission, setLastSubmission] = useState<LastSubmissionSnapshot | null>(
    readStoredLastSubmission
  );
  const [answerOwnerSignature, setAnswerOwnerSignature] = useState(() =>
    readStorage<string>(ANSWER_OWNER_STORAGE_KEY, "")
  );
  const [respondentEntryView, setRespondentEntryView] = useState<RespondentEntryView>(
    getInitialRespondentEntryView
  );
  const [entryError, setEntryError] = useState("");
  const [entryLoading, setEntryLoading] = useState(false);
  const [entryNotice, setEntryNotice] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [drafts, setDrafts] = useState<AdminDraftState>({});
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [firmAdminEmailInput, setFirmAdminEmailInput] = useState("");
  const [createOrgDraft, setCreateOrgDraft] = useState<CreateOrganisationDraft>(
    EMPTY_CREATE_ORG_DRAFT
  );
  const [adminAuth, setAdminAuth] = useState<AdminSessionAuth | null>(() =>
    readStoredAdminAuth()
  );
  const [isAuthed, setIsAuthed] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminNotice, setAdminNotice] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [publicDashboard, setPublicDashboard] = useState<PublicDashboardResponse | null>(() =>
    readPublicDashboardCacheEntry()?.data || null
  );
  const [publicDashboardFetchedAt, setPublicDashboardFetchedAt] = useState<number | null>(() =>
    readPublicDashboardCacheEntry()?.cachedAt || null
  );
  const [publicDashboardLoading, setPublicDashboardLoading] = useState(false);
  const [publicDashboardError, setPublicDashboardError] = useState("");
  const [inviteEntryLocked, setInviteEntryLocked] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    if (parseRoute(window.location.pathname).name !== "start") {
      return false;
    }

    const inviteToken =
      new URL(window.location.href).searchParams.get(ASSESSMENT_INVITE_QUERY_PARAM)?.trim() || "";

    return Boolean(inviteToken);
  });
  const [invitePrefill, setInvitePrefill] = useState<AssessmentInvitePrefillResponse | null>(
    null
  );
  const [inviteLoading, setInviteLoading] = useState(false);
  const [dimensionTransition, setDimensionTransition] = useState<{
    completedDimension: string;
    nextDimension: string;
    observation: string;
    nextStep: number;
  } | null>(null);
  const [autoAdvanceQuestionId, setAutoAdvanceQuestionId] = useState<number | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingDimensionIndex, setProcessingDimensionIndex] = useState(0);
  const assessmentViewportRef = useRef<HTMLDivElement | null>(null);
  const assessmentContentRef = useRef<HTMLDivElement | null>(null);
  const [assessmentScale, setAssessmentScale] = useState(1);
  const [assessmentScaledHeight, setAssessmentScaledHeight] = useState<number | null>(null);
  const autoAdvanceTimeoutRef = useRef<number | null>(null);

  const activeQuestions = useMemo(
    () => getQuestionsForFirmType(formData.firmType || DEFAULT_FIRM_TYPE),
    [formData.firmType]
  );
  const activeFirmTypeLabel = getFirmTypeLabel(formData.firmType);
  const totalSteps = activeQuestions.length;
  const currentStep = route.name === "assessment" ? route.step : 1;
  const question = route.name === "assessment" ? activeQuestions[currentStep - 1] : null;
  const answeredCount = useMemo(
    () => activeQuestions.filter((item) => hasAnswerValue(answers[item.id])).length,
    [activeQuestions, answers]
  );
  const currentAnswer = question ? answers[question.id] : undefined;
  const currentQuestionAnswered = hasAnswerValue(currentAnswer);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current !== null) {
        window.clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);
  const currentDimensionQuestions = question
    ? activeQuestions.filter((item) => item.dimension === question.dimension)
    : [];
  const currentDimensionIndex = question
    ? currentDimensionQuestions.findIndex((item) => item.id === question.id)
    : -1;
  const apiHealthUrl = buildApiUrl(BACKEND_ENDPOINTS.health.check);
  const isLandingRoute = route.name === "landing";
  const isStandaloneAssessmentRoute = route.name === "assessment";
  const isRespondentAssessmentModalRoute =
    route.name === "assessment-details" ||
    route.name === "assessment-processing" ||
    route.name === "assessment-result";
  const isRespondentAssessmentRoute =
    isStandaloneAssessmentRoute || isRespondentAssessmentModalRoute;
  const isAssessmentModalRoute =
    isRespondentAssessmentModalRoute || route.name === "start" || route.name === "director-setup";
  const isAssessmentExperienceRoute = isStandaloneAssessmentRoute || isAssessmentModalRoute;
  const showLandingBackdrop = isLandingRoute || isAssessmentModalRoute;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handlePopState = () => setRoute(getCurrentRoute());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncViewportMode = () => setIsMobileViewport(mediaQuery.matches);

    syncViewportMode();
    mediaQuery.addEventListener("change", syncViewportMode);

    return () => {
      mediaQuery.removeEventListener("change", syncViewportMode);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    if (menuOpen || isAssessmentModalRoute) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen, isAssessmentModalRoute]);

  useEffect(() => {
    if (!entryNotice) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setEntryNotice("");
    }, 3000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [entryNotice]);

  useEffect(() => {
    if (!adminNotice) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setAdminNotice("");
    }, 3000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [adminNotice]);

  useEffect(() => {
    let active = true;
    backendApi.health
      .check()
      .then((response) => {
        if (!active) {
          return;
        }
        setBackendStatus("connected");
        setBackendEnvironment(response.environment);
        setBackendService(response.service);
      })
      .catch(() => {
        if (active) {
          setBackendStatus("offline");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => writeStorage(RESPONDENT_STORAGE_KEY, formData), [formData]);
  useEffect(() => writeStorage(ANSWERS_STORAGE_KEY, answers), [answers]);

  useEffect(() => {
    if (lastSubmission) {
      writeStorage(LAST_SUBMISSION_STORAGE_KEY, lastSubmission);
    } else {
      removeStorage(LAST_SUBMISSION_STORAGE_KEY);
    }
  }, [lastSubmission]);

  useEffect(() => {
    if (answerOwnerSignature) {
      writeStorage(ANSWER_OWNER_STORAGE_KEY, answerOwnerSignature);
    } else {
      removeStorage(ANSWER_OWNER_STORAGE_KEY);
    }
  }, [answerOwnerSignature]);

  useEffect(() => {
    writeStoredAdminAuth(adminAuth);
  }, [adminAuth]);

  useEffect(() => {
    if (
      (route.name === "assessment" ||
        route.name === "assessment-details" ||
        route.name === "assessment-processing") &&
      !isAssessmentContextReady(formData)
    ) {
      navigate("/start", true);
    }
  }, [route, formData]);

  useEffect(() => {
    if (route.name !== "admin" || isAuthed || !adminAuth) {
      return;
    }

    void fetchOrgs(adminAuth);
  }, [route, adminAuth, isAuthed]);

  useEffect(() => {
    if (typeof window === "undefined" || route.name !== "admin") {
      return;
    }

    const url = new URL(window.location.href);
    const accessToken = url.searchParams.get("admin_access")?.trim() || "";

    if (!accessToken) {
      return;
    }

    url.searchParams.delete("admin_access");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    setAdminAuth({ type: "token", value: accessToken });
    setIsAuthed(false);
    setAdminError("");
    setAdminNotice("Admin access granted. Loading dashboard.");
  }, [route]);

  useEffect(() => {
    if (typeof window === "undefined" || route.name !== "start") {
      setInviteEntryLocked(false);
      return;
    }

    const url = new URL(window.location.href);
    const inviteToken =
      url.searchParams.get(ASSESSMENT_INVITE_QUERY_PARAM)?.trim() || "";

    if (!inviteToken) {
      setInviteEntryLocked(false);
      setInvitePrefill(null);
      return;
    }

    let active = true;
    setInviteEntryLocked(true);
    setInviteLoading(true);

    backendApi.assessment
      .invite(inviteToken)
      .then((prefill) => {
        if (!active) {
          return;
        }

        setRespondentEntryView("welcome");
        setInvitePrefill(prefill);
        setEntryError("");
        setFormData((current) => ({
          ...current,
          firmType: prefill.firmType,
          orgName: prefill.orgName,
          email: "",
          name: "",
          role: "",
          dept: "",
          phone: "",
          attribution: "",
          consentAccepted: false
        }));
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setEntryError(
          getErrorMessage(error, "Unable to load this firm assessment link.")
        );
      })
      .finally(() => {
        if (active) {
          setInviteLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [route]);

  useEffect(() => {
    if (route.name === "dashboard") {
      const hasFreshState =
        publicDashboardFetchedAt !== null &&
        isFreshPublicDashboardCache(publicDashboardFetchedAt);

      void fetchPublicDashboard({
        background: hasFreshState || Boolean(publicDashboard),
        force: !hasFreshState
      });
      return;
    }

    if (
      publicDashboardFetchedAt !== null &&
      isFreshPublicDashboardCache(publicDashboardFetchedAt)
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      void fetchPublicDashboard({ background: true });
    }, PUBLIC_DASHBOARD_PREFETCH_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [route.name, publicDashboard, publicDashboardFetchedAt]);

  useEffect(() => {
    if (route.name !== "assessment-processing") {
      setProcessingProgress(0);
      setProcessingDimensionIndex(0);
      return;
    }

    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(100, (elapsed / PROCESSING_SCREEN_MIN_DURATION_MS) * 100);
      const nextIndex = Math.min(
        4,
        Math.floor((elapsed / PROCESSING_SCREEN_MIN_DURATION_MS) * 5)
      );

      setProcessingProgress(progress);
      setProcessingDimensionIndex(nextIndex);
    }, 120);

    return () => window.clearInterval(interval);
  }, [route]);

  useEffect(() => {
    if (!dimensionTransition) {
      return;
    }

    const timer = window.setTimeout(() => {
      const nextStep = dimensionTransition.nextStep;
      setDimensionTransition(null);
      navigate(`/assessment/${nextStep}`);
    }, DIMENSION_TRANSITION_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [dimensionTransition]);

  useEffect(() => {
    if (route.name !== "assessment") {
      setAssessmentScale(1);
      setAssessmentScaledHeight(null);
      return;
    }

    let frame = 0;
    const updateAssessmentFit = () => {
      if (isMobileViewport) {
        setAssessmentScale(1);
        setAssessmentScaledHeight(null);
        return;
      }

      frame = window.requestAnimationFrame(() => {
        const viewport = assessmentViewportRef.current;
        const content = assessmentContentRef.current;
        if (!viewport || !content) {
          return;
        }

        const viewportTop = viewport.getBoundingClientRect().top;
        const availableHeight = Math.max(window.innerHeight - viewportTop - 12, 320);
        const naturalHeight = Math.ceil(content.scrollHeight);

        if (!naturalHeight) {
          return;
        }

        const nextScale = Math.min(1, Math.max(0.7, availableHeight / naturalHeight));
        const nextScaledHeight = Math.ceil(naturalHeight * nextScale);

        setAssessmentScale((current) =>
          Math.abs(current - nextScale) < 0.01 ? current : nextScale
        );
        setAssessmentScaledHeight((current) =>
          current === nextScaledHeight ? current : nextScaledHeight
        );
      });
    };

    updateAssessmentFit();
    window.addEventListener("resize", updateAssessmentFit);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateAssessmentFit);
    };
  }, [route, currentStep, currentQuestionAnswered, submissionError, isMobileViewport]);

  const totalSubmissions = orgs.reduce((total, organisation) => total + organisation.submissionCount, 0);
  const reportsSent = orgs.filter((organisation) => organisation.status === "sent").length;
  const averageScore = orgs.length
    ? orgs.reduce((total, organisation) => total + organisation.aggregatedScores.total, 0) /
      orgs.length
    : 0;
  const isSuperAdmin = adminAuth?.accessScope === "super-admin";
  const isInviteEntryFlow = inviteEntryLocked || inviteLoading || Boolean(invitePrefill);
  const isLandingSurface =
    isLandingRoute ||
    (route.name === "start" && respondentEntryView === "split" && !isInviteEntryFlow);
  const activeDimensionLabel = question?.dimension || "";

  const getQuestionScore = (questionId: number, value: string | string[] | undefined): number => {
    const matchingQuestion = activeQuestions.find((item) => item.id === questionId);

    if (!matchingQuestion || value === undefined) {
      return 0;
    }

    if (matchingQuestion.multiSelect) {
      if (!Array.isArray(value) || value.length === 0) {
        return 0;
      }

      if (value.includes("none-of-the-above")) {
        return 0;
      }

      if (value.length <= 2) {
        return 1;
      }

      if (value.length <= 4) {
        return 2;
      }

      return 4;
    }

    if (typeof value !== "string") {
      return 0;
    }

    return matchingQuestion.options.find((option) => option.value === value)?.score || 0;
  };

  const buildDimensionObservation = (dimensionQuestions: typeof activeQuestions): string => {
    const currentScore = dimensionQuestions.reduce(
      (total, item) => total + getQuestionScore(item.id, answers[item.id]),
      0
    );
    const maxScore = dimensionQuestions.length * 4;
    const completionRatio = maxScore ? currentScore / maxScore : 0;

    if (completionRatio <= 0.35) {
      return "your responses indicate foundational capability gaps that should be addressed before AI use is scaled further.";
    }

    if (completionRatio <= 0.6) {
      return "your organisation shows early momentum, but capability is still inconsistent across the dimension you just completed.";
    }

    if (completionRatio <= 0.8) {
      return "your organisation is demonstrating meaningful progress, with clear opportunities to improve repeatability and leadership confidence.";
    }

    return "your organisation is already showing strong capability signals, with the next opportunity being sharper strategic and operational advantage.";
  };

  const openQuestionStep = (step: number) => {
    const previousQuestion = activeQuestions[step - 2];
    const nextQuestion = activeQuestions[step - 1];

    if (
      previousQuestion &&
      nextQuestion &&
      previousQuestion.dimension !== nextQuestion.dimension
    ) {
      const completedDimensionQuestions = activeQuestions.filter(
        (item) => item.dimension === previousQuestion.dimension
      );

      setDimensionTransition({
        completedDimension: previousQuestion.dimension,
        nextDimension: nextQuestion.dimension,
        observation: buildDimensionObservation(completedDimensionQuestions),
        nextStep: step
      });
      return;
    }

    navigate(`/assessment/${step}`);
  };

  const openAssessmentEntry = () => {
    setEntryError("");
    setEntryNotice("");
    setRespondentEntryView("split");
    navigate("/start");
  };

  const openRespondentWelcome = () => {
    setEntryError("");
    setEntryNotice("");
    setRespondentEntryView("welcome");
    navigate("/start");
  };

  function navigate(path: string, replace = false) {
    if (typeof window === "undefined") {
      return;
    }

    setMenuOpen(false);

    const currentLocation = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (replace) {
      window.history.replaceState({}, "", path);
    } else if (currentLocation !== path) {
      window.history.pushState({}, "", path);
    }

    setRoute(parseRoute(path));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function scrollToSection(id: string) {
    const element = document.getElementById(id);
    if (!element) {
      return;
    }
    const headerOffset = 100;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
  }

  const goToSection = (id: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    setMenuOpen(false);

    if (route.name !== "landing") {
      navigate("/");
      window.setTimeout(() => scrollToSection(id), 120);
      return;
    }

    scrollToSection(id);
  };

  const handleStartModalCancel = () => {
    setRespondentEntryView("split");
    setEntryError("");
    setEntryNotice("");
    setSubmissionError("");
    setDimensionTransition(null);

    if (isInviteEntryFlow) {
      setInviteEntryLocked(false);
      setInvitePrefill(null);
      setInviteLoading(false);
    }

    navigate("/");
  };

  const updateDirectorField = <K extends keyof DirectorEntryDraft>(
    key: K,
    value: DirectorEntryDraft[K]
  ) => {
    if (key === "email") {
      setEntryNotice("");
    }

    if (entryError) {
      setEntryError("");
    }

    setDirectorForm((current) => ({ ...current, [key]: value }));
  };

  const updateFormField = <K extends keyof SubmissionDraft>(key: K, value: SubmissionDraft[K]) => {
    if (key === "email") {
      setEntryNotice("");
    }
    if (entryError) {
      setEntryError("");
    }
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const validateEmailInput = async (
    emailToValidate: string,
    onValidated?: (normalizedEmail: string) => void
  ) => {
    if (!emailToValidate.trim()) {
      return null;
    }

    setEntryLoading(true);
    setEntryError("");

    try {
      const result = await backendApi.assessment.validateEmail(emailToValidate);
      if (!result.valid || !result.normalizedEmail) {
        setEntryNotice("");
        setEntryError(result.reason || "Please use a valid email address.");
        return null;
      }
      onValidated?.(result.normalizedEmail);
      setEntryNotice("Email validated successfully.");
      return result;
    } catch (error) {
      setEntryError(getErrorMessage(error, "Connection error. Please try again."));
      return null;
    } finally {
      setEntryLoading(false);
    }
  };

  const handleDirectorOnboarding = async (normalizedEmail: string) => {
    const response = await backendApi.assessment.directorOnboard({
      firmType: directorForm.firmType,
      orgName: directorForm.orgName,
      directorEmail: normalizedEmail,
      directorName: directorForm.name,
      directorDept: directorForm.dept,
      consentAccepted: true
    });

    if (response.deliveryMode === "mock") {
      try {
        await navigator.clipboard.writeText(response.shareUrl);
        setEntryNotice(
          "Director onboarding submitted. The team assessment link has been copied to your clipboard for local testing."
        );
      } catch {
        setEntryNotice(
          `Director onboarding submitted. Share this link with your team: ${response.shareUrl}`
        );
      }
    } else {
      setEntryNotice(
        "Director onboarding submitted. Check your email for the team assessment link and your firm admin access."
      );
    }

    setDirectorForm(EMPTY_DIRECTOR_ENTRY_DRAFT);
    setAnswers({});
    setAnswerOwnerSignature("");
  };

  const handleDirectorSetupSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEntryError("");
    setEntryNotice("");

    if (!directorForm.name.trim()) {
      setEntryError("Full name is required.");
      return;
    }
    if (!directorForm.orgName.trim()) {
      setEntryError("Organisation name is required.");
      return;
    }
    if (!directorForm.dept.trim()) {
      setEntryError("Department is required.");
      return;
    }
    if (!directorForm.consentAccepted) {
      setEntryError("You must accept the consent statement before continuing.");
      return;
    }

    const validation = await validateEmailInput(directorForm.email, (normalizedEmail) => {
      updateDirectorField("email", normalizedEmail);
    });
    if (!validation?.normalizedEmail) {
      return;
    }

    setEntryLoading(true);
    try {
      await handleDirectorOnboarding(validation.normalizedEmail);
    } catch (error) {
      setEntryError(
        getErrorMessage(error, "Unable to submit the director onboarding form.")
      );
    } finally {
      setEntryLoading(false);
    }
  };

  const handleStartAssessment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEntryError("");
    setEntryNotice("");

    if (!formData.orgName.trim()) {
      setEntryError("Organisation name is required.");
      return;
    }

    if (!formData.role) {
      setEntryError("Select your role before continuing.");
      return;
    }

    setEntryLoading(true);

    try {
      const resolvedOrganisation = invitePrefill
        ? {
            organisationId: invitePrefill.organisationId,
            organisationKey: invitePrefill.organisationKey,
            firmType: invitePrefill.firmType,
            orgName: invitePrefill.orgName
          }
        : await backendApi.assessment.resolveOrganisation(formData.orgName);

      const nextDraft: SubmissionDraft = {
        ...formData,
        firmType: resolvedOrganisation.firmType,
        orgName: resolvedOrganisation.orgName,
        email: "",
        name: "",
        dept: "",
        phone: "",
        attribution: "",
        consentAccepted: false
      };
    const nextOwnerSignature = buildAnswerOwnerSignature(nextDraft);
    const shouldResetAnswers =
      Boolean(answerOwnerSignature) &&
      answerOwnerSignature !== nextOwnerSignature &&
      Object.keys(answers).length > 0;

    if (shouldResetAnswers) {
      setAnswers({});
    }

      setFormData(nextDraft);
      setAnswerOwnerSignature(nextOwnerSignature);
      navigate(
        `/assessment/${
          shouldResetAnswers ? 1 : getNextIncompleteStep(getQuestionsForFirmType(nextDraft.firmType), answers)
        }`
      );
    } catch (error) {
      setEntryError(
        getErrorMessage(
          error,
          "We couldn't find that organisation yet. Ask your director to set up your team first."
        )
      );
    } finally {
      setEntryLoading(false);
    }
  };

  const handleSelect = (value: string) => {
    if (!question) {
      return;
    }

    setSubmissionError("");
    if (autoAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    setAutoAdvanceQuestionId(question.multiSelect ? null : question.id);

    setAnswers((currentAnswers) => {
      const existing = currentAnswers[question.id];

      if (question.multiSelect) {
        const existingValues = Array.isArray(existing) ? existing : [];
        let nextValues: string[];

        if (value === "none-of-the-above") {
          nextValues = ["none-of-the-above"];
        } else if (existingValues.includes(value)) {
          nextValues = existingValues.filter((option) => option !== value);
        } else {
          nextValues = [
            ...existingValues.filter((option) => option !== "none-of-the-above"),
            value
          ];
        }

        return { ...currentAnswers, [question.id]: nextValues };
      }

      return { ...currentAnswers, [question.id]: value };
    });
  };

  const clearAssessmentStorage = () => {
    removeStorage(RESPONDENT_STORAGE_KEY);
    removeStorage(ANSWERS_STORAGE_KEY);
    removeStorage(ANSWER_OWNER_STORAGE_KEY);
    setFormData(EMPTY_ENTRY_DRAFT);
    setAnswers({});
    setAnswerOwnerSignature("");
    setInvitePrefill(null);
    setInviteEntryLocked(false);
    setRespondentEntryView("split");
  };

  const handleFinish = async () => {
    if (!isAssessmentContextReady(formData)) {
      openAssessmentEntry();
      return;
    }

    const missingQuestion = activeQuestions.find((item) => !hasAnswerValue(answers[item.id]));
    if (missingQuestion) {
      setSubmissionError("Please answer every question before submitting.");
      navigate(`/assessment/${missingQuestion.id}`);
      return;
    }

    setSubmissionError("");
    navigate("/assessment/details");
  };

  useEffect(() => {
    if (
      route.name !== "assessment" ||
      !question ||
      question.multiSelect ||
      autoAdvanceQuestionId !== question.id ||
      !hasAnswerValue(currentAnswer)
    ) {
      return;
    }

    if (autoAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(autoAdvanceTimeoutRef.current);
    }

    autoAdvanceTimeoutRef.current = window.setTimeout(() => {
      setAutoAdvanceQuestionId(null);

      if (currentStep < totalSteps) {
        openQuestionStep(currentStep + 1);
        return;
      }

      void handleFinish();
    }, 180);

    return () => {
      if (autoAdvanceTimeoutRef.current !== null) {
        window.clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }
    };
  }, [
    autoAdvanceQuestionId,
    currentAnswer,
    currentStep,
    handleFinish,
    openQuestionStep,
    question,
    route.name,
    totalSteps
  ]);

  const handleGenerateReport = async () => {
    if (!isAssessmentContextReady(formData)) {
      openAssessmentEntry();
      return;
    }

    const missingQuestion = activeQuestions.find((item) => !hasAnswerValue(answers[item.id]));
    if (missingQuestion) {
      setSubmissionError("Please answer every question before generating the report.");
      navigate(`/assessment/${missingQuestion.id}`);
      return;
    }

    if (!formData.name.trim()) {
      setSubmissionError("Full name is required.");
      return;
    }

    if (!formData.email.trim()) {
      setSubmissionError("Work email address is required.");
      return;
    }

    const emailValidation = await backendApi.assessment.validateEmail(formData.email);
    if (!emailValidation.valid || !emailValidation.normalizedEmail) {
      setSubmissionError(emailValidation.reason || "Please use a valid work email address.");
      return;
    }

    if (emailValidation.normalizedEmail !== formData.email) {
      setFormData((current) => ({ ...current, email: emailValidation.normalizedEmail! }));
    }

    if (!formData.consentAccepted) {
      setSubmissionError("Please confirm the privacy statement before continuing.");
      return;
    }

    setIsSubmitting(true);
    setSubmissionError("");
    navigate("/assessment/processing");

    try {
      const completionPromise = backendApi.assessment.submit({
        firmType: formData.firmType,
        orgName: formData.orgName,
        respondentEmail: emailValidation.normalizedEmail,
        respondentName: formData.name,
        respondentRole: formData.role,
        respondentDept: formData.dept || null,
        respondentPhone: formData.phone || null,
        attributionSource: formData.attribution || null,
        consentAccepted: true,
        answers: activeQuestions.map((item) => ({
          questionId: item.id,
          value: answers[item.id]
        }))
      });
      const minimumProcessingDelay = new Promise<void>((resolve) => {
        window.setTimeout(resolve, PROCESSING_SCREEN_MIN_DURATION_MS);
      });
      const [response] = (await Promise.all([
        completionPromise,
        minimumProcessingDelay
      ])) as [AssessmentCompleteResponse, void];

      setLastSubmission({
        organisationId: response.organisationId,
        organisationKey: response.organisationKey,
        firmType: response.firmType,
        orgName: formData.orgName,
        latestTotalScore: response.organisationStatus.aggregatedScores.total,
        latestReadinessLevel: getReadinessLabel(
          response.organisationStatus.aggregatedScores.total
        ),
        respondentTotalScore: response.respondentScore.totalScore,
        respondentReadinessLevel: response.respondentScore.readinessLevel,
        submissionCount: response.organisationStatus.submissionCount,
        recipientEmail: response.reportDelivery.recipientEmail,
        reportViewUrl: response.reportDelivery.viewUrl,
        generatedAt: response.reportDelivery.generatedAt,
        deliveryMode: response.reportDelivery.deliveryMode
      });

      removeStorage(PUBLIC_DASHBOARD_STORAGE_KEY);
      setPublicDashboard(null);
      setPublicDashboardFetchedAt(null);
      clearAssessmentStorage();
      navigate("/assessment/result");
    } catch (error) {
      navigate("/assessment/details", true);
      setSubmissionError(getErrorMessage(error, "Failed to submit. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchOrgs = async (providedAuth = adminAuth) => {
    if (!providedAuth || !providedAuth.value.trim()) {
      setAdminError("Enter an admin email to access the dashboard.");
      setAdminLoading(false);
      return;
    }

    setAdminLoading(true);
    setAdminError("");

    try {
      const data = await backendApi.admin.organisations.list(providedAuth);
      const resolvedAuth: AdminSessionAuth = {
        ...providedAuth,
        accessScope: data.accessScope,
        directorEmail:
          data.accessScope === "organisation-admin"
            ? data.directorEmail || providedAuth.directorEmail
            : undefined
      };
      setOrgs(data.organisations);
      setDrafts(buildAdminDrafts(data.organisations));
      setIsAuthed(true);
      setAdminAuth(resolvedAuth);
    } catch (error) {
      setIsAuthed(false);
      setAdminAuth(null);
      setAdminError(getErrorMessage(error, "Unable to access the admin dashboard."));
    } finally {
      setAdminLoading(false);
    }
  };

  const loginAdminByEmail = async () => {
    const email = firmAdminEmailInput.trim();

    if (!email) {
      setAdminError("Enter an admin email.");
      return;
    }

    setAdminLoginLoading(true);
    setAdminError("");
    setAdminNotice("");

    try {
      const response = await backendApi.admin.access.request(email);
      await fetchOrgs({
        type: "token",
        value: response.sessionToken,
        accessScope: response.accessScope,
        directorEmail:
          response.accessScope === "organisation-admin" ? response.email : undefined
      });
      setFirmAdminEmailInput(response.email);
      setAdminNotice(
        response.accessScope === "super-admin"
          ? "Elite Global AI admin access granted."
          : `Firm admin access granted for ${response.email}.`
      );
    } catch (error) {
      setAdminError(getErrorMessage(error, "Unable to access the admin dashboard."));
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const applyPublicDashboardSnapshot = (
    snapshot: PublicDashboardResponse,
    cachedAt = Date.now()
  ) => {
    setPublicDashboard(snapshot);
    setPublicDashboardFetchedAt(cachedAt);
    setPublicDashboardError("");
    writeStorage(PUBLIC_DASHBOARD_STORAGE_KEY, {
      data: snapshot,
      cachedAt
    } satisfies PublicDashboardCacheEntry);
  };

  const fetchPublicDashboard = async (
    options: { background?: boolean; force?: boolean } = {}
  ) => {
    const { background = false, force = false } = options;
    const cachedEntry = !force ? readPublicDashboardCacheEntry() : null;
    const hasExistingSnapshot = Boolean(publicDashboard || cachedEntry);
    const hasFreshState =
      !force &&
      publicDashboard &&
      publicDashboardFetchedAt !== null &&
      isFreshPublicDashboardCache(publicDashboardFetchedAt);

    if (hasFreshState) {
      return publicDashboard;
    }

    if (cachedEntry) {
      applyPublicDashboardSnapshot(cachedEntry.data, cachedEntry.cachedAt);

      if (!force && isFreshPublicDashboardCache(cachedEntry.cachedAt)) {
        return cachedEntry.data;
      }
    }

    if (!background || !hasExistingSnapshot) {
      setPublicDashboardLoading(true);
    }
    setPublicDashboardError("");

    try {
      const data = await backendApi.public.dashboard();
      applyPublicDashboardSnapshot(data);
      return data;
    } catch (error) {
      if (!background || !hasExistingSnapshot) {
        setPublicDashboardError(
          getErrorMessage(error, "Unable to load the public dashboard right now.")
        );
      }
      return null;
    } finally {
      setPublicDashboardLoading(false);
    }
  };

  const updateDraft = (organisationId: string, field: keyof AdminDraft, value: string) => {
    setDrafts((current) => ({
      ...current,
      [organisationId]: { ...current[organisationId], [field]: value }
    }));
  };

  const saveOrganisation = async (organisationId: string) => {
    const draft = drafts[organisationId];
    if (!draft) {
      return null;
    }

    const payload: {
      orgName?: string;
      directorEmail?: string;
      expectedRespondents?: number | null;
    } = {};

    const orgName = draft.orgName.trim();
    const directorEmail = draft.directorEmail.trim();
    const expectedRespondents = draft.expectedRespondents.trim();

    if (orgName) {
      payload.orgName = orgName;
    }
    if (directorEmail) {
      payload.directorEmail = directorEmail;
    }
    if (expectedRespondents) {
      const numericValue = Number(expectedRespondents);
      if (!Number.isInteger(numericValue) || numericValue <= 0) {
        throw new Error("Expected respondents must be a positive whole number.");
      }
      payload.expectedRespondents = numericValue;
    } else {
      payload.expectedRespondents = null;
    }

    if (!adminAuth) {
      throw new Error("Admin authentication is required.");
    }

    const response = await backendApi.admin.organisations.update(adminAuth, organisationId, payload);
    setDrafts((current) => ({
      ...current,
      [organisationId]: {
        orgName: response.organisation.orgName,
        directorEmail: response.organisation.directorEmail || "",
        expectedRespondents: response.organisation.expectedRespondents
          ? String(response.organisation.expectedRespondents)
          : ""
      }
    }));

    return response.organisation;
  };

  const handleSaveOrg = async (organisationId: string) => {
    setBusyKey(`save-${organisationId}`);
    setAdminError("");
    setAdminNotice("");
    try {
      const organisation = await saveOrganisation(organisationId);
      await fetchOrgs(adminAuth);
      if (organisation) {
        setAdminNotice(`Saved settings for ${organisation.orgName}.`);
      }
    } catch (error) {
      setAdminError(getErrorMessage(error, "Failed to update organisation."));
    } finally {
      setBusyKey(null);
    }
  };

  const handlePreviewReport = async (organisationId: string) => {
    setBusyKey(`preview-${organisationId}`);
    setAdminError("");
    setAdminNotice("");
    const previewWindow = window.open("", "_blank", "noopener,noreferrer");

    try {
      const organisation = await saveOrganisation(organisationId);
      if (!adminAuth) {
        throw new Error("Admin authentication is required.");
      }

      const blob = await backendApi.report.generate(adminAuth, organisationId);
      const previewUrl = URL.createObjectURL(blob);

      if (previewWindow && !previewWindow.closed) {
        previewWindow.location.href = previewUrl;
      } else {
        const link = document.createElement("a");
        link.href = previewUrl;
        link.download = `${organisation?.organisationKey || "organisation-report"}.pdf`;
        link.click();
      }

      window.setTimeout(() => URL.revokeObjectURL(previewUrl), 60000);
      await fetchOrgs(adminAuth);
      setAdminNotice(`Generated preview for ${organisation?.orgName || "organisation"}.`);
    } catch (error) {
      if (previewWindow && !previewWindow.closed) {
        previewWindow.close();
      }
      setAdminError(getErrorMessage(error, "Failed to generate preview."));
    } finally {
      setBusyKey(null);
    }
  };

  const handleSendReport = async (organisationId: string) => {
    setBusyKey(`send-${organisationId}`);
    setAdminError("");
    setAdminNotice("");

    try {
      const organisation = await saveOrganisation(organisationId);
      const directorEmail = drafts[organisationId]?.directorEmail.trim();
      if (!adminAuth) {
        throw new Error("Admin authentication is required.");
      }

      const response = await backendApi.report.send(
        adminAuth,
        organisationId,
        directorEmail ? { directorEmail } : undefined
      );
      await fetchOrgs(adminAuth);
      setAdminNotice(`Report processed for ${response.directorEmail} (${response.deliveryMode} mode).`);
      if (organisation) {
        setDrafts((current) => ({
          ...current,
          [organisationId]: {
            orgName: organisation.orgName,
            directorEmail: response.directorEmail,
            expectedRespondents: current[organisationId]?.expectedRespondents || ""
          }
        }));
      }
    } catch (error) {
      setAdminError(getErrorMessage(error, "Failed to send report."));
    } finally {
      setBusyKey(null);
    }
  };

  const handleCreateOrganisation = async () => {
    const orgName = createOrgDraft.orgName.trim();
    const directorEmail = createOrgDraft.directorEmail.trim();
    const expectedRespondents = createOrgDraft.expectedRespondents.trim();

    if (!orgName || !directorEmail) {
      setAdminError("Enter both the firm name and firm admin email.");
      return;
    }

    if (!adminAuth) {
      setAdminError("Admin authentication is required.");
      return;
    }

    setBusyKey("create-organisation");
    setAdminError("");
    setAdminNotice("");

    try {
      const payload: {
        orgName: string;
        directorEmail: string;
        firmType: FirmType;
        expectedRespondents?: number | null;
      } = {
        orgName,
        directorEmail,
        firmType: createOrgDraft.firmType
      };

      if (expectedRespondents) {
        const numericValue = Number(expectedRespondents);

        if (!Number.isInteger(numericValue) || numericValue <= 0) {
          throw new Error("Expected respondents must be a positive whole number.");
        }

        payload.expectedRespondents = numericValue;
      } else {
        payload.expectedRespondents = null;
      }

      const response = await backendApi.admin.organisations.create(adminAuth, payload);
      setCreateOrgDraft(EMPTY_CREATE_ORG_DRAFT);
      await fetchOrgs(adminAuth);
      setAdminNotice(`Firm admin created for ${response.organisation.orgName}.`);
    } catch (error) {
      setAdminError(getErrorMessage(error, "Failed to create the firm admin."));
    } finally {
      setBusyKey(null);
    }
  };

  const handleDeleteOrganisation = async (organisationId: string, orgName: string) => {
    if (!adminAuth) {
      setAdminError("Admin authentication is required.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${orgName} and all submission data for this firm? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setBusyKey(`delete-${organisationId}`);
    setAdminError("");
    setAdminNotice("");

    try {
      const response = await backendApi.admin.organisations.delete(adminAuth, organisationId);
      await fetchOrgs(adminAuth);
      setAdminNotice(response.message);
    } catch (error) {
      setAdminError(getErrorMessage(error, "Failed to delete the firm."));
    } finally {
      setBusyKey(null);
    }
  };

  const handleLogout = () => {
    writeStoredAdminAuth(null);
    setAdminAuth(null);
    setFirmAdminEmailInput("");
    setCreateOrgDraft(EMPTY_CREATE_ORG_DRAFT);
    setIsAuthed(false);
    setOrgs([]);
    setDrafts({});
    setAdminError("");
    setAdminNotice("");
  };

  const isPrimaryRouteActive = (
    key: "home" | "dashboard" | "assessment" | "director-setup"
  ) => {
    if (key === "home") {
      return isLandingSurface;
    }

    if (key === "dashboard") {
      return route.name === "dashboard";
    }

    if (key === "assessment") {
      return (
        route.name === "start" ||
        route.name === "assessment" ||
        route.name === "assessment-details" ||
        route.name === "assessment-processing" ||
        route.name === "assessment-result"
      );
    }

    return route.name === "director-setup";
  };

  const primaryNavItems = [
    {
      key: "home" as const,
      label: "Home",
      description: "Return to the landing page",
      action: () => navigate("/")
    },
    {
      key: "dashboard" as const,
      label: "Dashboard",
      description: "View public benchmark results",
      action: () => navigate("/dashboard")
    },
    {
      key: "assessment" as const,
      label: "Take the Assessment",
      description: "Open the respondent assessment flow",
      action: openAssessmentEntry
    },
    {
      key: "director-setup" as const,
      label: "Director Setup",
      description: "Create the firm and invite your team",
      action: () => navigate("/director-setup")
    }
  ].filter((item) => !isPrimaryRouteActive(item.key));

  const renderTopNav = () => {
    const sharedButtonClasses =
      "rounded-full bg-stone-900 px-5 py-2 text-white shadow-sm transition-colors hover:bg-stone-800";

    if (isLandingSurface) {
      return (
        <>
          <div className="hidden items-center gap-8 text-sm font-medium tracking-wide text-stone-600 md:flex">
            <a href="#introduction" onClick={goToSection("introduction")} className="cursor-pointer uppercase">
              Overview
            </a>
            <a href="#science" onClick={goToSection("science")} className="cursor-pointer uppercase">
              Assessment
            </a>
            <a href="#authors" onClick={goToSection("authors")} className="cursor-pointer uppercase">
              Users
            </a>
            <button onClick={() => navigate("/dashboard")} className="uppercase">
              Dashboard
            </button>
            <button onClick={openAssessmentEntry} className={sharedButtonClasses}>
              Start Assessment
            </button>
          </div>
          <button className="p-2 md:hidden" onClick={() => setMenuOpen((current) => !current)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </>
      );
    }

    if (isRespondentAssessmentRoute) {
      return (
        <>
          <div className="hidden items-center gap-3 text-sm font-medium tracking-wide text-stone-600 md:flex">
            <span className="rounded-full border border-blue-100 bg-white px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">
              {route.name === "assessment"
                ? `Question ${route.step} of ${totalSteps}`
                : route.name === "assessment-details"
                  ? "Final details"
                  : route.name === "assessment-processing"
                    ? "Generating report"
                    : "Report ready"}
            </span>
            <button
              onClick={openRespondentWelcome}
              className="rounded-full border border-stone-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-stone-600"
            >
              Respondent Entry
            </button>
            <button onClick={() => navigate("/")} className={sharedButtonClasses}>
              Exit Assessment
            </button>
          </div>
          <button className="p-2 md:hidden" onClick={() => setMenuOpen((current) => !current)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </>
      );
    }

    return (
      <>
        <div className="hidden items-center gap-4 text-sm font-medium tracking-wide text-stone-600 md:flex">
          {primaryNavItems.map((item) => (
            <button
              key={item.key}
              onClick={item.action}
              className="uppercase"
            >
              {item.label}
            </button>
          ))}
        </div>
        <button className="p-2 md:hidden" onClick={() => setMenuOpen((current) => !current)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </>
    );
  };

  const renderMobileMenu = () => {
    if (!menuOpen) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-40 bg-[#F9F8F4]/96 px-5 pb-8 pt-24 backdrop-blur-md">
        <div className="mx-auto flex max-w-md flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-stone-400">
                Navigation
              </p>
              <p className="mt-2 font-serif text-2xl text-stone-900">Explore the platform</p>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-3">
            {primaryNavItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  item.action();
                }}
                className="rounded-[24px] border border-stone-200 bg-white px-5 py-4 text-left shadow-sm transition-colors hover:border-stone-300"
              >
                <p className="font-serif text-[1.2rem] text-stone-900">{item.label}</p>
                <p className="mt-1 text-sm leading-6 text-stone-500">{item.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderLanding = () => (
    <>
      <header className="relative min-h-screen overflow-hidden pt-24 md:pt-28">
        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(249,248,244,0.92)_0%,rgba(249,248,244,0.58)_48%,rgba(249,248,244,0.22)_100%)]" />
        <div className="absolute right-[-12%] top-[10%] h-[28rem] w-[28rem] rounded-full bg-blue-100/50 blur-3xl md:h-[34rem] md:w-[34rem]" />
        <div className="relative z-10 mx-auto max-w-[min(98vw,1500px)] px-4 pb-12 sm:px-6 lg:px-8">
          <div className="grid min-h-[calc(100vh-8rem)] items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-8">
            <div className="flex max-w-[46rem] flex-col items-center justify-center text-center">
              <h1 className="font-serif text-[2.9rem] font-medium leading-[0.95] text-stone-900 sm:text-5xl md:text-7xl lg:text-[5.8rem] lg:leading-[0.9]">
                Elite Global AI <br />
                <span className="mt-4 block text-[1.8rem] font-normal italic text-stone-600 sm:text-3xl md:text-5xl">
                  AI Readiness Assessment Platform
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base font-light leading-8 text-stone-700 sm:mt-8 sm:text-lg md:text-xl">
                A B2B assessment experience for benchmarking organisational AI readiness across
                literacy, data readiness, strategy, workflow adoption, and governance.
              </p>
              <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <motion.button
                  onClick={openAssessmentEntry}
                  animate={{
                    x: [0, -5, 5, -4, 4, -2, 2, 0],
                    rotate: [0, -1, 1, -0.8, 0.8, 0],
                    boxShadow: [
                      "0 18px 44px rgba(37,99,235,0.22)",
                      "0 24px 54px rgba(37,99,235,0.30)",
                      "0 18px 44px rgba(37,99,235,0.22)"
                    ]
                  }}
                  transition={{
                    duration: 0.9,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 2.6
                  }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-8 py-4 text-[1.05rem] font-extrabold text-white shadow-[0_18px_44px_rgba(37,99,235,0.22)] ring-1 ring-blue-300/50 transition-transform sm:w-auto sm:px-10 sm:py-4 sm:text-[1.12rem]"
                >
                  Begin Assessment
                </motion.button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="rounded-full border border-stone-200 bg-white/85 px-6 py-3 text-stone-800 shadow-sm transition-colors hover:border-stone-300 sm:w-auto"
                >
                  View Dashboard
                </button>
              </div>
              <div className="mt-12 flex justify-center">
                <a href="#introduction" onClick={goToSection("introduction")} className="group flex flex-col items-center gap-2 text-sm font-medium text-stone-500">
                  <span>DISCOVER</span>
                  <span className="rounded-full border border-stone-300 bg-white/50 p-2">
                    <ArrowDown size={16} />
                  </span>
                </a>
              </div>
            </div>

            <div className="relative mx-auto -mt-6 h-[280px] w-full max-w-[420px] sm:-mt-12 sm:h-[430px] sm:max-w-[640px] lg:-mt-20 lg:h-[640px] lg:max-w-none">
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(191,219,254,0.7),rgba(255,255,255,0)_68%)] blur-3xl" />
              <SpinningGlobeScene className="relative h-full w-full" />
            </div>
          </div>
        </div>
      </header>

      <main>
        <section id="introduction" className="bg-white py-20 sm:py-24">
          <div className="container mx-auto grid grid-cols-1 items-start gap-10 px-5 sm:px-6 md:grid-cols-12 md:px-12">
            <div className="md:col-span-4">
              <div className="mb-3 inline-block text-xs font-bold uppercase tracking-widest text-stone-500">
                Overview
              </div>
              <h2 className="mb-6 font-serif text-4xl leading-tight text-stone-900">
                The Competitive Readiness Gap
              </h2>
              <div className="mb-6 h-1 w-16 bg-nobel-gold" />
            </div>
            <div className="space-y-6 text-lg leading-relaxed text-stone-600 md:col-span-8">
              <p>
                <span className="float-left mr-3 mt-[-8px] font-serif text-5xl text-nobel-gold">
                  T
                </span>
                he Elite Global AI Readiness Assessment helps organisations benchmark how
                prepared their teams are for AI adoption by collecting 5 to 20 structured
                responses, aggregating the results, and turning a typical{" "}
                <strong className="font-medium text-stone-900">31 out of 100</strong> versus{" "}
                <strong className="font-medium text-stone-900">68 out of 100</strong>{" "}
                benchmark gap into a clear executive view of speed, governance, and
                competitive risk.
              </p>
            </div>
          </div>
        </section>

        <section id="science" className="border-t border-stone-100 bg-white py-20 sm:py-24">
          <div className="container mx-auto px-5 sm:px-6">
            <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-stone-600">
                  <BookOpen size={14} />
                  THE MODEL
                </div>
                <h2 className="mb-6 font-serif text-4xl text-stone-900 md:text-5xl">
                  Assessment Structure
                </h2>
                <p className="mb-6 text-lg leading-relaxed text-stone-600">
                  The assessment uses <strong>25 scored questions</strong> across five
                  dimensions, delivered one question per screen, while the backend keeps
                  scoring server-side, aggregates answers at organisation level, and preserves
                  anonymity in the final director-facing report.
                </p>
              </div>
              <div>
                <SurfaceCodeDiagram />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#F9F8F4] py-20 sm:py-24">
          <div className="container mx-auto px-5 sm:px-6">
            <div className="mx-auto mb-12 max-w-4xl text-center">
              <h2 className="mb-6 font-serif text-4xl text-stone-900 md:text-5xl">
                Readiness Benchmarks
              </h2>
              <p className="text-lg leading-relaxed text-stone-600">
                Directors need more than a raw score. The reporting layer frames results
                against benchmark ranges so leadership can understand whether the
                organisation is AI unaware, exploring, developing, or proficient.
              </p>
            </div>
            <div className="mx-auto max-w-3xl">
              <PerformanceMetricDiagram />
            </div>
          </div>
        </section>

        <section id="authors" className="border-t border-stone-300 bg-[#F5F4F0] py-20 sm:py-24">
          <div className="container mx-auto px-5 sm:px-6">
            <div className="mb-16 text-center">
              <div className="mb-3 inline-block text-xs font-bold uppercase tracking-widest text-stone-500">
                PLATFORM USERS
              </div>
              <h2 className="mb-4 font-serif text-3xl text-stone-900 md:text-5xl">
                Who the Product Serves
              </h2>
              <p className="mx-auto max-w-2xl text-stone-500">
                Built for executive recipients, respondents, and the internal admin team
                managing report delivery.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8">
              <AuthorCard name="Financial Services" role="Banks, fintechs, insurance, and regulated financial operations" delay="0s" />
              <AuthorCard name="Healthcare" role="Hospitals, health systems, NGOs, and clinical operations leaders" delay="0.1s" />
              <AuthorCard name="Consulting Firms" role="Professional services teams across audit, legal, tax, and advisory" delay="0.2s" />
              <AuthorCard name="SMEs" role="Growing businesses across operations, sales, customer service, and leadership" delay="0.3s" />
            </div>
          </div>
        </section>
      </main>
    </>
  );

  const renderDashboard = () => {
    const topFirm = publicDashboard?.organisations[0] || null;
    const systemAverageScore = publicDashboard?.summary.averageScore ?? 0;
    const benchmarkTargetScore = publicDashboard?.benchmarks.globalScore ?? 68;
    const chartFirmCount = publicDashboard?.organisations.length ?? 0;
    const chartMinWidthRem = Math.max(chartFirmCount * 8, 46);
    const glassPanelClasses =
      "relative overflow-hidden rounded-[30px] border border-white/62 bg-transparent backdrop-blur-[46px] shadow-[0_26px_84px_rgba(15,23,42,0.10),0_8px_24px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.72)]";
    const glassCardClasses =
      "rounded-[24px] border border-white/58 bg-transparent backdrop-blur-[38px] shadow-[0_18px_48px_rgba(15,23,42,0.08),0_6px_18px_rgba(15,23,42,0.03),inset_0_1px_0_rgba(255,255,255,0.70)]";
    const glassInsetClasses =
      "border border-white/56 bg-transparent backdrop-blur-[34px] shadow-[0_16px_40px_rgba(15,23,42,0.07),0_6px_16px_rgba(15,23,42,0.03),inset_0_1px_0_rgba(255,255,255,0.66)]";
    const glassPillClasses =
      "rounded-full border border-white/64 bg-transparent shadow-[0_10px_20px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-[26px]";
    const chartBarGradient = "from-sky-400 via-blue-500 to-indigo-500";
    const chartLineLabelClasses =
      "absolute right-0 rounded-full border border-white/70 bg-[#dbe6f4]/95 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-600 shadow-[0_10px_22px_rgba(15,23,42,0.08)] backdrop-blur-xl";
    const summaryCards = [
      {
        label: "Firms Took the Test",
        value: publicDashboard?.summary.participatingFirms ?? "—",
        detail: "Organisations with at least one completed assessment."
      },
      {
        label: "Average Scoring",
        value: publicDashboard ? `${publicDashboard.summary.averageScore}/100` : "—",
        detail: "Mean organisation score across all participating firms."
      },
      {
        label: "Total Responses",
        value: publicDashboard?.summary.totalSubmissions ?? "—",
        detail: "Submitted respondent records contributing to the public benchmark."
      },
      {
        label: "Highest Firm Average",
        value:
          publicDashboard?.summary.highestAverageScore !== null &&
          publicDashboard?.summary.highestAverageScore !== undefined
            ? `${publicDashboard.summary.highestAverageScore}/100`
            : "—",
        detail: "Current leading score across firms shown on this board."
      }
    ];

    return (
      <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#d9e5f4_0%,#c8d8ee_42%,#b7cbe7_100%)] pt-24 pb-20">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(15,23,42,0.02)_56%,rgba(255,255,255,0.02)_100%)]" />

        <div className="relative mx-auto max-w-[min(98vw,1500px)] px-4 sm:px-6 lg:px-8">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className={`${glassPanelClasses} rounded-[28px] px-5 py-6 sm:rounded-[34px] sm:px-8 sm:py-8 lg:px-10 lg:py-10`}
          >
            <div className="flex flex-col gap-6">
              <div className="relative">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.28 }}
                  className={`${glassPillClasses} inline-flex items-center gap-2 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-600`}
                >
                  <BarChart3 className="h-3.5 w-3.5 text-blue-700" />
                  Public Benchmark Dashboard
                </motion.div>
              </div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.06,
                      delayChildren: 0.12
                    }
                  }
                }}
                className="relative grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-4"
              >
                {summaryCards.map((card) => (
                  <motion.div
                    key={card.label}
                    variants={{
                      hidden: { opacity: 0, y: 18 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -4 }}
                    className={`${glassCardClasses} flex h-full min-h-[11.5rem] flex-col justify-between p-5 sm:min-h-[12.5rem]`}
                  >
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                      {card.label}
                    </p>
                    <div className="flex flex-1 flex-col justify-center py-4">
                      <p className="font-serif text-4xl font-medium tracking-tight text-slate-950">
                        {card.value}
                      </p>
                    </div>
                    <p className="text-sm leading-6 text-slate-500">
                      {card.detail}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.section>

          {publicDashboardError ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <InlineBanner
                tone="error"
                message={publicDashboardError}
                onClose={() => setPublicDashboardError("")}
                className="rounded-[24px] border-red-200/70 bg-red-50/70 backdrop-blur-xl shadow-[0_16px_36px_rgba(220,38,38,0.08)]"
              />
            </motion.div>
          ) : null}

          {publicDashboardLoading && !publicDashboard ? (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${glassPanelClasses} mt-6 flex min-h-[16rem] items-center justify-center`}
            >
              <div className="flex items-center gap-3 font-serif text-xl text-slate-700">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading public dashboard...</span>
              </div>
            </motion.div>
          ) : null}

          {publicDashboard ? (
            <>
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.34 }}
                className="mt-6 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]"
              >
                <div className={`${glassPanelClasses} p-6 sm:p-7`}>
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                        Sector View
                      </p>
                      <h2 className="mt-2 font-serif text-[1.8rem] font-medium tracking-tight text-slate-950">
                        Average scoring by firm type
                      </h2>
                    </div>
                    <span className={`${glassPillClasses} px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500`}>
                      Generated {formatDisplayDate(publicDashboard.generatedAt)}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {publicDashboard.sectors.map((sector) => {
                      const tone = getScoreTone(sector.averageScore);

                      return (
                        <motion.div
                          key={sector.firmType}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.26 }}
                          whileHover={{ y: -4 }}
                          className={`${glassInsetClasses} rounded-[24px] p-5`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-serif text-[1.15rem] font-medium text-slate-950">
                                {getFirmTypeLabel(sector.firmType)}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {sector.organisationCount} firm{sector.organisationCount === 1 ? "" : "s"} participating
                              </p>
                            </div>
                            <span className={`rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] ${tone.badge}`}>
                              {sector.averageScore}/100 average
                            </span>
                          </div>

                          <div className="mt-4 h-2.5 rounded-full bg-transparent ring-1 ring-white/30 backdrop-blur-md">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(sector.averageScore, 4)}%` }}
                              transition={{ delay: 0.12, duration: 0.5 }}
                              className={`h-full rounded-full bg-gradient-to-r ${tone.progress}`}
                            />
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              {sector.organisationCount} organisations
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {sector.totalSubmissions} responses
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className={`${glassPanelClasses} p-6 sm:p-7`}>
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                        Lead Snapshot
                      </p>
                      <h2 className="mt-2 font-serif text-[1.8rem] font-medium tracking-tight text-slate-950">
                        Current benchmark leader
                      </h2>
                    </div>
                    {topFirm ? (
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] ${getScoreTone(topFirm.averageScore).badge}`}>
                        {getReadinessLabel(topFirm.averageScore)}
                      </span>
                    ) : null}
                  </div>

                  {topFirm ? (
                    <motion.div
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.28 }}
                      whileHover={{ y: -4 }}
                      className={`${glassInsetClasses} overflow-hidden rounded-[28px] p-6`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-blue-900 font-serif text-lg font-bold text-white shadow-[0_16px_36px_rgba(30,64,175,0.28)]">
                            {getOrganisationInitials(topFirm.orgName)}
                          </div>
                          <div>
                            <p className="font-serif text-[1.4rem] font-medium tracking-tight text-slate-950">
                              {topFirm.orgName}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {getFirmTypeLabel(topFirm.firmType)} sector
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                            Average Score
                          </p>
                          <p className="mt-2 font-serif text-[2.4rem] font-medium tracking-tight text-slate-950">
                            {topFirm.averageScore}/100
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 h-3 rounded-full bg-transparent ring-1 ring-white/35 backdrop-blur-md">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(topFirm.averageScore, 6)}%` }}
                          transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                          className={`h-full rounded-full bg-gradient-to-r ${getScoreTone(topFirm.averageScore).progress}`}
                        />
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
                        <span className={`${glassPillClasses} inline-flex items-center gap-2 px-3 py-1.5 text-slate-600`}>
                          <Users className="h-4 w-4" />
                          {topFirm.submissionCount} responses
                        </span>
                        <span className={`${glassPillClasses} inline-flex items-center gap-2 px-3 py-1.5 text-slate-600`}>
                          <CheckCircle2 className="h-4 w-4" />
                          {getReadinessLabel(topFirm.averageScore)}
                        </span>
                        <span className={`${glassPillClasses} inline-flex items-center gap-2 px-3 py-1.5 text-slate-600`}>
                          <Clock3 className="h-4 w-4" />
                          Active since {formatDisplayDate(topFirm.createdAt)}
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    <div className={`${glassInsetClasses} flex min-h-[16rem] items-center justify-center rounded-[28px] border-dashed text-center`}>
                      <div className="max-w-md px-6">
                        <p className="font-serif text-2xl text-slate-900">No participating firms yet</p>
                        <p className="mt-3 text-sm leading-7 text-slate-500">
                          Once organisations complete the assessment, they will appear here
                          with their average scoring and sector position.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.34 }}
                className={`${glassPanelClasses} mt-6 p-6 sm:p-7`}
              >
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                      Benchmark Comparison
                    </p>
                    <h2 className="mt-2 font-serif text-[1.8rem] font-medium tracking-tight text-slate-950">
                      Firm average scores vs global benchmark
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      Each bar shows a firm&apos;s average readiness score. The reference
                      lines show the live system-wide average and the global benchmark used
                      in the reporting model.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={`${glassPillClasses} inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-600`}>
                      <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />
                      Firm Average
                    </span>
                    <span className={`${glassPillClasses} inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-600`}>
                      <span className="h-[3px] w-5 rounded-full bg-slate-600" />
                      Average {formatScoreValue(systemAverageScore)}/100
                    </span>
                    <span className={`${glassPillClasses} inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-600`}>
                      <span className="h-[3px] w-5 rounded-full bg-amber-500" />
                      Global Benchmark {formatScoreValue(benchmarkTargetScore)}/100
                    </span>
                  </div>
                </div>

                {publicDashboard.organisations.length ? (
                  <div className="space-y-5">
                    <div className={`${glassCardClasses} overflow-hidden p-4 sm:p-6`}>
                      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <p className="max-w-2xl text-sm leading-6 text-slate-500">
                          The chart spreads all participating firms across one view and
                          keeps the benchmark lines fixed for direct comparison.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className={`${glassPillClasses} inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-600`}>
                            <BarChart3 className="h-3.5 w-3.5" />
                            {publicDashboard.organisations.length} firms plotted
                          </span>
                          <span className={`${glassPillClasses} inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-600`}>
                            <span className="h-[3px] w-5 rounded-full bg-slate-600" />
                            Average {formatScoreValue(systemAverageScore)}
                          </span>
                          <span className={`${glassPillClasses} inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-600`}>
                            <span className="h-[3px] w-5 rounded-full bg-amber-500" />
                            Global {formatScoreValue(benchmarkTargetScore)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 md:hidden">
                        {publicDashboard.organisations.map((organisation, index) => {
                          const tone = getScoreTone(organisation.averageScore);
                          const benchmarkGap =
                            organisation.averageScore - benchmarkTargetScore;

                          return (
                            <motion.div
                              key={`${organisation.id}-mobile-chart`}
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.04 + index * 0.04, duration: 0.28 }}
                              className={`${glassInsetClasses} rounded-[24px] p-4`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p
                                    title={organisation.orgName}
                                    className="truncate font-serif text-[1.12rem] text-slate-950"
                                  >
                                    {organisation.orgName}
                                  </p>
                                  <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                                    {getFirmTypeLabel(organisation.firmType)}
                                  </p>
                                </div>
                                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] ${tone.badge}`}>
                                  {getReadinessLabel(organisation.averageScore)}
                                </span>
                              </div>

                              <div className="mt-4">
                                <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                                  <span>{formatScoreValue(organisation.averageScore)}/100</span>
                                  <span>{formatScoreDelta(benchmarkGap)} vs global</span>
                                </div>
                                <div className="relative h-3 rounded-full bg-transparent ring-1 ring-white/35 backdrop-blur-md">
                                  <div
                                    className="absolute inset-y-[-4px] w-px bg-slate-600/80"
                                    style={{
                                      left: `${Math.max(0, Math.min(100, systemAverageScore))}%`
                                    }}
                                  />
                                  <div
                                    className="absolute inset-y-[-4px] w-px bg-amber-500"
                                    style={{
                                      left: `${Math.max(0, Math.min(100, benchmarkTargetScore))}%`
                                    }}
                                  />
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                      width: `${Math.max(organisation.averageScore, 4)}%`
                                    }}
                                    transition={{
                                      delay: 0.1 + index * 0.04,
                                      duration: 0.56,
                                      ease: [0.22, 1, 0.36, 1]
                                    }}
                                    className={`h-full rounded-full bg-gradient-to-r ${chartBarGradient}`}
                                  />
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  <span>Avg {formatScoreValue(systemAverageScore)}</span>
                                  <span>Global {formatScoreValue(benchmarkTargetScore)}</span>
                                  <span>{organisation.submissionCount} responses</span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      <div className="hidden md:block">
                        <div className="overflow-x-auto pb-2">
                          <div
                            className="min-w-full"
                            style={{ minWidth: `${chartMinWidthRem}rem` }}
                          >
                            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 lg:gap-6">
                              <div className="relative h-[22rem]">
                                {[0, 25, 50, 75, 100].map((tick) => (
                                  <div
                                    key={`firm-chart-axis-${tick}`}
                                    className="absolute right-0 text-[11px] font-semibold text-slate-500"
                                    style={{ bottom: `${tick}%`, transform: "translateY(50%)" }}
                                  >
                                    {tick}
                                  </div>
                                ))}
                              </div>

                              <div className="relative rounded-[28px] border border-white/28 bg-transparent px-4 pb-5 pt-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-[28px] lg:px-5">
                                <div className="pointer-events-none absolute inset-x-4 bottom-5 top-6 lg:inset-x-5">
                                  {[0, 25, 50, 75, 100].map((tick) => (
                                    <div
                                      key={`firm-chart-grid-${tick}`}
                                      className="absolute inset-x-0 border-t border-dashed border-white/18"
                                      style={{ bottom: `${tick}%` }}
                                    />
                                  ))}

                                  <div
                                    className="absolute inset-x-0 border-t border-slate-600/70"
                                    style={{
                                      bottom: `${Math.max(0, Math.min(100, systemAverageScore))}%`
                                    }}
                                  >
                                    <span className={`${chartLineLabelClasses} -translate-y-[135%]`}>
                                      Average {formatScoreValue(systemAverageScore)}
                                    </span>
                                  </div>

                                  <div
                                    className="absolute inset-x-0 border-t border-amber-500/90"
                                    style={{
                                      bottom: `${Math.max(0, Math.min(100, benchmarkTargetScore))}%`
                                    }}
                                  >
                                    <span className={`${chartLineLabelClasses} -translate-y-[135%]`}>
                                      Global {formatScoreValue(benchmarkTargetScore)}
                                    </span>
                                  </div>
                                </div>

                                <div
                                  className="relative z-10 grid h-[22rem] items-end gap-4"
                                  style={{
                                    gridTemplateColumns: `repeat(${Math.max(publicDashboard.organisations.length, 1)}, minmax(5.5rem, 1fr))`
                                  }}
                                >
                                  {publicDashboard.organisations.map((organisation, index) => {
                                    const labelBottom = Math.min(
                                      Math.max(organisation.averageScore, 3),
                                      92
                                    );

                                    return (
                                      <div
                                        key={`${organisation.id}-desktop-chart`}
                                        className="flex h-full min-w-0 flex-col justify-end"
                                      >
                                        <div className="relative flex h-full items-end justify-center">
                                          <motion.div
                                            initial={{ height: 0 }}
                                            animate={{
                                              height: `${Math.max(organisation.averageScore, 3)}%`
                                            }}
                                            transition={{
                                              delay: 0.08 + index * 0.03,
                                              duration: 0.62,
                                              ease: [0.22, 1, 0.36, 1]
                                            }}
                                            className={`w-full max-w-[5.75rem] rounded-t-[20px] bg-gradient-to-t ${chartBarGradient} shadow-[0_16px_36px_rgba(15,23,42,0.16)]`}
                                          />
                                          <span
                                            className="absolute left-1/2 -translate-x-1/2 text-[11px] font-semibold text-slate-700"
                                            style={{
                                              bottom: `calc(${labelBottom}% + 0.55rem)`
                                            }}
                                          >
                                            {formatScoreValue(organisation.averageScore)}
                                          </span>
                                        </div>

                                        <div className="mt-4 text-center">
                                          <p
                                            title={organisation.orgName}
                                            className="truncate text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-600"
                                          >
                                            {organisation.orgName}
                                          </p>
                                          <p className="mt-1 text-[10px] text-slate-500">
                                            {formatScoreDelta(
                                              organisation.averageScore - benchmarkTargetScore
                                            )}{" "}
                                            vs global
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className={`${glassInsetClasses} flex min-h-[14rem] items-center justify-center rounded-[28px] border-dashed text-center`}>
                    <div className="max-w-md px-6">
                      <p className="font-serif text-2xl text-slate-900">No firm comparison data yet</p>
                      <p className="mt-3 text-sm leading-7 text-slate-500">
                        As soon as firms submit their assessments, this chart will plot
                        every firm against the live average and the global benchmark.
                      </p>
                    </div>
                  </div>
                )}
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.34 }}
                className={`${glassPanelClasses} mt-6 p-6 sm:p-7`}
              >
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                      Participating Firms
                    </p>
                    <h2 className="mt-2 font-serif text-[1.8rem] font-medium tracking-tight text-slate-950">
                      Firms that took the test
                    </h2>
                  </div>
                  <span className={`${glassPillClasses} px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500`}>
                    {publicDashboard.organisations.length} listed
                  </span>
                </div>

                {publicDashboard.organisations.length ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {publicDashboard.organisations.map((organisation) => {
                      const tone = getScoreTone(organisation.averageScore);

                      return (
                        <motion.article
                          key={organisation.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.24 }}
                          whileHover={{ y: -5, scale: 1.01 }}
                          className={`${glassInsetClasses} rounded-[26px] p-5`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-900 font-serif text-sm font-bold text-white">
                                {getOrganisationInitials(organisation.orgName)}
                              </div>
                              <div>
                                <p className="font-serif text-[1.15rem] font-medium leading-tight text-slate-950">
                                  {organisation.orgName}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {getFirmTypeLabel(organisation.firmType)}
                                </p>
                              </div>
                            </div>

                            <span className={`rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] ${tone.badge}`}>
                              {getReadinessLabel(organisation.averageScore)}
                            </span>
                          </div>

                          <div className="mt-5 flex items-end justify-between gap-4">
                            <div>
                              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                                Average Score
                              </p>
                              <p className="mt-2 font-serif text-[2rem] font-medium tracking-tight text-slate-950">
                                {organisation.averageScore}/100
                              </p>
                            </div>
                            <div className="text-right text-sm text-slate-500">
                              <p>{organisation.submissionCount} responses</p>
                              <p className="mt-1">Joined {formatDisplayDate(organisation.createdAt)}</p>
                            </div>
                          </div>

                          <div className="mt-4 h-2.5 rounded-full bg-stone-100">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(organisation.averageScore, 4)}%` }}
                              transition={{ delay: 0.12, duration: 0.5 }}
                              className={`h-full rounded-full bg-gradient-to-r ${tone.progress}`}
                            />
                          </div>
                        </motion.article>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`${glassInsetClasses} flex min-h-[14rem] items-center justify-center rounded-[28px] border-dashed text-center`}>
                    <div className="max-w-md px-6">
                      <p className="font-serif text-2xl text-slate-900">No public results yet</p>
                      <p className="mt-3 text-sm leading-7 text-slate-500">
                        This space will populate automatically after organisations submit
                        assessment responses.
                      </p>
                    </div>
                  </div>
                )}
              </motion.section>
            </>
          ) : null}
        </div>
      </div>
    );
  };

  const renderDirectorSetup = () => (
    <DirectorSetupScreen
      directorForm={directorForm}
      firmTypeOptions={FIRM_TYPE_OPTIONS}
      entryLoading={entryLoading}
      entryError={entryError}
      entryNotice={entryNotice}
      onDismissEntryError={() => setEntryError("")}
      onDismissEntryNotice={() => setEntryNotice("")}
      onFirmTypeChange={(value) => updateDirectorField("firmType", value)}
      onOrgNameChange={(value) => updateDirectorField("orgName", value)}
      onEmailChange={(value) => updateDirectorField("email", value)}
      onNameChange={(value) => updateDirectorField("name", value)}
      onDeptChange={(value) => updateDirectorField("dept", value)}
      onConsentChange={(value) => updateDirectorField("consentAccepted", value)}
      onBack={openAssessmentEntry}
      onClose={handleStartModalCancel}
      onSubmit={(event) => {
        void handleDirectorSetupSubmit(event);
      }}
    />
  );

  const renderStart = () => {
    if (respondentEntryView === "welcome" || isInviteEntryFlow) {
      return (
        <AssessmentWelcomeScreen
          formData={{
            orgName: formData.orgName,
            role: formData.role,
            dept: formData.dept,
            firmType: formData.firmType
          }}
          invitePrefill={invitePrefill}
          firmTypeOptions={FIRM_TYPE_OPTIONS}
          roleOptions={availableRoleOptions}
          entryLoading={entryLoading}
          inviteLoading={inviteLoading}
          entryError={entryError}
          entryNotice={entryNotice}
          onDismissEntryError={() => setEntryError("")}
          onDismissEntryNotice={() => setEntryNotice("")}
          onFirmTypeChange={(value) => updateFormField("firmType", value)}
          onOrgNameChange={(value) => updateFormField("orgName", value)}
          onRoleChange={(value) => updateFormField("role", value)}
          onDeptChange={(value) => updateFormField("dept", value)}
          onBack={isInviteEntryFlow ? () => navigate("/") : () => setRespondentEntryView("split")}
          onClose={handleStartModalCancel}
          onSubmit={(event) => {
            void handleStartAssessment(event);
          }}
        />
      );
    }

    return (
      <AssessmentSplitEntryScreen
        onSelectRespondent={openRespondentWelcome}
        onSelectDirector={() => {
          setEntryError("");
          setEntryNotice("");
          navigate("/director-setup");
        }}
        onClose={handleStartModalCancel}
      />
    );
  };

  const renderAssessment = () => {
    if (!question || !isCompleteDraft(formData)) {
      return null;
    }

    if (dimensionTransition) {
      return (
        <AssessmentDimensionTransitionScreen
          completedDimension={dimensionTransition.completedDimension}
          nextDimension={dimensionTransition.nextDimension}
          observation={dimensionTransition.observation}
          onClose={handleStartModalCancel}
        />
      );
    }

    return (
      <AssessmentQuestionScreen
        question={question}
        currentAnswer={currentAnswer}
        currentStep={currentStep}
        totalSteps={totalSteps}
        answeredCount={answeredCount}
        currentDimensionIndex={currentDimensionIndex}
        currentDimensionQuestionsCount={currentDimensionQuestions.length}
        activeFirmTypeLabel={activeFirmTypeLabel}
        orgName={formData.orgName}
        roleLabel={getRoleLabel(formData.role)}
        dept={formData.dept}
        submissionError={submissionError}
        onDismissSubmissionError={() => setSubmissionError("")}
        onSelect={handleSelect}
        onBack={() => {
          if (currentStep === 1) {
            openRespondentWelcome();
            return;
          }

          navigate(`/assessment/${currentStep - 1}`);
        }}
        onNext={() => openQuestionStep(currentStep + 1)}
        onFinish={() => {
          void handleFinish();
        }}
        currentQuestionAnswered={currentQuestionAnswered}
        isSubmitting={isSubmitting}
        onClose={handleStartModalCancel}
      />
    );
  };

  const renderAssessmentDetails = () => {
    if (!isAssessmentContextReady(formData)) {
      return null;
    }

    return (
      <AssessmentCompletionDetailsScreen
        orgName={formData.orgName}
        firmType={formData.firmType}
        roleLabel={getRoleLabel(formData.role)}
        dept={formData.dept}
        answeredCount={answeredCount}
        totalSteps={totalSteps}
        name={formData.name}
        email={formData.email}
        phone={formData.phone}
        attribution={formData.attribution}
        consentAccepted={formData.consentAccepted}
        attributionOptions={ATTRIBUTION_OPTIONS}
        submissionError={submissionError}
        isSubmitting={isSubmitting}
        onDismissSubmissionError={() => setSubmissionError("")}
        onNameChange={(value) => updateFormField("name", value)}
        onEmailChange={(value) => updateFormField("email", value)}
        onPhoneChange={(value) => updateFormField("phone", value)}
        onAttributionChange={(value) => updateFormField("attribution", value)}
        onConsentChange={(value) => updateFormField("consentAccepted", value)}
        onBack={() => navigate(`/assessment/${totalSteps}`)}
        onClose={handleStartModalCancel}
        onSubmit={() => {
          void handleGenerateReport();
        }}
      />
    );
  };

  const renderAssessmentProcessing = () => (
    <AssessmentProcessingScreen
      processingProgress={processingProgress}
      processingDimensionIndex={processingDimensionIndex}
      dimensionLabels={Object.values(DIMENSION_LABELS)}
      onClose={handleStartModalCancel}
    />
  );

  const renderAssessmentResult = () => (
    <AssessmentFinalResultScreen
      lastSubmission={lastSubmission}
      onStartAnother={openAssessmentEntry}
      onClose={handleStartModalCancel}
    />
  );

  const renderAdmin = () => {
    if (!isAuthed) {
      return (
        <div className="relative min-h-screen overflow-hidden bg-[#F9F8F4] pt-20 pb-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(219,234,254,0.52),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(191,219,254,0.38),transparent_34%)]" />
          <div className="relative mx-auto max-w-[min(98vw,1500px)] px-2 pt-2 pb-4 sm:px-4 lg:px-6">
            <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-xl sm:p-6">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
                <div>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-900 font-serif text-sm font-bold text-white">
                      E
                    </div>
                    <div>
                      <p className="font-serif text-lg font-bold tracking-tight text-slate-950">
                        Secure Admin Access
                      </p>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Authentication required
                      </p>
                    </div>
                  </div>

                  <div className="mb-5 space-y-2">
                    <h2 className="font-serif text-[1.42rem] font-medium text-slate-950 sm:text-[1.68rem]">
                      Admin Login
                    </h2>
                    <p className="max-w-2xl text-[0.98rem] leading-7 text-slate-500 sm:text-[1.04rem]">
                      Enter your admin email to access the correct admin dashboard. Firm
                      admins only see their own organisation.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-[24px] border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
                      <div className="mb-4">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                          Admin Email
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          The dashboard scope is determined immediately by the email you
                          enter.
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <label className="ml-1 text-[12px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                          Email Address
                        </label>
                        <input
                          type="email"
                          placeholder="admin@eliteglobalai.com or director@company.com"
                          className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-4 text-[15px] font-medium text-slate-900"
                          value={firmAdminEmailInput}
                          onChange={(event) => setFirmAdminEmailInput(event.target.value)}
                        />
                      </div>

                      <button
                        onClick={() => {
                          void loginAdminByEmail();
                        }}
                        disabled={adminLoginLoading}
                        className="mt-4 flex w-full items-center justify-center gap-3 rounded-full bg-blue-900 px-6 py-3 text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {adminLoginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        Access Dashboard
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>

                    {adminNotice ? (
                      <InlineBanner tone="success" message={adminNotice} onClose={() => setAdminNotice("")} className="rounded-2xl" />
                    ) : null}
                    {adminError ? (
                      <InlineBanner tone="error" message={adminError} onClose={() => setAdminError("")} className="rounded-2xl" />
                    ) : null}
                  </div>
                </div>

                <aside className="space-y-4">
                  <div className="rounded-[24px] border border-blue-100 bg-blue-50/60 p-6">
                    <p className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
                      Recommended Sequence
                    </p>
                    <div className="space-y-3">
                      {ADMIN_NOTES.map((note, index) => (
                        <div key={note} className="flex gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white">
                            {index + 1}
                          </div>
                          <p className="text-[14px] leading-6 text-slate-700">{note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>
              </div>
            </section>
          </div>
        </div>
      );
    }

    return (
      <div className="relative min-h-screen overflow-hidden bg-[#F9F8F4] pt-20 pb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(219,234,254,0.46),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(191,219,254,0.28),transparent_36%)]" />
        <div className="relative mx-auto max-w-[min(98vw,1500px)] px-2 pt-2 pb-4 sm:px-4 lg:px-6">
          <div className="mb-4 rounded-[28px] border border-stone-200 bg-white/95 p-5 shadow-xl sm:p-6">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
                  {isSuperAdmin ? "EliteGlobal Admin Dashboard" : "Firm Admin Dashboard"}
                </p>
                <h1 className="font-serif text-[1.62rem] font-medium leading-[1.04] tracking-[0.01em] text-slate-950 sm:text-[1.96rem] lg:text-[2.42rem]">
                  {isSuperAdmin
                    ? "Organisation readiness overview"
                    : "Your organisation readiness overview"}
                </h1>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => { void fetchOrgs(adminAuth); }}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-5 py-3 text-[15px] font-semibold text-stone-700"
                >
                  Refresh
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-[15px] font-semibold text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard icon={Building2} label="Organisations" value={String(orgs.length)} />
              <SummaryCard icon={Users} label="Submissions" value={String(totalSubmissions)} />
              <SummaryCard icon={BarChart3} label="Average Score" value={averageScore.toFixed(1)} />
              <SummaryCard icon={Send} label="Reports Sent" value={String(reportsSent)} />
            </div>

            {adminNotice ? (
              <div className="mt-5">
                <InlineBanner tone="success" message={adminNotice} onClose={() => setAdminNotice("")} className="rounded-2xl" />
              </div>
            ) : null}
            {adminError ? (
              <div className="mt-5">
                <InlineBanner tone="error" message={adminError} onClose={() => setAdminError("")} className="rounded-2xl" />
              </div>
            ) : null}
          </div>

          {isSuperAdmin ? (
            <div className="mb-6 rounded-[28px] border border-stone-200 bg-white/95 p-5 shadow-xl sm:p-6">
              <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
                    Firm Admin Onboarding
                  </p>
                  <h2 className="font-serif text-[1.35rem] font-medium tracking-[0.01em] text-slate-950 sm:text-[1.6rem]">
                    Create a firm and assign its admin email
                  </h2>
                </div>
                <p className="max-w-xl text-sm leading-6 text-stone-500">
                  Once you create the firm record here, that email can log in directly on
                  the admin page and will be restricted to its own firm.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-4">
                <div className="space-y-2.5">
                  <label className="ml-1 text-[12px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                    Firm Name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-[15px] font-medium text-slate-900"
                    value={createOrgDraft.orgName}
                    onChange={(event) =>
                      setCreateOrgDraft((current) => ({ ...current, orgName: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="ml-1 text-[12px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                    Firm Admin Email
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-[15px] font-medium text-slate-900"
                    value={createOrgDraft.directorEmail}
                    onChange={(event) =>
                      setCreateOrgDraft((current) => ({
                        ...current,
                        directorEmail: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="ml-1 text-[12px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                    Firm Type
                  </label>
                  <select
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-[15px] font-medium text-slate-900"
                    value={createOrgDraft.firmType}
                    onChange={(event) =>
                      setCreateOrgDraft((current) => ({
                        ...current,
                        firmType: event.target.value as FirmType
                      }))
                    }
                  >
                    {FIRM_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2.5">
                  <label className="ml-1 text-[12px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                    Expected Respondents
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-[15px] font-medium text-slate-900"
                    value={createOrgDraft.expectedRespondents}
                    onChange={(event) =>
                      setCreateOrgDraft((current) => ({
                        ...current,
                        expectedRespondents: event.target.value
                      }))
                    }
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    void handleCreateOrganisation();
                  }}
                  disabled={Boolean(busyKey)}
                  className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {busyKey === "create-organisation" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Create Firm Admin
                </button>
              </div>
            </div>
          ) : null}

          {adminLoading ? (
            <div className="rounded-[28px] border border-stone-200 bg-white p-12 text-center shadow-xl">
              <Loader2 className="mx-auto mb-4 h-6 w-6 animate-spin text-stone-700" />
              <p className="text-sm font-semibold text-stone-600">Loading organisation records...</p>
            </div>
          ) : orgs.length === 0 ? (
            <div className="rounded-[28px] border border-stone-200 bg-white p-12 text-center shadow-xl">
              <p className="text-lg font-semibold text-stone-900">No organisations yet</p>
              <p className="mt-2 text-sm text-stone-500">
                {isSuperAdmin
                  ? "Use the onboarding form above to create the first firm admin and organisation."
                  : "Your organisation record has not been configured yet. Contact Elite Global AI."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {orgs.map((organisation) => {
                const draft = drafts[organisation.id] || {
                  orgName: organisation.orgName,
                  directorEmail: organisation.directorEmail || "",
                  expectedRespondents: organisation.expectedRespondents
                    ? String(organisation.expectedRespondents)
                    : ""
                };
                const completionRatio = getCompletionRatio(organisation);

                return (
                  <div key={organisation.id} className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-xl sm:p-6">
                    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <h2 className="font-serif text-[1.4rem] font-medium tracking-[0.01em] text-slate-950 sm:text-[1.6rem]">
                            {organisation.orgName}
                          </h2>
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.2em] text-emerald-700">
                            {getFirmTypeLabel(organisation.firmType)}
                          </span>
                          <span className={`rounded-full border px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.2em] ${statusBadgeClasses[organisation.status]}`}>
                            {organisation.status}
                          </span>
                        </div>
                        <p className="text-[14px] text-stone-500">Organisation key: {organisation.organisationKey}</p>
                        <p className="mt-2 text-[14px] text-stone-500">
                          Readiness band: {getReadinessLabel(organisation.aggregatedScores.total)}
                        </p>
                      </div>

                      <div className="rounded-[24px] border border-stone-200 bg-stone-50 px-5 py-4 text-right">
                        <p className="mb-2 text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                          Responses
                        </p>
                        <p className="font-serif text-[1.7rem] font-medium text-slate-950">
                          {organisation.submissionCount}
                        </p>
                        {completionRatio !== null ? (
                          <p className="text-[14px] text-stone-500">
                            {completionRatio.toFixed(0)}% of expected
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                      {[
                        [DIMENSION_LABELS.aiLiteracy, organisation.aggregatedScores.aiLiteracy],
                        [DIMENSION_LABELS.dataReadiness, organisation.aggregatedScores.dataReadiness],
                        [DIMENSION_LABELS.aiStrategy, organisation.aggregatedScores.aiStrategy],
                        [DIMENSION_LABELS.workflowAdoption, organisation.aggregatedScores.workflowAdoption],
                        [DIMENSION_LABELS.ethicsCompliance, organisation.aggregatedScores.ethicsCompliance],
                        ["Overall", organisation.aggregatedScores.total]
                      ].map(([label, value], index) => (
                        <div key={label} className={`rounded-[24px] border p-4 ${index === 5 ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-stone-50"}`}>
                          <p className={`mb-2 text-[9px] font-extrabold uppercase tracking-[0.2em] ${index === 5 ? "text-stone-300" : "text-slate-400"}`}>
                            {label}
                          </p>
                          <p className="font-serif text-[1.35rem] font-medium">{Number(value).toFixed(1)}</p>
                          <p className={`text-[12px] ${index === 5 ? "text-stone-300" : "text-stone-500"}`}>
                            / {index === 5 ? "100" : "20"}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-5 lg:grid-cols-3">
                      <div className="space-y-2.5">
                        <label className="ml-1 text-[12px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                          Organisation Name
                        </label>
                        <input
                          type="text"
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-[15px] font-medium text-slate-900"
                          value={draft.orgName}
                          onChange={(event) => updateDraft(organisation.id, "orgName", event.target.value)}
                        />
                      </div>
                      <div className="space-y-2.5">
                        <label className="ml-1 text-[12px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                          Director Email
                        </label>
                        <input
                          type="email"
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-[15px] font-medium text-slate-900"
                          value={draft.directorEmail}
                          onChange={(event) => updateDraft(organisation.id, "directorEmail", event.target.value)}
                        />
                      </div>
                      <div className="space-y-2.5">
                        <label className="ml-1 text-[12px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                          Expected Respondents
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-[15px] font-medium text-slate-900"
                          value={draft.expectedRespondents}
                          onChange={(event) => updateDraft(organisation.id, "expectedRespondents", event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        onClick={() => { void handleSaveOrg(organisation.id); }}
                        disabled={Boolean(busyKey)}
                        className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-5 py-3 text-[15px] font-semibold text-stone-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {busyKey === `save-${organisation.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        Save Org Details
                      </button>
                      <button
                        onClick={() => { void handlePreviewReport(organisation.id); }}
                        disabled={Boolean(busyKey)}
                        className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-5 py-3 text-[15px] font-semibold text-stone-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {busyKey === `preview-${organisation.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                        View Latest Snapshot
                      </button>
                      <button
                        onClick={() => { void handleSendReport(organisation.id); }}
                        disabled={Boolean(busyKey)}
                        className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {busyKey === `send-${organisation.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Approve & Send Report
                      </button>
                      {isSuperAdmin ? (
                        <button
                          onClick={() => {
                            void handleDeleteOrganisation(organisation.id, organisation.orgName);
                          }}
                          disabled={Boolean(busyKey)}
                          className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-3 text-[15px] font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {busyKey === `delete-${organisation.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete Firm
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-5 text-[14px] text-stone-500">
                      <span className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {organisation.directorEmail || "No director email set yet"}
                      </span>
                      <span>Report sent: {formatReportDate(organisation.reportSentAt)}</span>
                      <span>The live snapshot matches the respondent report view.</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!hasMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F8F4] text-stone-700">
        <div className="flex items-center gap-3 font-serif text-xl">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading assessment...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F4] text-stone-800 selection:bg-nobel-gold selection:text-white">
      {!isStandaloneAssessmentRoute ? (
        <nav className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#F9F8F4]/90 py-4 shadow-sm backdrop-blur-md" : "bg-transparent py-6"}`}>
          <div className="container mx-auto flex items-center justify-between px-4 sm:px-6">
            <div className="flex cursor-pointer items-center gap-4" onClick={() => navigate("/")}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-nobel-gold pb-1 text-xl font-serif font-bold text-white shadow-sm">
                E
              </div>
              <span className={`font-serif text-lg font-bold tracking-wide transition-opacity ${scrolled || !isLandingSurface ? "opacity-100" : "opacity-0 md:opacity-100"}`}>
                ELITE GLOBAL AI <span className="font-normal text-stone-500">Assessment</span>
              </span>
            </div>
            {renderTopNav()}
          </div>
        </nav>
      ) : null}

      {!isStandaloneAssessmentRoute ? renderMobileMenu() : null}

      {showLandingBackdrop ? renderLanding() : null}
      {route.name === "dashboard" ? renderDashboard() : null}
      {route.name === "start" ? renderStart() : null}
      {route.name === "director-setup" ? renderDirectorSetup() : null}
      {route.name === "assessment" ? renderAssessment() : null}
      {route.name === "assessment-details" ? renderAssessmentDetails() : null}
      {route.name === "assessment-processing" ? renderAssessmentProcessing() : null}
      {route.name === "assessment-result" ? renderAssessmentResult() : null}
      {route.name === "admin" ? renderAdmin() : null}

      {!isAssessmentExperienceRoute ? (
        <footer className="border-t border-slate-800 bg-[#0f172a] text-slate-300">
          <div className="container mx-auto px-5 py-14 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.75fr_0.95fr]">
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-xl font-serif font-bold text-white shadow-sm">
                    E
                  </div>
                  <div>
                    <p className="font-serif text-2xl font-bold text-white">Elite Global AI</p>
                    <p className="text-sm text-slate-400">AI Readiness Assessment Platform</p>
                  </div>
                </div>
                <p className="max-w-xl text-sm leading-7 text-slate-400">
                  Benchmark-led AI readiness diagnostics for financial services,
                  healthcare, consulting firms, and SMEs, with executive-grade reporting
                  and clear commercial follow-through.
                </p>
                <a
                  href={MARKETING_SITE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-white"
                >
                  Visit Website
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="space-y-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-500">
                  Navigate
                </p>
                <div className="flex flex-col gap-3 text-sm">
                  {primaryNavItems.map((item) => (
                    <button
                      key={`footer-${item.key}`}
                      type="button"
                      onClick={item.action}
                      className="text-left font-medium text-slate-200"
                    >
                      {item.key === "dashboard" ? "Public Dashboard" : item.label}
                    </button>
                  ))}
                  <a href={MARKETING_SITE_URL} target="_blank" rel="noreferrer" className="font-medium text-slate-200">
                    eliteglobalai.com
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-500">
                  Follow Elite Global AI
                </p>
                <div className="flex flex-wrap gap-3">
                  {FOOTER_SOCIALS.map(({ label, href, icon: Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300"
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-slate-800 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 Elite Global AI. All rights reserved.</p>
              <p>Benchmark-led diagnostics for AI capability, governance, and adoption.</p>
            </div>
          </div>
          <div className="pb-8 text-center text-xs text-slate-500">
            {backendStatus === "connected"
              ? `Connected to ${backendService || "elite-global-ai-backend"} via ${apiHealthUrl} in ${backendEnvironment}.`
              : backendStatus === "checking"
                ? "Checking backend connectivity through the configured API origin."
                : "Backend health check is not currently reachable from this frontend."}
          </div>
        </footer>
      ) : null}
    </div>
  );
}
