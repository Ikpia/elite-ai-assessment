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
  Send,
  ShieldCheck,
  Users,
  Youtube,
  X
} from "lucide-react";

import { PerformanceMetricDiagram, SurfaceCodeDiagram } from "@/components/diagrams";
import { SpinningGlobeScene } from "@/components/quantum-scene";
import { ApiError, buildApiUrl } from "@/lib/api";
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
  | { name: "assessment"; step: number }
  | { name: "complete" }
  | { name: "admin" };

type AnswerState = Record<number, string | string[]>;
type BackendStatus = "checking" | "connected" | "offline";

interface LastSubmissionSnapshot {
  organisationId: string;
  organisationKey: string;
  firmType: FirmType;
  orgName: string;
  totalScore: number;
  readinessLevel: string;
  submissionCount: number;
}

interface AdminDraft {
  orgName: string;
  directorEmail: string;
  expectedRespondents: string;
}

type AdminDraftState = Record<string, AdminDraft>;

interface PublicDashboardCacheEntry {
  data: PublicDashboardResponse;
  cachedAt: number;
}

const RESPONDENT_STORAGE_KEY = "elite-frontend:respondent";
const ANSWERS_STORAGE_KEY = "elite-frontend:answers";
const LAST_SUBMISSION_STORAGE_KEY = "elite-frontend:last-submission";
const ADMIN_SECRET_STORAGE_KEY = "elite-frontend:admin-secret";
const ANSWER_OWNER_STORAGE_KEY = "elite-frontend:answer-owner";
const PUBLIC_DASHBOARD_STORAGE_KEY = "elite-frontend:public-dashboard";
const MARKETING_SITE_URL = (
  process.env.NEXT_PUBLIC_MARKETING_SITE_URL || "https://eliteglobalai.com"
).replace(/\/$/, "");
const COMPLETION_REDIRECT_DELAY_MS = 6000;
const PUBLIC_DASHBOARD_CACHE_TTL_MS = 30_000;
const PUBLIC_DASHBOARD_PREFETCH_DELAY_MS = 1200;
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
  consentAccepted: false
};

const ADMIN_NOTES = [
  "Review response counts and readiness scores before sending the final report.",
  "Capture the correct director email and expected respondent count per organisation.",
  "Generate and send the PDF report only when you are satisfied with the aggregate data."
];

