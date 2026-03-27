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
  RoleLevel,
  SubmissionDraft
} from "@/lib/shared/types";

type AppRoute =
  | { name: "landing" }
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

const RESPONDENT_STORAGE_KEY = "elite-frontend:respondent";
const ANSWERS_STORAGE_KEY = "elite-frontend:answers";
const LAST_SUBMISSION_STORAGE_KEY = "elite-frontend:last-submission";
const ADMIN_SECRET_STORAGE_KEY = "elite-frontend:admin-secret";
const ANSWER_OWNER_STORAGE_KEY = "elite-frontend:answer-owner";
const MARKETING_SITE_URL = (
  process.env.NEXT_PUBLIC_MARKETING_SITE_URL || "https://eliteglobalai.com"
).replace(/\/$/, "");
const COMPLETION_REDIRECT_DELAY_MS = 6000;
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

const ENTRY_HIGHLIGHTS = [
  { icon: Clock3, label: "Time Commitment", value: "7-10 mins" },
  { icon: ShieldCheck, label: "Response Handling", value: "Anonymised in final report" },
  { icon: BarChart3, label: "Outcome", value: "Executive-grade readiness report" }
];

const ENTRY_STEPS = [
  "Share respondent details so the assessment can be attributed correctly.",
  "Complete 25 guided questions across readiness, leadership, workflow, and governance.",
  "Elite Global AI aggregates the submissions into one director-ready report."
];

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