const ROLE_OPTIONS: Array<{ value: RoleLevel; label: string }> = [
  { value: "c-suite", label: "C-Suite" },
  { value: "manager", label: "Manager" },
  { value: "ic", label: "Individual Contributor" }
];

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

  if (normalizedPath === "/dashboard") {
    return { name: "dashboard" };
  }

  if (normalizedPath === "/complete") {
    return { name: "complete" };
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

function isCompleteDraft(
  draft: SubmissionDraft
): draft is Omit<SubmissionDraft, "firmType" | "role" | "consentAccepted"> & {
  firmType: FirmType;
  role: RoleLevel;
  consentAccepted: true;
} {
  return Boolean(
    draft.firmType &&
      draft.orgName.trim() &&
      draft.email.trim() &&
      draft.name.trim() &&
      draft.role &&
      draft.dept.trim() &&
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
    draft.email.trim().toLowerCase(),
    draft.name.trim().toLowerCase(),
    draft.role,
    draft.dept.trim().toLowerCase()
  ].join("|");
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
  const [formData, setFormData] = useState<SubmissionDraft>(() => ({
    ...EMPTY_ENTRY_DRAFT,
    ...readStorage<Partial<SubmissionDraft>>(RESPONDENT_STORAGE_KEY, {})
  }));
  const [answers, setAnswers] = useState<AnswerState>(() =>
    readStorage<AnswerState>(ANSWERS_STORAGE_KEY, {})
  );
  const [lastSubmission, setLastSubmission] = useState<LastSubmissionSnapshot | null>(() =>
    readStorage<LastSubmissionSnapshot | null>(LAST_SUBMISSION_STORAGE_KEY, null)
  );
  const [answerOwnerSignature, setAnswerOwnerSignature] = useState(() =>
    readStorage<string>(ANSWER_OWNER_STORAGE_KEY, "")
  );
  const [entryError, setEntryError] = useState("");
  const [entryLoading, setEntryLoading] = useState(false);
  const [entryNotice, setEntryNotice] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [drafts, setDrafts] = useState<AdminDraftState>({});
  const [adminLoading, setAdminLoading] = useState(false);
  const [secretInput, setSecretInput] = useState(() =>
    typeof window === "undefined"
      ? ""
      : window.sessionStorage.getItem(ADMIN_SECRET_STORAGE_KEY) || ""
  );
  const [secret, setSecret] = useState(() =>
    typeof window === "undefined"
      ? ""
      : window.sessionStorage.getItem(ADMIN_SECRET_STORAGE_KEY) || ""
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
  const assessmentViewportRef = useRef<HTMLDivElement | null>(null);
  const assessmentContentRef = useRef<HTMLDivElement | null>(null);
  const [assessmentScale, setAssessmentScale] = useState(1);
  const [assessmentScaledHeight, setAssessmentScaledHeight] = useState<number | null>(null);

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
  const currentDimensionQuestions = question
    ? activeQuestions.filter((item) => item.dimension === question.dimension)
    : [];
  const currentDimensionIndex = question
    ? currentDimensionQuestions.findIndex((item) => item.id === question.id)
    : -1;
  const apiHealthUrl = buildApiUrl(BACKEND_ENDPOINTS.health.check);
  const isLandingSurface = route.name === "landing" || route.name === "start";

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

    if (route.name === "start" || menuOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [route, menuOpen]);

  useEffect(() => {
    if (route.name !== "start") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        navigate("/");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [route]);

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
    if (typeof window === "undefined") {
      return;
    }
    if (secret) {
      window.sessionStorage.setItem(ADMIN_SECRET_STORAGE_KEY, secret);
    } else {
      window.sessionStorage.removeItem(ADMIN_SECRET_STORAGE_KEY);
    }
  }, [secret]);

  useEffect(() => {
    if (route.name === "assessment" && !isCompleteDraft(formData)) {
      navigate("/start", true);
    }
  }, [route, formData]);

  useEffect(() => {
    if (route.name === "admin" && secret && !isAuthed) {
      void fetchOrgs(secret);
    }
  }, [route, secret, isAuthed]);

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
    if (route.name !== "complete") {
      return;
    }
    const timer = window.setTimeout(() => {
      window.location.assign(MARKETING_SITE_URL);
    }, COMPLETION_REDIRECT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [route]);

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

  function navigate(path: string, replace = false) {
    if (typeof window === "undefined") {
      return;
    }

    setMenuOpen(false);

    if (replace) {
      window.history.replaceState({}, "", path);
    } else if (window.location.pathname !== path) {
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

  const updateFormField = <K extends keyof SubmissionDraft>(key: K, value: SubmissionDraft[K]) => {
    if (key === "email") {
      setEntryNotice("");
    }
    if (entryError) {
      setEntryError("");
    }
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const validateEmailInput = async (emailToValidate: string) => {
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
      updateFormField("email", result.normalizedEmail);
      setEntryNotice("Email validated successfully.");
      return result;
    } catch (error) {
      setEntryError(getErrorMessage(error, "Connection error. Please try again."));
      return null;
    } finally {
      setEntryLoading(false);
    }
  };

  const handleStartAssessment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEntryError("");
    setEntryNotice("");

    if (!formData.name.trim()) {
      setEntryError("Full name is required.");
      return;
    }
    if (!formData.firmType) {
      setEntryError("Select the type of firm before continuing.");
      return;
    }
    if (!formData.orgName.trim()) {
      setEntryError("Organisation name is required.");
      return;
    }
    if (!formData.role) {
      setEntryError("Select a role level before continuing.");
      return;
    }
    if (!formData.dept.trim()) {
      setEntryError("Department is required.");
      return;
    }
    if (!formData.consentAccepted) {
      setEntryError("You must accept the consent statement before continuing.");
      return;
    }

    const validation = await validateEmailInput(formData.email);
    if (!validation?.normalizedEmail) {
      return;
    }

    const nextDraft: SubmissionDraft = { ...formData, email: validation.normalizedEmail };
    const nextOwnerSignature = buildAnswerOwnerSignature(nextDraft);
    const shouldResetAnswers =
      Boolean(answerOwnerSignature) &&
      answerOwnerSignature !== nextOwnerSignature &&
      Object.keys(answers).length > 0;

    if (shouldResetAnswers) {
      setAnswers({});
    }

    setAnswerOwnerSignature(nextOwnerSignature);
    navigate(`/assessment/${shouldResetAnswers ? 1 : getNextIncompleteStep(activeQuestions, answers)}`);
  };

  const handleSelect = (value: string) => {
    if (!question) {
      return;
    }

    setSubmissionError("");
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

    if (!question.multiSelect && currentStep < totalSteps) {
      window.setTimeout(() => navigate(`/assessment/${currentStep + 1}`), 220);
    }
  };

  const clearAssessmentStorage = () => {
    removeStorage(RESPONDENT_STORAGE_KEY);
    removeStorage(ANSWERS_STORAGE_KEY);
    removeStorage(ANSWER_OWNER_STORAGE_KEY);
    setFormData(EMPTY_ENTRY_DRAFT);
    setAnswers({});
    setAnswerOwnerSignature("");
  };

  const handleFinish = async () => {
    if (!isCompleteDraft(formData)) {
      navigate("/start");
      return;
    }

    const missingQuestion = activeQuestions.find((item) => !hasAnswerValue(answers[item.id]));
    if (missingQuestion) {
      setSubmissionError("Please answer every question before submitting.");
      navigate(`/assessment/${missingQuestion.id}`);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError("");

    try {
      const response = await backendApi.assessment.submit({
        firmType: formData.firmType,
        orgName: formData.orgName,
        respondentEmail: formData.email,
        respondentName: formData.name,
        respondentRole: formData.role,
        respondentDept: formData.dept,
        consentAccepted: true,
        answers: activeQuestions.map((item) => ({
          questionId: item.id,
          value: answers[item.id]
        }))
      });

      setLastSubmission({
        organisationId: response.organisationId,
        organisationKey: response.organisationKey,
        firmType: response.firmType,
        orgName: formData.orgName,
        totalScore: response.respondentScore.totalScore,
        readinessLevel: response.respondentScore.readinessLevel,
        submissionCount: response.organisationStatus.submissionCount
      });

      removeStorage(PUBLIC_DASHBOARD_STORAGE_KEY);
      setPublicDashboard(null);
      setPublicDashboardFetchedAt(null);
      clearAssessmentStorage();
      navigate("/complete");
    } catch (error) {
      setSubmissionError(getErrorMessage(error, "Failed to submit. Please try again."));
      setIsSubmitting(false);
    }
  };

  const fetchOrgs = async (providedSecret = secret) => {
    if (!providedSecret.trim()) {
      setAdminError("Enter the admin secret to continue.");
      setAdminLoading(false);
      return;
    }

    setAdminLoading(true);
    setAdminError("");

    try {
      const data = await backendApi.admin.organisations.list(providedSecret);
      setOrgs(data.organisations);
      setDrafts(buildAdminDrafts(data.organisations));
      setIsAuthed(true);
      setSecret(providedSecret);
      setSecretInput(providedSecret);
      window.sessionStorage.setItem(ADMIN_SECRET_STORAGE_KEY, providedSecret);
    } catch (error) {
      setIsAuthed(false);
      setSecret("");
      window.sessionStorage.removeItem(ADMIN_SECRET_STORAGE_KEY);
      setAdminError(getErrorMessage(error, "Unable to access the admin dashboard."));
    } finally {
      setAdminLoading(false);
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

    const response = await backendApi.admin.organisations.update(secret, organisationId, payload);
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
      await fetchOrgs(secret);
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
      const blob = await backendApi.report.generate(secret, organisationId);
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
      await fetchOrgs(secret);
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
      const response = await backendApi.report.send(
        secret,
        organisationId,
        directorEmail ? { directorEmail } : undefined
      );
      await fetchOrgs(secret);
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

  const handleLogout = () => {
    window.sessionStorage.removeItem(ADMIN_SECRET_STORAGE_KEY);
    setSecret("");
    setSecretInput("");
    setIsAuthed(false);
    setOrgs([]);
    setDrafts({});
    setAdminError("");
    setAdminNotice("");
  };

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
            <button onClick={() => navigate("/start")} className={sharedButtonClasses}>
              Start Assessment
            </button>
          </div>
          <button className="p-2 md:hidden" onClick={() => setMenuOpen((current) => !current)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </>
      );
    }

    if (route.name === "assessment") {
      return (
        <>
          <div className="hidden items-center gap-3 text-sm font-medium tracking-wide text-stone-600 md:flex">
            <span className="rounded-full border border-blue-100 bg-white px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">
              Question {route.step} of {totalSteps}
            </span>
            <button
              onClick={() => navigate("/start")}
              className="rounded-full border border-stone-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-stone-600"
            >
              Entry
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
          <button onClick={() => navigate("/")} className="uppercase">
            Home
          </button>
          <button onClick={() => navigate("/dashboard")} className="uppercase">
            Dashboard
          </button>
          <button onClick={() => navigate("/start")} className="uppercase">
            Start
          </button>
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
            {[
              { label: "Home", description: "Return to the landing page", action: () => navigate("/") },
              { label: "Dashboard", description: "View public benchmark results", action: () => navigate("/dashboard") },
              { label: "Start Assessment", description: "Open the respondent entry flow", action: () => navigate("/start") }
            ].map((item) => (
              <button
                key={item.label}
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
                  onClick={() => navigate("/start")}
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
    const glassPanelClasses =
      "relative overflow-hidden rounded-[30px] border border-white/30 bg-white/[0.12] backdrop-blur-[28px] shadow-[0_22px_70px_rgba(15,23,42,0.08)]";
    const glassCardClasses =
      "rounded-[24px] border border-white/28 bg-white/[0.08] backdrop-blur-[24px] shadow-[0_16px_42px_rgba(15,23,42,0.06)]";
    const glassInsetClasses =
      "border border-white/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.04)_100%)] backdrop-blur-[24px] shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_14px_34px_rgba(15,23,42,0.04)]";
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
      <div className="relative min-h-screen overflow-hidden bg-[#F9F8F4] pt-24 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(219,234,254,0.6),transparent_28%),radial-gradient(circle_at_top_right,rgba(191,219,254,0.45),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(226,232,240,0.65),transparent_32%)]" />
        <div className="absolute right-[-8%] top-[14%] h-[24rem] w-[24rem] rounded-full bg-blue-100/55 blur-3xl md:h-[30rem] md:w-[30rem]" />
        <div className="absolute left-[-8%] top-[42%] h-[20rem] w-[20rem] rounded-full bg-white/40 blur-3xl md:h-[26rem] md:w-[26rem]" />

        <div className="relative mx-auto max-w-[min(98vw,1500px)] px-4 sm:px-6 lg:px-8">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className={`${glassPanelClasses} rounded-[28px] px-5 py-6 sm:rounded-[34px] sm:px-8 sm:py-8 lg:px-10 lg:py-10`}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.05),transparent_54%)]" />
            <div className="flex flex-col gap-6">
              <div className="relative">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.28 }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/[0.12] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-600 shadow-[0_12px_28px_rgba(15,23,42,0.04)] backdrop-blur-xl"
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
                    <span className="rounded-full border border-white/30 bg-white/[0.12] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500 backdrop-blur-xl">
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

                          <div className="mt-4 h-2.5 rounded-full bg-stone-100">
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

                      <div className="mt-5 h-3 rounded-full bg-white/20 ring-1 ring-white/35 backdrop-blur-md">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(topFirm.averageScore, 6)}%` }}
                          transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                          className={`h-full rounded-full bg-gradient-to-r ${getScoreTone(topFirm.averageScore).progress}`}
                        />
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/[0.12] px-3 py-1.5 backdrop-blur-xl">
                          <Users className="h-4 w-4" />
                          {topFirm.submissionCount} responses
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/[0.12] px-3 py-1.5 backdrop-blur-xl">
                          <CheckCircle2 className="h-4 w-4" />
                          {getReadinessLabel(topFirm.averageScore)}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/[0.12] px-3 py-1.5 backdrop-blur-xl">
                          <Clock3 className="h-4 w-4" />
                          Active since {formatDisplayDate(topFirm.createdAt)}
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex min-h-[16rem] items-center justify-center rounded-[28px] border border-dashed border-white/35 bg-white/[0.12] text-center backdrop-blur-xl">
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
                  <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
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
                  <div className="flex min-h-[14rem] items-center justify-center rounded-[28px] border border-dashed border-white/35 bg-white/[0.12] text-center backdrop-blur-xl">
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

  const renderStart = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/45 px-2 py-2 backdrop-blur-[6px] sm:px-4 sm:py-4"
      style={{
        paddingTop: "max(0.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(0.75rem, calc(env(safe-area-inset-bottom) + 0.5rem))"
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          navigate("/");
        }
      }}
    >
      <div className="mx-auto flex min-h-full w-full max-w-[44rem] items-start justify-center sm:items-center">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          className="w-full py-1 sm:py-0"
        >
          <div
            className="relative flex w-full flex-col overflow-hidden rounded-[22px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.97)_100%)] shadow-[0_45px_140px_rgba(15,23,42,0.28),0_16px_48px_rgba(15,23,42,0.14)] sm:rounded-[34px]"
            style={{
              maxHeight:
                "min(52rem, calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 1rem))"
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
            <button
              type="button"
              onClick={() => navigate("/")}
              className="absolute right-2.5 top-2.5 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/92 text-slate-500 shadow-[0_12px_32px_rgba(15,23,42,0.12)] transition-colors hover:text-slate-900 sm:right-4 sm:top-4 sm:h-11 sm:w-11"
              aria-label="Close assessment entry modal"
            >
              <X className="h-5 w-5" />
            </button>

            <form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={(event) => { void handleStartAssessment(event); }}
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-3.5 pb-3 pt-14 overscroll-contain sm:px-8 sm:pb-5 sm:pt-8">
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid gap-3 md:grid-cols-2 sm:gap-4">
                    <div className="space-y-2">
                      <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400 sm:text-[12px]">
                        Type of Firm
                      </label>
                      <select
                        className="w-full rounded-[18px] border border-stone-200/90 bg-white px-4 py-3.5 text-[15px] font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 sm:rounded-[22px] sm:px-5 sm:py-4"
                        value={formData.firmType}
                        onChange={(event) => updateFormField("firmType", event.target.value as FirmType | "")}
                      >
                        <option value="">Select firm type</option>
                        {FIRM_TYPE_OPTIONS.map((firmOption) => (
                          <option key={firmOption.value} value={firmOption.value}>
                            {firmOption.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400 sm:text-[12px]">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        className="w-full rounded-[18px] border border-stone-200/90 bg-white px-4 py-3.5 text-[15px] font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 sm:rounded-[22px] sm:px-5 sm:py-4"
                        value={formData.email}
                        onChange={(event) => updateFormField("email", event.target.value)}
                        onBlur={() => { void validateEmailInput(formData.email); }}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400 sm:text-[12px]">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Jane Doe"
                        className="w-full rounded-[18px] border border-stone-200/90 bg-white px-4 py-3.5 text-[15px] font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 sm:rounded-[22px] sm:px-5 sm:py-4"
                        value={formData.name}
                        onChange={(event) => updateFormField("name", event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400 sm:text-[12px]">
                        Organisation Name
                      </label>
                      <input
                        type="text"
                        placeholder="GTBank"
                        className="w-full rounded-[18px] border border-stone-200/90 bg-white px-4 py-3.5 text-[15px] font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 sm:rounded-[22px] sm:px-5 sm:py-4"
                        value={formData.orgName}
                        onChange={(event) => updateFormField("orgName", event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400 sm:text-[12px]">
                        Role Level
                      </label>
                      <select
                        className="w-full rounded-[18px] border border-stone-200/90 bg-white px-4 py-3.5 text-[15px] font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 sm:rounded-[22px] sm:px-5 sm:py-4"
                        value={formData.role}
                        onChange={(event) => updateFormField("role", event.target.value as RoleLevel | "")}
                      >
                        <option value="">Select role</option>
                        {ROLE_OPTIONS.map((roleOption) => (
                          <option key={roleOption.value} value={roleOption.value}>
                            {roleOption.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400 sm:text-[12px]">
                        Department
                      </label>
                      <input
                        type="text"
                        placeholder="Finance"
                        className="w-full rounded-[18px] border border-stone-200/90 bg-white px-4 py-3.5 text-[15px] font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 sm:rounded-[22px] sm:px-5 sm:py-4"
                        value={formData.dept}
                        onChange={(event) => updateFormField("dept", event.target.value)}
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-3 rounded-[18px] border border-stone-200/80 bg-stone-50/85 px-4 py-3.5 text-[14px] leading-6 text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:gap-4 sm:rounded-[22px] sm:px-5 sm:py-4 sm:text-[15px]">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-stone-300 text-blue-700 focus:ring-blue-200"
                      checked={formData.consentAccepted}
                      onChange={(event) => updateFormField("consentAccepted", event.target.checked)}
                    />
                    <span>
                      I consent to Elite Global AI processing my assessment data and
                      understand that only anonymised organisation-level results will be
                      visible in the final report.
                    </span>
                  </label>

                  {entryNotice ? (
                    <InlineBanner tone="success" message={entryNotice} onClose={() => setEntryNotice("")} />
                  ) : null}

                  {entryError ? (
                    <InlineBanner tone="error" message={entryError} onClose={() => setEntryError("")} />
                  ) : null}
                </div>
              </div>

              <div className="border-t border-white/65 bg-white/78 px-3.5 py-3 backdrop-blur-xl sm:px-8 sm:py-4">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                  <button
                    type="submit"
                    disabled={entryLoading}
                    className="inline-flex flex-1 items-center justify-center gap-3 rounded-full bg-blue-900 px-5 py-3 text-[15px] font-bold text-white shadow-[0_16px_38px_rgba(30,64,175,0.28)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 sm:px-6 sm:py-3.5 sm:text-[16px]"
                  >
                    {entryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue to Questions"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="inline-flex items-center justify-center rounded-full border border-stone-200 bg-white px-5 py-3 text-[15px] font-semibold text-stone-700 shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition-colors hover:border-stone-300 hover:text-stone-950 sm:py-3.5 sm:text-[16px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderAssessment = () => {
    if (!question || !isCompleteDraft(formData)) {
      return null;
    }

    const overallProgress = Math.max(4, Math.round((currentStep / totalSteps) * 100));
    const sectionProgress = currentDimensionQuestions.length
      ? Math.round(((currentDimensionIndex + 1) / currentDimensionQuestions.length) * 100)
      : 0;
    const roleLabel =
      ROLE_OPTIONS.find((option) => option.value === formData.role)?.label || formData.role;
    const selectionInstruction = question.multiSelect
      ? "Select every option that reflects the current reality of your team. Use “None of the above” only when no listed capability applies."
      : "Choose the single option that best describes how your team operates today, not the future target state.";

    return (
      <div className="relative min-h-screen overflow-hidden bg-[#F4F7FC] pt-20 pb-8 sm:pb-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(219,234,254,0.55),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(191,219,254,0.35),transparent_34%)]" />

        <div
          ref={assessmentViewportRef}
          className={`relative mx-auto max-w-[min(98vw,1500px)] px-2 pb-4 sm:px-4 lg:px-6 ${isMobileViewport ? "overflow-visible" : "overflow-hidden"}`}
        >
          <div style={{ height: assessmentScaledHeight ? `${assessmentScaledHeight}px` : undefined }}>
            <div
              ref={assessmentContentRef}
              className="origin-top-left"
              style={{
                transform: `scale(${assessmentScale})`,
                transformOrigin: "top left",
                width: assessmentScale < 1 ? `${100 / assessmentScale}%` : "100%"
              }}
            >
              <section className="mb-4 rounded-[20px] border border-blue-100 bg-white/95 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:rounded-[24px]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
                        {activeFirmTypeLabel}
                      </span>
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-blue-700">
                        {formData.orgName}
                      </span>
                      <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                        {roleLabel}
                      </span>
                      <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                        {formData.dept}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                        Question {currentStep} of {totalSteps}
                      </span>
                      <span className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                        {answeredCount} answered
                      </span>
                      <span className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                        Section {currentDimensionIndex + 1}/{currentDimensionQuestions.length}
                      </span>
                    </div>
                  </div>

                  <div className="w-full max-w-sm lg:min-w-[280px]">
                    <div className="mb-2 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                      <span>Overall Progress</span>
                      <span>{overallProgress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white shadow-inner ring-1 ring-stone-100">
                      <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${overallProgress}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      <span>{question.dimension}</span>
                      <span>{sectionProgress}% section</span>
                    </div>
                  </div>
                </div>
              </section>

              <AnimatePresence mode="wait">
                <motion.section
                  key={currentStep}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col rounded-[22px] border border-blue-100 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:rounded-[28px] sm:p-6"
                >
                  <div className="mb-5 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-700">
                        {question.dimension}
                      </span>
                      <span className={`rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] ${question.multiSelect ? "border-amber-200 bg-amber-50 text-amber-700" : "border-stone-200 bg-stone-50 text-slate-500"}`}>
                        {question.multiSelect ? "Multi-select" : "Single response"}
                      </span>
                    </div>

                    <h1 className="w-full font-serif text-[1.1rem] font-medium leading-[1.3] tracking-[0.01em] text-slate-950 sm:text-[1.42rem] lg:text-[1.68rem]">
                      {question.text}
                    </h1>

                    <p className="w-full text-sm leading-6 text-slate-600">{selectionInstruction}</p>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    {question.options.map((option, index) => {
                      const selected = question.multiSelect
                        ? Array.isArray(currentAnswer) && currentAnswer.includes(option.value)
                        : currentAnswer === option.value;
                      const optionMarker = question.multiSelect
                        ? String(index + 1).padStart(2, "0")
                        : option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleSelect(option.value)}
                          className={`group h-full w-full rounded-[18px] border px-4 py-3 text-left transition-all sm:rounded-[22px] ${selected ? "border-blue-500 bg-blue-50 shadow-[0_10px_24px_rgba(37,99,235,0.12)]" : "border-stone-200 bg-white hover:border-blue-200 hover:bg-blue-50/35"}`}
                        >
                          <div className="flex h-full items-start gap-3">
                            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-extrabold ${selected ? "border-blue-600 bg-blue-600 text-white" : "border-stone-200 bg-slate-50 text-slate-500"}`}>
                              {optionMarker}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex h-full flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <p className="text-[15px] font-semibold leading-6 text-slate-900 sm:text-base">
                                  {option.label}
                                </p>
                                  <div className={`inline-flex h-8 min-w-[78px] items-center justify-center rounded-full border px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] sm:min-w-[88px] ${selected ? "border-blue-600 bg-blue-600 text-white" : "border-stone-200 bg-white text-slate-400"}`}>
                                    {selected ? (
                                      <span className="inline-flex items-center gap-1.5">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Selected
                                      </span>
                                  ) : question.multiSelect ? "Add" : "Select"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {submissionError ? (
                    <div className="mt-4">
                      <InlineBanner tone="error" message={submissionError} onClose={() => setSubmissionError("")} className="rounded-2xl text-sm" />
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-col gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => currentStep === 1 ? navigate("/start") : navigate(`/assessment/${currentStep - 1}`)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 px-5 py-3 text-sm font-semibold text-stone-700"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </button>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      {currentStep < totalSteps ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/assessment/${currentStep + 1}`)}
                          disabled={!currentQuestionAnswered}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-900 px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Next Question
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { void handleFinish(); }}
                          disabled={!currentQuestionAnswered || isSubmitting}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-900 px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          Finish Assessment
                        </button>
                      )}
                    </div>
                  </div>
                </motion.section>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderComplete = () => (
    <div className="relative min-h-screen overflow-hidden bg-[#F9F8F4] pt-28 pb-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.85),rgba(249,248,244,0.9))]" />
      <div className="relative mx-auto max-w-4xl px-5 py-12 sm:px-8">
        <div className="rounded-[36px] border border-stone-200 bg-white p-8 text-center shadow-xl sm:p-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.24em] text-stone-400">
            Assessment Complete
          </p>
          <h1 className="mb-4 text-[2.2rem] text-stone-900 sm:text-5xl">
            Response recorded successfully
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg">
            Your submission has been saved to the backend and added to your organisation’s
            aggregated readiness record. Elite Global AI can now review the responses and
            send the final PDF report from the admin dashboard.
          </p>
          <p className="mx-auto mb-8 max-w-2xl text-sm font-medium leading-relaxed text-stone-500 sm:text-base">
            You will be redirected to the Elite Global AI website in a few seconds.
          </p>

          {lastSubmission ? (
            <div className="mx-auto mb-8 grid max-w-3xl gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-stone-400">
                  Organisation
                </p>
                <p className="text-lg font-semibold text-stone-900">{lastSubmission.orgName}</p>
                <p className="text-sm text-stone-500">{getFirmTypeLabel(lastSubmission.firmType)}</p>
              </div>
              <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-stone-400">
                  Score
                </p>
                <p className="text-lg font-semibold text-stone-900">{lastSubmission.totalScore}/100</p>
                <p className="text-sm text-stone-500">{lastSubmission.readinessLevel}</p>
              </div>
              <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-stone-400">
                  Responses
                </p>
                <p className="text-lg font-semibold text-stone-900">{lastSubmission.submissionCount}</p>
                <p className="text-sm text-stone-500">Now captured for this org</p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={() => window.location.assign(MARKETING_SITE_URL)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-900 px-6 py-3 text-sm font-bold text-white"
            >
              Go to Elite Global AI
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate("/start")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 px-6 py-3 text-sm font-semibold text-stone-700"
            >
              Start Another Response
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
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
                      Enter the internal admin secret from the backend environment to load
                      the organisation readiness dashboard.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2.5">
                      <label className="ml-1 text-[12px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                        Secure Access Token
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 font-mono text-[15px] font-medium text-slate-900"
                        value={secretInput}
                        onChange={(event) => setSecretInput(event.target.value)}
                      />
                    </div>

                    {adminError ? (
                      <InlineBanner tone="error" message={adminError} onClose={() => setAdminError("")} className="rounded-2xl" />
                    ) : null}

                    <button
                      onClick={() => { void fetchOrgs(secretInput); }}
                      disabled={adminLoading}
                      className="flex w-full items-center justify-center gap-3 rounded-full bg-blue-900 px-6 py-3 text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {adminLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Access Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </button>
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
                  Admin Dashboard
                </p>
                <h1 className="font-serif text-[1.62rem] font-medium leading-[1.04] tracking-[0.01em] text-slate-950 sm:text-[1.96rem] lg:text-[2.42rem]">
                  Organisation readiness overview
                </h1>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => { void fetchOrgs(secret); }}
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

          {adminLoading ? (
            <div className="rounded-[28px] border border-stone-200 bg-white p-12 text-center shadow-xl">
              <Loader2 className="mx-auto mb-4 h-6 w-6 animate-spin text-stone-700" />
              <p className="text-sm font-semibold text-stone-600">Loading organisation records...</p>
            </div>
          ) : orgs.length === 0 ? (
            <div className="rounded-[28px] border border-stone-200 bg-white p-12 text-center shadow-xl">
              <p className="text-lg font-semibold text-stone-900">No organisations yet</p>
              <p className="mt-2 text-sm text-stone-500">
                Once respondents submit assessments, the organisation records will appear here.
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
                        Preview PDF
                      </button>
                      <button
                        onClick={() => { void handleSendReport(organisation.id); }}
                        disabled={Boolean(busyKey)}
                        className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {busyKey === `send-${organisation.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Approve & Send Report
                      </button>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-5 text-[14px] text-stone-500">
                      <span className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {organisation.directorEmail || "No director email set yet"}
                      </span>
                      <span>Report sent: {formatReportDate(organisation.reportSentAt)}</span>
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

      {renderMobileMenu()}

      {isLandingSurface ? renderLanding() : null}
      {route.name === "dashboard" ? renderDashboard() : null}
      {route.name === "start" ? renderStart() : null}
      {route.name === "assessment" ? renderAssessment() : null}
      {route.name === "complete" ? renderComplete() : null}
      {route.name === "admin" ? renderAdmin() : null}

      {route.name !== "assessment" && route.name !== "start" ? (
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
                  <button type="button" onClick={() => navigate("/")} className="text-left font-medium text-slate-200">
                    Home
                  </button>
                  <button type="button" onClick={() => navigate("/dashboard")} className="text-left font-medium text-slate-200">
                    Public Dashboard
                  </button>
                  <button type="button" onClick={() => navigate("/start")} className="text-left font-medium text-slate-200">
                    Start Assessment
                  </button>
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