function parseRoute(pathname: string): AppRoute {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";

  if (normalizedPath === "/") {
    return { name: "landing" };
  }

  if (normalizedPath === "/start") {
    return { name: "start" };
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

function hasAnswerValue(answer: unknown): boolean {
  if (Array.isArray(answer)) {
    return answer.length > 0;
  }

  return typeof answer === "string" && answer.trim().length > 0;
}

function isCompleteDraft(
  draft: SubmissionDraft
): draft is SubmissionDraft & { role: RoleLevel } {
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
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
  }, [route, currentStep, currentQuestionAnswered, submissionError]);

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

    if (route.name === "landing") {
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
          <button onClick={() => navigate("/start")} className="uppercase">
            Start
          </button>
          <button onClick={() => navigate("/admin")} className="uppercase">
            Admin
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
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-[#F9F8F4] text-xl font-serif">
        <button onClick={() => { setMenuOpen(false); navigate("/"); }}>Home</button>
        <button onClick={() => { setMenuOpen(false); navigate("/start"); }}>Start</button>
        <button onClick={() => { setMenuOpen(false); navigate("/admin"); }}>Admin</button>
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
              <h1 className="font-serif text-5xl font-medium leading-tight text-stone-900 md:text-7xl lg:text-[5.8rem] lg:leading-[0.9]">
                Elite Global AI <br />
                <span className="mt-4 block text-3xl font-normal italic text-stone-600 md:text-5xl">
                  AI Readiness Assessment Platform
                </span>
              </h1>
              <p className="mx-auto mt-8 max-w-2xl text-lg font-light leading-relaxed text-stone-700 md:text-xl">
                A B2B assessment experience for benchmarking organisational AI readiness across
                literacy, data readiness, strategy, workflow adoption, and governance.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => navigate("/start")}
                  className="rounded-full bg-stone-900 px-6 py-3 text-white shadow-lg transition-colors hover:bg-stone-800"
                >
                  Begin Assessment
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

            <div className="relative mx-auto -mt-10 h-[340px] w-full max-w-[560px] sm:-mt-12 sm:h-[430px] sm:max-w-[640px] lg:-mt-20 lg:h-[640px] lg:max-w-none">
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(191,219,254,0.7),rgba(255,255,255,0)_68%)] blur-3xl" />
              <SpinningGlobeScene className="relative h-full w-full" />
            </div>
          </div>
        </div>
      </header>

      <main>
        <section id="introduction" className="bg-white py-24">
          <div className="container mx-auto grid grid-cols-1 items-start gap-12 px-6 md:grid-cols-12 md:px-12">
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

        <section id="science" className="border-t border-stone-100 bg-white py-24">
          <div className="container mx-auto px-6">
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

        <section className="bg-[#F9F8F4] py-24">
          <div className="container mx-auto px-6">
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

        <section id="authors" className="border-t border-stone-300 bg-[#F5F4F0] py-24">
          <div className="container mx-auto px-6">
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

  const renderStart = () => (
    <div className="relative min-h-screen overflow-hidden bg-[#F9F8F4] pt-20 pb-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(219,234,254,0.55),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(191,219,254,0.4),transparent_32%)]" />
      <div className="relative mx-auto max-w-[min(98vw,1500px)] px-2 pt-2 pb-4 sm:px-4 lg:px-6">
        <section className="mb-4 rounded-[28px] border border-stone-200 bg-white/90 px-5 pb-5 pt-4 shadow-lg">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.85fr]">
            <div className="space-y-3">
              <h1 className="font-serif text-[1.62rem] font-medium leading-[1.04] tracking-[0.01em] text-slate-950 sm:text-[1.96rem] lg:text-[2.42rem]">
                Respondent entry for the organisation assessment.
              </h1>
              <p className="max-w-2xl text-[0.98rem] leading-7 tracking-[0.01em] text-slate-700 sm:text-[1.04rem]">
                Capture the respondent details once, then move through the 25-question
                diagnostic with backend validation, server-side scoring, and
                organisation-level aggregation.
              </p>
            </div>
            <div className="grid content-start gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {ENTRY_HIGHLIGHTS.map((item) => (
                <SummaryCard key={item.label} icon={item.icon} label={item.label} value={item.value} />
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-xl sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-900 font-serif text-sm font-bold text-white">
                  E
                </div>
                <div>
                  <p className="font-serif text-lg font-bold tracking-tight text-slate-950">
                    Respondent Entry
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Step 1 of 2
                  </p>
                </div>
              </div>

              <div className="mb-5 space-y-2">
                <h2 className="font-serif text-[1.42rem] font-medium text-slate-950 sm:text-[1.68rem]">
                  Welcome
                </h2>
                <p className="max-w-2xl text-[0.98rem] leading-7 text-slate-500 sm:text-[1.04rem]">
                  Provide the respondent information below before starting the
                  assessment. Select the firm type first so the correct questionnaire is
                  loaded for your organisation.
                </p>
              </div>

              <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { void handleStartAssessment(event); }}>
                <div className="space-y-2.5">
                  <label className="ml-1 text-[12px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                    Type of Firm
                  </label>
                  <select
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-[15px] font-medium text-slate-900"
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
                  {formData.firmType ? (
                    <p className="ml-1 text-[14px] leading-6 text-slate-500">
                      {FIRM_TYPE_OPTIONS.find((option) => option.value === formData.firmType)?.description}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2.5">
                  <label className="ml-1 text-[12px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-[15px] font-medium text-slate-900"
                    value={formData.email}
                    onChange={(event) => updateFormField("email", event.target.value)}
                    onBlur={() => { void validateEmailInput(formData.email); }}
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="ml-1 text-[12px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-[15px] font-medium text-slate-900"
                    value={formData.name}
                    onChange={(event) => updateFormField("name", event.target.value)}
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="ml-1 text-[12px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                    Organisation Name
                  </label>
                  <input
                    type="text"
                    placeholder="GTBank"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-[15px] font-medium text-slate-900"
                    value={formData.orgName}
                    onChange={(event) => updateFormField("orgName", event.target.value)}
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="ml-1 text-[12px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                    Role Level
                  </label>
                  <select
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-[15px] font-medium text-slate-900"
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

                <div className="space-y-2.5">
                  <label className="ml-1 text-[12px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="Finance"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-[15px] font-medium text-slate-900"
                    value={formData.dept}
                    onChange={(event) => updateFormField("dept", event.target.value)}
                  />
                </div>

                <label className="md:col-span-2 flex items-start gap-4 rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-[15px] leading-6 text-slate-600">
                  <input
                    type="checkbox"
                    className="mt-1"
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
                  <div className="md:col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[15px] font-semibold text-emerald-700">
                    {entryNotice}
                  </div>
                ) : null}

                {entryError ? (
                  <div className="md:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[15px] font-semibold text-red-700">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{entryError}</span>
                    </div>
                  </div>
                ) : null}

                <div className="md:col-span-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={entryLoading}
                    className="flex flex-1 items-center justify-center gap-3 rounded-full bg-blue-900 px-6 py-3 text-[16px] font-bold text-white"
                  >
                    {entryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Assessment"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="rounded-full border border-stone-200 px-5 py-3 text-[16px] font-semibold text-stone-700"
                  >
                    Home
                  </button>
                </div>
              </form>
            </div>

            <aside className="space-y-4">
              <div className="rounded-[24px] border border-blue-100 bg-blue-50/60 p-6">
                <p className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
                  What Happens Next
                </p>
                <div className="space-y-3">
                  {ENTRY_STEPS.map((step, index) => (
                    <div key={step} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white">
                        {index + 1}
                      </div>
                      <p className="text-[14px] leading-6 text-slate-700">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-6">
                <div className="mb-3 flex items-center gap-3 text-slate-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold">Assessment guidance</p>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                      Recommended volume
                    </p>
                  </div>
                </div>
                <p className="text-[14px] leading-6 text-slate-700">
                  Best run with 5 to 20 respondents per organisation so the director
                  receives a credible cross-functional view rather than a single-person
                  opinion.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </div>
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
      <div className="relative min-h-screen overflow-hidden bg-[#F4F7FC] pt-20 pb-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(219,234,254,0.55),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(191,219,254,0.35),transparent_34%)]" />

        <div ref={assessmentViewportRef} className="relative mx-auto max-w-[min(98vw,1500px)] overflow-hidden px-2 pb-4 sm:px-4 lg:px-6">
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
              <section className="mb-4 rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
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
                  className="flex flex-col rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6"
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

                    <h1 className="w-full font-serif text-[1.22rem] font-medium leading-[1.24] tracking-[0.01em] text-slate-950 sm:text-[1.42rem] lg:text-[1.68rem]">
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
                          className={`group h-full w-full rounded-[22px] border px-4 py-3 text-left transition-all ${selected ? "border-blue-500 bg-blue-50 shadow-[0_10px_24px_rgba(37,99,235,0.12)]" : "border-stone-200 bg-white hover:border-blue-200 hover:bg-blue-50/35"}`}
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
                                <div className={`inline-flex h-8 min-w-[88px] items-center justify-center rounded-full border px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] ${selected ? "border-blue-600 bg-blue-600 text-white" : "border-stone-200 bg-white text-slate-400"}`}>
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
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{submissionError}</span>
                      </div>
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
          <h1 className="mb-4 text-4xl text-stone-900 sm:text-5xl">
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
            <section className="mb-4 rounded-[28px] border border-stone-200 bg-white/90 px-5 pb-5 pt-4 shadow-lg">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.85fr]">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.2em] text-blue-700">
                      Delivery Workflow
                    </span>
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.2em] text-stone-500">
                      Internal Operations
                    </span>
                  </div>
                  <div className="max-w-3xl space-y-3">
                    <h1 className="font-serif text-[1.62rem] font-medium leading-[1.04] tracking-[0.01em] text-slate-950 sm:text-[1.96rem] lg:text-[2.42rem]">
                      Review the aggregate, validate the recipient, then release the report.
                    </h1>
                    <p className="max-w-2xl text-[0.98rem] leading-7 tracking-[0.01em] text-slate-700 sm:text-[1.04rem]">
                      This console is for Elite Global AI operations only. Use it to manage
                      organisation readiness records, preview the PDF, and send the final
                      report to the right director.
                    </p>
                  </div>
                </div>

                <div className="grid content-start gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  <SummaryCard icon={ShieldCheck} label="Access" value="Protected by shared admin token" />
                  <SummaryCard icon={BarChart3} label="Visibility" value="Aggregate scores before final delivery" />
                  <SummaryCard icon={Send} label="Output" value="Director-ready PDF report via email" />
                </div>
              </div>
            </section>

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
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{adminError}</span>
                        </div>
                      </div>
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
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] font-semibold text-emerald-700">
                {adminNotice}
              </div>
            ) : null}
            {adminError ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{adminError}</span>
                </div>
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

  return (
    <div className="min-h-screen bg-[#F9F8F4] text-stone-800 selection:bg-nobel-gold selection:text-white">
      <nav className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#F9F8F4]/90 py-4 shadow-sm backdrop-blur-md" : "bg-transparent py-6"}`}>
        <div className="container mx-auto flex items-center justify-between px-6">
          <div className="flex cursor-pointer items-center gap-4" onClick={() => navigate("/")}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-nobel-gold pb-1 text-xl font-serif font-bold text-white shadow-sm">
              E
            </div>
            <span className={`font-serif text-lg font-bold tracking-wide transition-opacity ${scrolled || route.name !== "landing" ? "opacity-100" : "opacity-0 md:opacity-100"}`}>
              ELITE GLOBAL AI <span className="font-normal text-stone-500">Assessment</span>
            </span>
          </div>
          {renderTopNav()}
        </div>
      </nav>

      {renderMobileMenu()}

      {route.name === "landing" ? renderLanding() : null}
      {route.name === "start" ? renderStart() : null}
      {route.name === "assessment" ? renderAssessment() : null}
      {route.name === "complete" ? renderComplete() : null}
      {route.name === "admin" ? renderAdmin() : null}

      {route.name !== "assessment" && route.name !== "start" ? (
        <footer className="border-t border-slate-800 bg-[#0f172a] text-slate-300">
          <div className="container mx-auto px-6 py-14">
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
                  <button type="button" onClick={() => navigate("/start")} className="text-left font-medium text-slate-200">
                    Start Assessment
                  </button>
                  <button type="button" onClick={() => navigate("/admin")} className="text-left font-medium text-slate-200">
                    Admin Console
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
