/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SurfaceCodeDiagram, PerformanceMetricDiagram } from './components/Diagrams';
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
  FileText,
  Loader2,
  LogOut,
  Mail,
  Menu,
  Send,
  ShieldCheck,
  Users,
  X
} from 'lucide-react';

import { ApiError, buildApiUrl } from './lib/api';
import { BACKEND_ENDPOINTS, backendApi } from './lib/backend';
import { ASSESSMENT_QUESTIONS } from './data/questions';
import type {
  Organisation,
  RoleLevel,
  SubmissionDraft
} from './types';

type AppRoute =
  | { name: 'landing' }
  | { name: 'start' }
  | { name: 'assessment'; step: number }
  | { name: 'complete' }
  | { name: 'admin' };

type AnswerState = Record<number, string | string[]>;
type BackendStatus = 'checking' | 'connected' | 'offline';

interface LastSubmissionSnapshot {
  organisationId: string;
  organisationKey: string;
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

const RESPONDENT_STORAGE_KEY = 'elite-frontend:respondent';
const ANSWERS_STORAGE_KEY = 'elite-frontend:answers';
const LAST_SUBMISSION_STORAGE_KEY = 'elite-frontend:last-submission';
const ADMIN_SECRET_STORAGE_KEY = 'elite-frontend:admin-secret';
const ANSWER_OWNER_STORAGE_KEY = 'elite-frontend:answer-owner';

const EMPTY_ENTRY_DRAFT: SubmissionDraft = {
  orgName: '',
  email: '',
  name: '',
  role: '',
  dept: '',
  consentAccepted: false
};

const ENTRY_HIGHLIGHTS = [
  {
    icon: Clock3,
    label: 'Time Commitment',
    value: '7-10 mins'
  },
  {
    icon: ShieldCheck,
    label: 'Response Handling',
    value: 'Anonymised in final report'
  },
  {
    icon: BarChart3,
    label: 'Outcome',
    value: 'Executive-grade readiness report'
  }
];

const ENTRY_STEPS = [
  'Share respondent details so the assessment can be attributed correctly.',
  'Complete 25 guided questions across readiness, leadership, workflow, and governance.',
  'Elite Global AI aggregates the submissions into one director-ready report.'
];

const DIAGNOSTIC_NOTES = [
  'Choose the answer that best reflects your team today, not the aspirational future state.',
  'Responses contribute only to organisation-level reporting; individual answers stay internal.',
  'Use the final question action to submit the full assessment.'
];

const ADMIN_NOTES = [
  'Review response counts and readiness scores before sending the final report.',
  'Capture the correct director email and expected respondent count per organisation.',
  'Generate and send the PDF report only when you are satisfied with the aggregate data.'
];

const ROLE_OPTIONS: Array<{ value: RoleLevel; label: string }> = [
  { value: 'c-suite', label: 'C-Suite' },
  { value: 'manager', label: 'Manager' },
  { value: 'ic', label: 'Individual Contributor' }
];

const statusBadgeClasses: Record<Organisation['status'], string> = {
  collecting: 'border-stone-200 bg-white text-stone-600',
  ready: 'border-amber-200 bg-amber-50 text-amber-700',
  approved: 'border-blue-200 bg-blue-50 text-blue-700',
  sent: 'border-emerald-200 bg-emerald-50 text-emerald-700'
};

const AuthorCard = ({ name, role, delay }: { name: string; role: string; delay: string }) => {
  return (
    <div className="flex flex-col group animate-fade-in-up items-center p-8 bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 w-full max-w-xs hover:border-nobel-gold/50" style={{ animationDelay: delay }}>
      <h3 className="font-serif text-2xl text-stone-900 text-center mb-3">{name}</h3>
      <div className="w-12 h-0.5 bg-nobel-gold mb-4 opacity-60"></div>
      <p className="text-xs text-stone-500 font-bold uppercase tracking-widest text-center leading-relaxed">{role}</p>
    </div>
  );
};

const SummaryCard = ({
  icon: Icon,
  label,
  value
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) => {
  return (
    <div className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="text-base font-semibold leading-7 text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

function parseRoute(pathname: string): AppRoute {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

  if (normalizedPath === '/') {
    return { name: 'landing' };
  }

  if (normalizedPath === '/start') {
    return { name: 'start' };
  }

  if (normalizedPath === '/complete') {
    return { name: 'complete' };
  }

  if (normalizedPath === '/admin') {
    return { name: 'admin' };
  }

  const assessmentMatch = normalizedPath.match(/^\/assessment\/(\d+)$/);

  if (assessmentMatch) {
    const step = Number(assessmentMatch[1]);

    if (step >= 1 && step <= ASSESSMENT_QUESTIONS.length) {
      return { name: 'assessment', step };
    }
  }

  return { name: 'landing' };
}

function getCurrentRoute(): AppRoute {
  if (typeof window === 'undefined') {
    return { name: 'landing' };
  }

  return parseRoute(window.location.pathname);
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
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
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeStorage(key: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(key);
}

function hasAnswerValue(answer: unknown): boolean {
  if (Array.isArray(answer)) {
    return answer.length > 0;
  }

  return typeof answer === 'string' && answer.trim().length > 0;
}

function isCompleteDraft(draft: SubmissionDraft): draft is SubmissionDraft & { role: RoleLevel } {
  return Boolean(
    draft.orgName.trim() &&
      draft.email.trim() &&
      draft.name.trim() &&
      draft.role &&
      draft.dept.trim() &&
      draft.consentAccepted
  );
}

function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function getNextIncompleteStep(answers: AnswerState): number {
  const firstIncomplete = ASSESSMENT_QUESTIONS.findIndex((question) => !hasAnswerValue(answers[question.id]));
  return firstIncomplete === -1 ? ASSESSMENT_QUESTIONS.length : firstIncomplete + 1;
}

function buildAdminDrafts(organisations: Organisation[]): AdminDraftState {
  return organisations.reduce<AdminDraftState>((accumulator, organisation) => {
    accumulator[organisation.id] = {
      orgName: organisation.orgName,
      directorEmail: organisation.directorEmail || '',
      expectedRespondents: organisation.expectedRespondents ? String(organisation.expectedRespondents) : ''
    };
    return accumulator;
  }, {});
}

function getReadinessLabel(total: number): string {
  if (total <= 30) {
    return 'Low';
  }
  if (total <= 54) {
    return 'Developing';
  }
  if (total <= 74) {
    return 'Moderate';
  }
  if (total <= 89) {
    return 'Advanced';
  }
  return 'Leading';
}

function formatReportDate(value: string | null): string {
  if (!value) {
    return 'Not sent yet';
  }

  return new Date(value).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
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
    draft.orgName.trim().toLowerCase(),
    draft.email.trim().toLowerCase(),
    draft.name.trim().toLowerCase(),
    draft.role,
    draft.dept.trim().toLowerCase()
  ].join('|');
}

const App: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [route, setRoute] = useState<AppRoute>(getCurrentRoute);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');
  const [backendEnvironment, setBackendEnvironment] = useState('');
  const [backendService, setBackendService] = useState('');
  const [formData, setFormData] = useState<SubmissionDraft>(() =>
    readStorage<SubmissionDraft>(RESPONDENT_STORAGE_KEY, EMPTY_ENTRY_DRAFT)
  );
  const [answers, setAnswers] = useState<AnswerState>(() =>
    readStorage<AnswerState>(ANSWERS_STORAGE_KEY, {})
  );
  const [lastSubmission, setLastSubmission] = useState<LastSubmissionSnapshot | null>(() =>
    readStorage<LastSubmissionSnapshot | null>(LAST_SUBMISSION_STORAGE_KEY, null)
  );
  const [answerOwnerSignature, setAnswerOwnerSignature] = useState(() =>
    readStorage<string>(ANSWER_OWNER_STORAGE_KEY, '')
  );
  const [entryError, setEntryError] = useState('');
  const [entryLoading, setEntryLoading] = useState(false);
  const [entryNotice, setEntryNotice] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [drafts, setDrafts] = useState<AdminDraftState>({});
  const [adminLoading, setAdminLoading] = useState(false);
  const [secretInput, setSecretInput] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return window.sessionStorage.getItem(ADMIN_SECRET_STORAGE_KEY) || '';
  });
  const [secret, setSecret] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return window.sessionStorage.getItem(ADMIN_SECRET_STORAGE_KEY) || '';
  });
  const [isAuthed, setIsAuthed] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminNotice, setAdminNotice] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const totalSteps = ASSESSMENT_QUESTIONS.length;
  const currentStep = route.name === 'assessment' ? route.step : 1;
  const question = route.name === 'assessment' ? ASSESSMENT_QUESTIONS[currentStep - 1] : null;
  const answeredCount = useMemo(
    () => ASSESSMENT_QUESTIONS.filter((item) => hasAnswerValue(answers[item.id])).length,
    [answers]
  );
  const currentAnswer = question ? answers[question.id] : undefined;
  const currentQuestionAnswered = hasAnswerValue(currentAnswer);
  const currentDimensionQuestions = question
    ? ASSESSMENT_QUESTIONS.filter((item) => item.dimension === question.dimension)
    : [];
  const currentDimensionIndex = question
    ? currentDimensionQuestions.findIndex((item) => item.id === question.id)
    : -1;
  const apiHealthUrl = buildApiUrl(BACKEND_ENDPOINTS.health.check);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handlePopState = () => setRoute(getCurrentRoute());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let active = true;

    backendApi.health
      .check()
      .then((response) => {
        if (!active) {
          return;
        }

        setBackendStatus('connected');
        setBackendEnvironment(response.environment);
        setBackendService(response.service);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setBackendStatus('offline');
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    writeStorage(RESPONDENT_STORAGE_KEY, formData);
  }, [formData]);

  useEffect(() => {
    writeStorage(ANSWERS_STORAGE_KEY, answers);
  }, [answers]);

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
    if (secret) {
      window.sessionStorage.setItem(ADMIN_SECRET_STORAGE_KEY, secret);
    } else {
      window.sessionStorage.removeItem(ADMIN_SECRET_STORAGE_KEY);
    }
  }, [secret]);

  useEffect(() => {
    if (route.name === 'assessment' && !isCompleteDraft(formData)) {
      navigate('/start', true);
    }
  }, [route, formData]);

  useEffect(() => {
    if (route.name === 'admin' && secret && !isAuthed) {
      void fetchOrgs(secret);
    }
  }, [route, secret, isAuthed]);

  const totalSubmissions = orgs.reduce((total, organisation) => total + organisation.submissionCount, 0);
  const reportsSent = orgs.filter((organisation) => organisation.status === 'sent').length;
  const averageScore = orgs.length
    ? orgs.reduce((total, organisation) => total + organisation.aggregatedScores.total, 0) / orgs.length
    : 0;

  function navigate(path: string, replace = false) {
    if (typeof window === 'undefined') {
      return;
    }

    if (replace) {
      window.history.replaceState({}, '', path);
    } else if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }

    setRoute(parseRoute(path));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function scrollToSection(id: string) {
    const element = document.getElementById(id);

    if (!element) {
      return;
    }

    const headerOffset = 100;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }

  const goToSection = (id: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    setMenuOpen(false);

    if (route.name !== 'landing') {
      navigate('/', false);
      window.setTimeout(() => scrollToSection(id), 120);
      return;
    }

    scrollToSection(id);
  };

  const updateFormField = <K extends keyof SubmissionDraft>(key: K, value: SubmissionDraft[K]) => {
    if (key === 'email') {
      setEntryNotice('');
    }

    if (entryError) {
      setEntryError('');
    }

    setFormData((current) => ({
      ...current,
      [key]: value
    }));
  };

  const validateEmailInput = async (emailToValidate: string) => {
    if (!emailToValidate.trim()) {
      return null;
    }

    setEntryLoading(true);
    setEntryError('');

    try {
      const result = await backendApi.assessment.validateEmail(emailToValidate);

      if (!result.valid || !result.normalizedEmail) {
        setEntryNotice('');
        setEntryError(result.reason || 'Please use a valid email address.');
        return null;
      }

      updateFormField('email', result.normalizedEmail);
      setEntryNotice('Email validated successfully.');
      return result;
    } catch (error) {
      setEntryError(getErrorMessage(error, 'Connection error. Please try again.'));
      return null;
    } finally {
      setEntryLoading(false);
    }
  };

  const handleStartAssessment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEntryError('');
    setEntryNotice('');

    if (!formData.name.trim()) {
      setEntryError('Full name is required.');
      return;
    }

    if (!formData.orgName.trim()) {
      setEntryError('Organisation name is required.');
      return;
    }

    if (!formData.role) {
      setEntryError('Select a role level before continuing.');
      return;
    }

    if (!formData.dept.trim()) {
      setEntryError('Department is required.');
      return;
    }

    if (!formData.consentAccepted) {
      setEntryError('You must accept the consent statement before continuing.');
      return;
    }

    const validation = await validateEmailInput(formData.email);

    if (!validation?.normalizedEmail) {
      return;
    }

    const nextDraft: SubmissionDraft = {
      ...formData,
      email: validation.normalizedEmail
    };
    const nextOwnerSignature = buildAnswerOwnerSignature(nextDraft);
    const shouldResetAnswers =
      Boolean(answerOwnerSignature) &&
      answerOwnerSignature !== nextOwnerSignature &&
      Object.keys(answers).length > 0;

    if (shouldResetAnswers) {
      setAnswers({});
    }

    setAnswerOwnerSignature(nextOwnerSignature);
    navigate(`/assessment/${shouldResetAnswers ? 1 : getNextIncompleteStep(answers)}`);
  };

  const handleSelect = (value: string) => {
    if (!question) {
      return;
    }

    setSubmissionError('');

    setAnswers((currentAnswers) => {
      const existing = currentAnswers[question.id];

      if (question.multiSelect) {
        const existingValues = Array.isArray(existing) ? existing : [];
        let nextValues: string[];

        if (value === 'none-of-the-above') {
          nextValues = ['none-of-the-above'];
        } else if (existingValues.includes(value)) {
          nextValues = existingValues.filter((option) => option !== value);
        } else {
          nextValues = [
            ...existingValues.filter((option) => option !== 'none-of-the-above'),
            value
          ];
        }

        return {
          ...currentAnswers,
          [question.id]: nextValues
        };
      }

      return {
        ...currentAnswers,
        [question.id]: value
      };
    });

    if (!question.multiSelect && currentStep < totalSteps) {
      window.setTimeout(() => {
        navigate(`/assessment/${currentStep + 1}`);
      }, 220);
    }
  };

  const clearAssessmentStorage = () => {
    removeStorage(RESPONDENT_STORAGE_KEY);
    removeStorage(ANSWERS_STORAGE_KEY);
    removeStorage(ANSWER_OWNER_STORAGE_KEY);
    setFormData(EMPTY_ENTRY_DRAFT);
    setAnswers({});
    setAnswerOwnerSignature('');
  };

  const handleFinish = async () => {
    if (!isCompleteDraft(formData)) {
      navigate('/start');
      return;
    }

    const missingQuestion = ASSESSMENT_QUESTIONS.find((item) => !hasAnswerValue(answers[item.id]));

    if (missingQuestion) {
      setSubmissionError('Please answer every question before submitting.');
      navigate(`/assessment/${missingQuestion.id}`);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError('');

    try {
      const response = await backendApi.assessment.submit({
        orgName: formData.orgName,
        respondentEmail: formData.email,
        respondentName: formData.name,
        respondentRole: formData.role,
        respondentDept: formData.dept,
        consentAccepted: true,
        answers: ASSESSMENT_QUESTIONS.map((item) => ({
          questionId: item.id,
          value: answers[item.id]
        }))
      });

      setLastSubmission({
        organisationId: response.organisationId,
        organisationKey: response.organisationKey,
        orgName: formData.orgName,
        totalScore: response.respondentScore.totalScore,
        readinessLevel: response.respondentScore.readinessLevel,
        submissionCount: response.organisationStatus.submissionCount
      });

      clearAssessmentStorage();
      navigate('/complete');
    } catch (error) {
      setSubmissionError(getErrorMessage(error, 'Failed to submit. Please try again.'));
      setIsSubmitting(false);
    }
  };

  const fetchOrgs = async (providedSecret = secret) => {
    if (!providedSecret.trim()) {
      setAdminError('Enter the admin secret to continue.');
      setAdminLoading(false);
      return;
    }

    setAdminLoading(true);
    setAdminError('');

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
      setSecret('');
      window.sessionStorage.removeItem(ADMIN_SECRET_STORAGE_KEY);
      setAdminError(getErrorMessage(error, 'Unable to access the admin dashboard.'));
    } finally {
      setAdminLoading(false);
    }
  };

  const updateDraft = (organisationId: string, field: keyof AdminDraft, value: string) => {
    setDrafts((current) => ({
      ...current,
      [organisationId]: {
        ...current[organisationId],
        [field]: value
      }
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
        throw new Error('Expected respondents must be a positive whole number.');
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
        directorEmail: response.organisation.directorEmail || '',
        expectedRespondents: response.organisation.expectedRespondents ? String(response.organisation.expectedRespondents) : ''
      }
    }));

    return response.organisation;
  };

  const handleSaveOrg = async (organisationId: string) => {
    setBusyKey(`save-${organisationId}`);
    setAdminError('');
    setAdminNotice('');

    try {
      const organisation = await saveOrganisation(organisationId);
      await fetchOrgs(secret);
      if (organisation) {
        setAdminNotice(`Saved settings for ${organisation.orgName}.`);
      }
    } catch (error) {
      setAdminError(getErrorMessage(error, 'Failed to update organisation.'));
    } finally {
      setBusyKey(null);
    }
  };

  const handlePreviewReport = async (organisationId: string) => {
    setBusyKey(`preview-${organisationId}`);
    setAdminError('');
    setAdminNotice('');
    const previewWindow = window.open('', '_blank', 'noopener,noreferrer');

    try {
      const organisation = await saveOrganisation(organisationId);
      const blob = await backendApi.report.generate(secret, organisationId);
      const previewUrl = URL.createObjectURL(blob);

      if (previewWindow && !previewWindow.closed) {
        previewWindow.location.href = previewUrl;
      } else {
        const link = document.createElement('a');
        link.href = previewUrl;
        link.download = `${organisation?.organisationKey || 'organisation-report'}.pdf`;
        link.click();
      }

      window.setTimeout(() => URL.revokeObjectURL(previewUrl), 60_000);
      await fetchOrgs(secret);
      setAdminNotice(`Generated preview for ${organisation?.orgName || 'organisation'}.`);
    } catch (error) {
      if (previewWindow && !previewWindow.closed) {
        previewWindow.close();
      }
      setAdminError(getErrorMessage(error, 'Failed to generate preview.'));
    } finally {
      setBusyKey(null);
    }
  };

  const handleSendReport = async (organisationId: string) => {
    setBusyKey(`send-${organisationId}`);
    setAdminError('');
    setAdminNotice('');

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
            expectedRespondents: current[organisationId]?.expectedRespondents || ''
          }
        }));
      }
    } catch (error) {
      setAdminError(getErrorMessage(error, 'Failed to send report.'));
    } finally {
      setBusyKey(null);
    }
  };

  const handleLogout = () => {
    window.sessionStorage.removeItem(ADMIN_SECRET_STORAGE_KEY);
    setSecret('');
    setSecretInput('');
    setIsAuthed(false);
    setOrgs([]);
    setDrafts({});
    setAdminError('');
    setAdminNotice('');
  };

  const renderTopNav = () => {
    const sharedButtonClasses = 'px-5 py-2 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors shadow-sm cursor-pointer';

    if (route.name === 'landing') {
      return (
        <>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-stone-600">
            <a href="#introduction" onClick={goToSection('introduction')} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase">Overview</a>
            <a href="#science" onClick={goToSection('science')} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase">Assessment</a>
            <a href="#authors" onClick={goToSection('authors')} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase">Users</a>
            <button onClick={() => navigate('/start')} className={sharedButtonClasses}>Start Assessment</button>
          </div>

          <button className="md:hidden text-stone-900 p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </>
      );
    }

    if (route.name === 'assessment') {
      return (
        <>
          <div className="hidden md:flex items-center gap-3 text-sm font-medium tracking-wide text-stone-600">
            <span className="rounded-full border border-blue-100 bg-white px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">
              Question {route.step} of {ASSESSMENT_QUESTIONS.length}
            </span>
            <button
              onClick={() => navigate('/start')}
              className="rounded-full border border-stone-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-stone-600 transition hover:border-stone-300 hover:bg-stone-50"
            >
              Entry
            </button>
            <button onClick={() => navigate('/')} className={sharedButtonClasses}>
              Exit Assessment
            </button>
          </div>

          <button className="md:hidden text-stone-900 p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </>
      );
    }

    return (
      <>
        <div className="hidden md:flex items-center gap-4 text-sm font-medium tracking-wide text-stone-600">
          <button onClick={() => navigate('/')} className="hover:text-nobel-gold transition-colors uppercase">Home</button>
          <button onClick={() => navigate('/start')} className="hover:text-nobel-gold transition-colors uppercase">Start</button>
          <button onClick={() => navigate('/admin')} className="hover:text-nobel-gold transition-colors uppercase">Admin</button>
        </div>

        <button className="md:hidden text-stone-900 p-2" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </>
    );
  };

  const renderMobileMenu = () => {
    if (!menuOpen) {
      return null;
    }

    if (route.name === 'landing') {
      return (
        <div className="fixed inset-0 z-40 bg-[#F9F8F4] flex flex-col items-center justify-center gap-8 text-xl font-serif animate-fade-in">
          <a href="#introduction" onClick={goToSection('introduction')} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase">Overview</a>
          <a href="#science" onClick={goToSection('science')} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase">Assessment</a>
          <a href="#authors" onClick={goToSection('authors')} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase">Users</a>
          <button onClick={() => { setMenuOpen(false); navigate('/start'); }} className="px-6 py-3 bg-stone-900 text-white rounded-full shadow-lg cursor-pointer">
            Start Assessment
          </button>
        </div>
      );
    }

    if (route.name === 'assessment') {
      return (
        <div className="fixed inset-0 z-40 bg-[#F9F8F4] flex flex-col items-center justify-center gap-8 text-xl font-serif animate-fade-in">
          <button onClick={() => { setMenuOpen(false); navigate('/'); }} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase">Home</button>
          <button onClick={() => { setMenuOpen(false); navigate('/start'); }} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase">Entry</button>
          <button onClick={() => { setMenuOpen(false); navigate('/admin'); }} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase">Admin</button>
          <button onClick={() => { setMenuOpen(false); navigate('/'); }} className="px-6 py-3 bg-stone-900 text-white rounded-full shadow-lg cursor-pointer">
            Exit Assessment
          </button>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-40 bg-[#F9F8F4] flex flex-col items-center justify-center gap-8 text-xl font-serif animate-fade-in">
        <button onClick={() => { setMenuOpen(false); navigate('/'); }} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase">Home</button>
        <button onClick={() => { setMenuOpen(false); navigate('/start'); }} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase">Start</button>
        <button onClick={() => { setMenuOpen(false); navigate('/admin'); }} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase">Admin</button>
      </div>
    );
  };

  const renderLanding = () => (
    <>
      <header className="relative min-h-screen pt-28 md:pt-32 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(249,248,244,0.92)_0%,rgba(249,248,244,0.6)_50%,rgba(249,248,244,0.3)_100%)]" />

        <div className="relative z-10 container mx-auto px-6 text-center">
          <h1 className="font-serif text-5xl md:text-7xl lg:text-9xl font-medium leading-tight md:leading-[0.9] mb-8 text-stone-900 drop-shadow-sm">
            Elite Global AI <br/><span className="italic font-normal text-stone-600 text-3xl md:text-5xl block mt-4">AI Readiness Assessment Platform</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-stone-700 font-light leading-relaxed mb-8">
            A B2B assessment experience for benchmarking organisational AI readiness across literacy, data readiness, strategy, workflow adoption, and governance.
          </p>
          <div className="mb-12 flex flex-wrap items-center justify-center gap-4">
            <button onClick={() => navigate('/start')} className="px-6 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors shadow-lg">
              Begin Assessment
            </button>
            <button onClick={() => navigate('/admin')} className="px-6 py-3 bg-white/80 text-stone-900 rounded-full hover:bg-white transition-colors shadow-sm border border-stone-200">
              Admin Dashboard
            </button>
          </div>

          <div className="flex justify-center">
            <a href="#introduction" onClick={goToSection('introduction')} className="group flex flex-col items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors cursor-pointer">
              <span>DISCOVER</span>
              <span className="p-2 border border-stone-300 rounded-full group-hover:border-stone-900 transition-colors bg-white/50">
                <ArrowDown size={16} />
              </span>
            </a>
          </div>
        </div>
      </header>

      <main>
        <section id="introduction" className="py-24 bg-white">
          <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
            <div className="md:col-span-4">
              <div className="inline-block mb-3 text-xs font-bold tracking-widest text-stone-500 uppercase">Overview</div>
              <h2 className="font-serif text-4xl mb-6 leading-tight text-stone-900">The Competitive Readiness Gap</h2>
              <div className="w-16 h-1 bg-nobel-gold mb-6"></div>
            </div>
            <div className="md:col-span-8 text-lg text-stone-600 leading-relaxed space-y-6">
              <p>
                <span className="text-5xl float-left mr-3 mt-[-8px] font-serif text-nobel-gold">T</span>he Elite Global AI Readiness Assessment helps organisations benchmark how prepared their teams are for AI adoption by collecting 5 to 20 structured responses, aggregating the results, and turning a typical <strong className="text-stone-900 font-medium">31 out of 100</strong> versus <strong className="text-stone-900 font-medium">68 out of 100</strong> benchmark gap into a clear executive view of speed, governance, and competitive risk.
              </p>
            </div>
          </div>
        </section>

        <section id="science" className="py-24 bg-white border-t border-stone-100">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 text-stone-600 text-xs font-bold tracking-widest uppercase rounded-full mb-6 border border-stone-200">
                  <BookOpen size={14}/> THE MODEL
                </div>
                <h2 className="font-serif text-4xl md:text-5xl mb-6 text-stone-900">Assessment Structure</h2>
                <p className="text-lg text-stone-600 mb-6 leading-relaxed">
                  The assessment uses <strong>25 scored questions</strong> across five dimensions, delivered one question per screen, while the backend keeps scoring server-side, aggregates answers at organisation level, and preserves anonymity in the final director-facing report.
                </p>
              </div>
              <div>
                <SurfaceCodeDiagram />
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-[#F9F8F4]">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <h2 className="font-serif text-4xl md:text-5xl mb-6 text-stone-900">Readiness Benchmarks</h2>
              <p className="text-lg text-stone-600 leading-relaxed">
                Directors need more than a raw score. The reporting layer frames results against benchmark ranges so leadership can understand whether the organisation is low, developing, moderate, advanced, or leading.
              </p>
            </div>
            <div className="max-w-3xl mx-auto">
              <PerformanceMetricDiagram />
            </div>
          </div>
        </section>

        <section id="authors" className="py-24 bg-[#F5F4F0] border-t border-stone-300">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-block mb-3 text-xs font-bold tracking-widest text-stone-500 uppercase">PLATFORM USERS</div>
              <h2 className="font-serif text-3xl md:text-5xl mb-4 text-stone-900">Who the Product Serves</h2>
              <p className="text-stone-500 max-w-2xl mx-auto">Built for executive recipients, respondents, and the internal admin team managing report delivery.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 justify-center items-center flex-wrap">
              <AuthorCard name="Directors" role="Receive the final executive report" delay="0s" />
              <AuthorCard name="Managers" role="Contribute team-level readiness data" delay="0.1s" />
              <AuthorCard name="Individual Contributors" role="Complete the guided assessment flow" delay="0.2s" />
              <AuthorCard name="Financial Services" role="High-compliance benchmark use case" delay="0.3s" />
              <AuthorCard name="Healthcare" role="Governance and adoption-sensitive teams" delay="0.4s" />
              <AuthorCard name="Elite Global AI Admins" role="Approve reports before dispatch" delay="0.5s" />
            </div>
            <div className="text-center mt-12">
              <p className="text-stone-500 italic">Designed for organisations that need a credible AI readiness benchmark before committing to training or transformation.</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );

  const renderStart = () => (
    <div className="relative min-h-screen overflow-hidden bg-[#F9F8F4] pt-28 pb-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(219,234,254,0.55),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(191,219,254,0.4),transparent_32%)]" />
      <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
        <section className="mb-6 rounded-[32px] border border-stone-200 bg-white/90 p-7 shadow-lg backdrop-blur-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.85fr] lg:items-end">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.24em] text-blue-700">
                  AI Readiness Diagnostic
                </span>
                <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.24em] text-stone-500">
                  2026 Benchmark
                </span>
              </div>
              <div className="max-w-3xl space-y-3">
                <h1 className="text-4xl leading-[1.02] text-slate-950 sm:text-5xl lg:text-[3.7rem]">
                  Respondent entry for the organisation assessment.
                </h1>
                <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                  Capture the respondent details once, then move through the 25-question
                  diagnostic with backend validation, server-side scoring, and
                  organisation-level aggregation.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {ENTRY_HIGHLIGHTS.map((item) => {
                return (
                  <SummaryCard
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    value={item.value}
                  />
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-stone-200 bg-white p-7 shadow-xl sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-900 font-serif text-sm font-bold text-white">
                  E
                </div>
                <div>
                  <p className="font-serif text-lg font-bold tracking-tight text-slate-950">
                    Respondent Entry
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Step 1 of 2
                  </p>
                </div>
              </div>

              <div className="mb-8 space-y-3">
                <h2 className="text-4xl text-slate-950 sm:text-[2.8rem]">Welcome</h2>
                <p className="max-w-2xl text-sm font-medium text-slate-500 sm:text-base">
                  Provide the respondent information below before starting the
                  assessment. These details stay internal and support the final
                  organisation-level analysis.
                </p>
              </div>

              <div className="mb-8 flex flex-wrap gap-3">
                <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-stone-600">
                  No login required
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                  Backend validated
                </span>
              </div>

              <form className="space-y-5" onSubmit={(event) => { void handleStartAssessment(event); }}>
                <div className="space-y-2.5">
                  <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm font-medium text-slate-900 outline-none transition focus:border-nobel-gold focus:bg-white"
                    value={formData.email}
                    onChange={(event) => updateFormField('email', event.target.value)}
                    onBlur={() => {
                      void validateEmailInput(formData.email);
                    }}
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Full Name</label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm font-medium text-slate-900 outline-none transition focus:border-nobel-gold focus:bg-white"
                    value={formData.name}
                    onChange={(event) => updateFormField('name', event.target.value)}
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Organisation Name</label>
                  <input
                    type="text"
                    placeholder="GTBank"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm font-medium text-slate-900 outline-none transition focus:border-nobel-gold focus:bg-white"
                    value={formData.orgName}
                    onChange={(event) => updateFormField('orgName', event.target.value)}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2.5">
                    <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Role Level</label>
                    <select
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm font-medium text-slate-900 outline-none transition focus:border-nobel-gold focus:bg-white"
                      value={formData.role}
                      onChange={(event) => updateFormField('role', event.target.value as RoleLevel | '')}
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
                    <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Department</label>
                    <input
                      type="text"
                      placeholder="Finance"
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm font-medium text-slate-900 outline-none transition focus:border-nobel-gold focus:bg-white"
                      value={formData.dept}
                      onChange={(event) => updateFormField('dept', event.target.value)}
                    />
                  </div>
                </div>

                <label className="flex items-start gap-4 rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={formData.consentAccepted}
                    onChange={(event) => updateFormField('consentAccepted', event.target.checked)}
                  />
                  <span>
                    I consent to Elite Global AI processing my assessment data and understand that only anonymised organisation-level results will be visible in the final report.
                  </span>
                </label>

                {entryNotice ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    {entryNotice}
                  </div>
                ) : null}

                {entryError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{entryError}</span>
                    </div>
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={entryLoading}
                    className="flex flex-1 items-center justify-center gap-3 rounded-full bg-blue-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {entryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Start Assessment'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="rounded-full border border-stone-200 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
                  >
                    Home
                  </button>
                </div>
              </form>
            </div>

            <aside className="space-y-4">
              <div className="rounded-[28px] border border-blue-100 bg-blue-50/60 p-6">
                <p className="mb-5 text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-500">
                  What Happens Next
                </p>
                <div className="space-y-4">
                  {ENTRY_STEPS.map((step, index) => (
                    <div key={step} className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white">
                        {index + 1}
                      </div>
                      <p className="text-sm text-slate-600">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-stone-200 bg-stone-50 p-6">
                <div className="mb-4 flex items-center gap-3 text-slate-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Assessment guidance</p>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                      Recommended volume
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  Best run with 5 to 20 respondents per organisation so the
                  director receives a credible cross-functional view rather than
                  a single-person opinion.
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

    return (
      <div className="relative min-h-screen overflow-hidden bg-[#F4F7FC] pt-24 pb-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(219,234,254,0.55),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(191,219,254,0.35),transparent_34%)]" />

        <div className="relative mx-auto max-w-6xl px-5 pb-10 sm:px-8 lg:px-10">
          <section className="mb-6 rounded-[30px] border border-blue-100 bg-white/95 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:p-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-900 font-serif text-sm font-bold text-white shadow-sm">
                    E
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
                      Elite Global AI Diagnostic
                    </p>
                    <h1 className="mt-2 font-serif text-[1.75rem] leading-tight text-slate-950">
                      Assessment workspace
                    </h1>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700">
                        {formData.orgName}
                      </span>
                      <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        {roleLabel}
                      </span>
                      <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        {formData.dept}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
                  <div className="rounded-[22px] border border-blue-100 bg-blue-50 px-4 py-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                      Current Step
                    </p>
                    <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
                      {currentStep}
                    </p>
                    <p className="text-sm text-slate-500">of {totalSteps} questions</p>
                  </div>
                  <div className="rounded-[22px] border border-stone-200 bg-white px-4 py-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                      Answered
                    </p>
                    <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
                      {answeredCount}
                    </p>
                    <p className="text-sm text-slate-500">responses captured</p>
                  </div>
                  <div className="rounded-[22px] border border-stone-200 bg-white px-4 py-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                      Completion
                    </p>
                    <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
                      {overallProgress}%
                    </p>
                    <p className="text-sm text-slate-500">through the flow</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-stone-200 bg-slate-50 px-4 py-4">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                      Overall Progress
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      Move question by question. Your answers are saved locally until final submission.
                    </p>
                  </div>
                  <span className="rounded-full border border-white bg-white px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-700">
                    {answeredCount}/{totalSteps} answered
                  </span>
                </div>

                <div className="h-2.5 rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="h-fit space-y-4 lg:sticky lg:top-24">
              <div className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
                  Current Dimension
                </p>
                <h2 className="text-[1.7rem] leading-tight text-slate-950">
                  {question.dimension}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Question {currentDimensionIndex + 1} of {currentDimensionQuestions.length} in this section.
                </p>

                <div className="mt-5 rounded-[22px] border border-stone-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    <span>Section Progress</span>
                    <span>{sectionProgress}%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${sectionProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
                <p className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
                  Response Guidance
                </p>
                <div className="space-y-4">
                  {DIAGNOSTIC_NOTES.map((note, index) => (
                    <div key={note} className="flex gap-3">
                      <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                      <p className="text-sm leading-6 text-slate-600">
                        <span className="mr-2 font-semibold text-slate-900">{index + 1}.</span>
                        {note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <div className="flex flex-col">
              <AnimatePresence mode="wait">
                <motion.section
                  key={currentStep}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="flex h-full flex-col rounded-[32px] border border-blue-100 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10"
                >
                  <div className="mb-8 flex flex-col gap-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-blue-700">
                            {question.dimension}
                          </span>
                          <span className={`rounded-full border px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.22em] ${question.multiSelect ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-stone-200 bg-stone-50 text-slate-500'}`}>
                            {question.multiSelect ? 'Multi-select' : 'Single response'}
                          </span>
                        </div>

                        <h1 className="max-w-4xl text-[1.7rem] leading-[1.1] tracking-tight text-slate-950 sm:text-[2rem] lg:text-[2.35rem] xl:text-[2.7rem]">
                          {question.text}
                        </h1>

                        <p className="max-w-3xl text-[15px] leading-7 text-slate-600">
                          {question.multiSelect
                            ? 'Select every option that reflects the current reality of your team. Use “None of the above” only when no listed capability applies.'
                            : 'Choose the single option that best describes how your team operates today, not the future target state.'}
                        </p>
                      </div>

                      <div className="rounded-[24px] border border-stone-200 bg-slate-50 px-5 py-4 xl:w-[210px]">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                          Assessment Pace
                        </p>
                        <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
                          {overallProgress}%
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {answeredCount} questions completed so far
                        </p>
                      </div>
                    </div>

                    {question.multiSelect ? (
                      <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-800">
                        Multiple answers can be selected for this question.
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    {question.options.map((option, index) => {
                      const selected = question.multiSelect
                        ? Array.isArray(currentAnswer) && currentAnswer.includes(option.value)
                        : currentAnswer === option.value;
                      const optionMarker = question.multiSelect ? String(index + 1).padStart(2, '0') : option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleSelect(option.value)}
                          className={`group w-full rounded-[26px] border px-4 py-4 text-left transition-all sm:px-5 sm:py-5 ${selected ? 'border-blue-500 bg-blue-50 shadow-[0_16px_35px_rgba(37,99,235,0.12)]' : 'border-stone-200 bg-white hover:border-blue-200 hover:bg-blue-50/35'}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-extrabold ${selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-stone-200 bg-slate-50 text-slate-500 group-hover:border-blue-200 group-hover:text-blue-700'}`}>
                              {optionMarker}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <p className="text-base font-semibold leading-7 text-slate-900 sm:text-[1.05rem]">
                                    {option.label}
                                  </p>
                                  {!question.multiSelect ? (
                                    <span className="mt-3 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
                                      Score {option.score}
                                    </span>
                                  ) : null}
                                </div>

                                <div className={`flex h-9 min-w-[96px] items-center justify-center rounded-full border px-3 text-xs font-extrabold uppercase tracking-[0.16em] ${selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-stone-200 bg-white text-slate-400'}`}>
                                  {selected ? (
                                    <span className="inline-flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4" />
                                      Selected
                                    </span>
                                  ) : question.multiSelect ? 'Tap to add' : 'Select'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {submissionError ? (
                    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{submissionError}</span>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-auto flex flex-col gap-4 border-t border-stone-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentStep === 1) {
                          navigate('/start');
                          return;
                        }
                        navigate(`/assessment/${currentStep - 1}`);
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
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
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Next Question
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { void handleFinish(); }}
                          disabled={!currentQuestionAnswered || isSubmitting}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
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
          <h1 className="mb-4 text-4xl text-stone-900 sm:text-5xl">Response recorded successfully</h1>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg">
            Your submission has been saved to the backend and added to your organisation’s aggregated readiness record. Elite Global AI can now review the responses and send the final PDF report from the admin dashboard.
          </p>

          {lastSubmission ? (
            <div className="mx-auto mb-8 grid max-w-3xl gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-stone-400">Organisation</p>
                <p className="text-lg font-semibold text-stone-900">{lastSubmission.orgName}</p>
              </div>
              <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-stone-400">Score</p>
                <p className="text-lg font-semibold text-stone-900">{lastSubmission.totalScore}/100</p>
                <p className="text-sm text-stone-500">{lastSubmission.readinessLevel}</p>
              </div>
              <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-stone-400">Responses</p>
                <p className="text-lg font-semibold text-stone-900">{lastSubmission.submissionCount}</p>
                <p className="text-sm text-stone-500">Now captured for this org</p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={() => navigate('/start')}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-stone-800"
            >
              Start Another Response
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 px-6 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
            >
              Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdmin = () => {
    if (!isAuthed) {
      return (
        <div className="relative min-h-screen overflow-hidden bg-[#F9F8F4] pt-28 pb-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(219,234,254,0.52),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(191,219,254,0.38),transparent_34%)]" />

          <div className="relative mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-10">
            <section className="mb-6 rounded-[32px] border border-stone-200 bg-white/90 p-7 shadow-lg backdrop-blur-sm sm:p-8">
              <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.24em] text-blue-700">
                      Delivery Workflow
                    </span>
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.24em] text-stone-500">
                      Internal Operations
                    </span>
                  </div>
                  <div className="space-y-3">
                    <h1 className="max-w-3xl text-4xl leading-[1.04] text-slate-950 sm:text-5xl">
                      Review the aggregate, validate the recipient, then release the report.
                    </h1>
                    <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                      This console is for Elite Global AI operations only. Use it to
                      manage organisation readiness records, preview the PDF, and send
                      the final report to the right director.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                  <SummaryCard
                    icon={ShieldCheck}
                    label="Access"
                    value="Protected by shared admin token"
                  />
                  <SummaryCard
                    icon={BarChart3}
                    label="Visibility"
                    value="Aggregate scores before final delivery"
                  />
                  <SummaryCard
                    icon={Send}
                    label="Output"
                    value="Director-ready PDF report via email"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-stone-200 bg-white p-7 shadow-xl sm:p-8 lg:p-10">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div>
                  <div className="mb-8 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-900 font-serif text-sm font-bold text-white">
                      E
                    </div>
                    <div>
                      <p className="font-serif text-lg font-bold text-slate-950">
                        Secure Admin Access
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Authentication required
                      </p>
                    </div>
                  </div>

                  <div className="mb-8 space-y-3">
                    <h2 className="text-4xl text-slate-950 sm:text-[2.8rem]">
                      Admin Login
                    </h2>
                    <p className="max-w-2xl text-sm font-medium text-slate-500 sm:text-base">
                      Enter the internal admin secret from the backend environment to
                      load the organisation readiness dashboard.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2.5">
                      <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Secure Access Token</label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 font-mono text-sm font-medium text-slate-900 outline-none transition focus:border-nobel-gold focus:bg-white"
                        value={secretInput}
                        onChange={(event) => setSecretInput(event.target.value)}
                      />
                    </div>

                    {adminError ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{adminError}</span>
                        </div>
                      </div>
                    ) : null}

                    <button
                      onClick={() => { void fetchOrgs(secretInput); }}
                      disabled={adminLoading}
                      className="flex w-full items-center justify-center gap-3 rounded-full bg-blue-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {adminLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Access Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <aside className="space-y-4">
                  <div className="rounded-[28px] border border-blue-100 bg-blue-50/60 p-6">
                    <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
                      Recommended Sequence
                    </p>
                    <div className="space-y-4">
                      {ADMIN_NOTES.map((note, index) => (
                        <div key={note} className="flex gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white">
                            {index + 1}
                          </div>
                          <p className="text-sm text-slate-600">{note}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-stone-200 bg-stone-50 p-6">
                    <p className="mb-3 text-sm font-bold text-slate-900">Before you send</p>
                    <p className="text-sm leading-relaxed text-slate-600">
                      Confirm the organisation details, set the correct director email,
                      and review the aggregate scores before you preview or dispatch the report.
                    </p>
                  </div>
                </aside>
              </div>
            </section>
          </div>
        </div>
      );
    }

    return (
      <div className="relative min-h-screen overflow-hidden bg-[#F9F8F4] pt-28 pb-16">
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mb-8 rounded-[32px] border border-stone-200 bg-white p-6 shadow-xl sm:p-8">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
                  Admin Dashboard
                </p>
                <h1 className="text-4xl text-slate-950 sm:text-5xl">Organisation readiness overview</h1>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => { void fetchOrgs(secret); }}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
                >
                  Refresh
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
                <Building2 className="mb-4 h-5 w-5 text-stone-700" />
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Organisations</p>
                <p className="text-3xl font-extrabold text-slate-950">{orgs.length}</p>
              </div>
              <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
                <Users className="mb-4 h-5 w-5 text-stone-700" />
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Submissions</p>
                <p className="text-3xl font-extrabold text-slate-950">{totalSubmissions}</p>
              </div>
              <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
                <BarChart3 className="mb-4 h-5 w-5 text-stone-700" />
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Average Score</p>
                <p className="text-3xl font-extrabold text-slate-950">{averageScore.toFixed(1)}</p>
              </div>
              <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
                <Send className="mb-4 h-5 w-5 text-stone-700" />
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Reports Sent</p>
                <p className="text-3xl font-extrabold text-slate-950">{reportsSent}</p>
              </div>
            </div>

            {adminNotice ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {adminNotice}
              </div>
            ) : null}

            {adminError ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{adminError}</span>
                </div>
              </div>
            ) : null}
          </div>

          {adminLoading ? (
            <div className="rounded-[32px] border border-stone-200 bg-white p-12 text-center shadow-xl">
              <Loader2 className="mx-auto mb-4 h-6 w-6 animate-spin text-stone-700" />
              <p className="text-sm font-semibold text-stone-600">Loading organisation records...</p>
            </div>
          ) : orgs.length === 0 ? (
            <div className="rounded-[32px] border border-stone-200 bg-white p-12 text-center shadow-xl">
              <p className="text-lg font-semibold text-stone-900">No organisations yet</p>
              <p className="mt-2 text-sm text-stone-500">Once respondents submit assessments, the organisation records will appear here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orgs.map((organisation) => {
                const draft = drafts[organisation.id] || {
                  orgName: organisation.orgName,
                  directorEmail: organisation.directorEmail || '',
                  expectedRespondents: organisation.expectedRespondents ? String(organisation.expectedRespondents) : ''
                };
                const completionRatio = getCompletionRatio(organisation);

                return (
                  <div key={organisation.id} className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-xl sm:p-8">
                    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <h2 className="text-3xl text-slate-950">{organisation.orgName}</h2>
                          <span className={`rounded-full border px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.22em] ${statusBadgeClasses[organisation.status]}`}>
                            {organisation.status}
                          </span>
                        </div>
                        <p className="text-sm text-stone-500">Organisation key: {organisation.organisationKey}</p>
                        <p className="mt-2 text-sm text-stone-500">Readiness band: {getReadinessLabel(organisation.aggregatedScores.total)}</p>
                      </div>

                      <div className="rounded-[24px] border border-stone-200 bg-stone-50 px-5 py-4 text-right">
                        <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Responses</p>
                        <p className="text-3xl font-extrabold text-slate-950">{organisation.submissionCount}</p>
                        {completionRatio !== null ? (
                          <p className="text-sm text-stone-500">{completionRatio.toFixed(0)}% of expected</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                      {[
                        ['AI Literacy', organisation.aggregatedScores.aiLiteracy],
                        ['Data Readiness', organisation.aggregatedScores.dataReadiness],
                        ['AI Strategy', organisation.aggregatedScores.aiStrategy],
                        ['Workflow Adoption', organisation.aggregatedScores.workflowAdoption],
                        ['Ethics Compliance', organisation.aggregatedScores.ethicsCompliance],
                        ['Overall', organisation.aggregatedScores.total]
                      ].map(([label, value], index) => (
                        <div key={label} className={`rounded-[24px] border p-4 ${index === 5 ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-stone-50'}`}>
                          <p className={`mb-2 text-[10px] font-extrabold uppercase tracking-[0.22em] ${index === 5 ? 'text-stone-300' : 'text-slate-400'}`}>
                            {label}
                          </p>
                          <p className="text-2xl font-extrabold">{Number(value).toFixed(1)}</p>
                          <p className={`text-xs ${index === 5 ? 'text-stone-300' : 'text-stone-500'}`}>
                            / {index === 5 ? '100' : '20'}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-5 lg:grid-cols-3">
                      <div className="space-y-2.5">
                        <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Organisation Name</label>
                        <input
                          type="text"
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm font-medium text-slate-900 outline-none transition focus:border-nobel-gold focus:bg-white"
                          value={draft.orgName}
                          onChange={(event) => updateDraft(organisation.id, 'orgName', event.target.value)}
                        />
                      </div>
                      <div className="space-y-2.5">
                        <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Director Email</label>
                        <input
                          type="email"
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm font-medium text-slate-900 outline-none transition focus:border-nobel-gold focus:bg-white"
                          value={draft.directorEmail}
                          onChange={(event) => updateDraft(organisation.id, 'directorEmail', event.target.value)}
                          placeholder="director@organisation.com"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Expected Respondents</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm font-medium text-slate-900 outline-none transition focus:border-nobel-gold focus:bg-white"
                          value={draft.expectedRespondents}
                          onChange={(event) => updateDraft(organisation.id, 'expectedRespondents', event.target.value)}
                          placeholder="12"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        onClick={() => { void handleSaveOrg(organisation.id); }}
                        disabled={Boolean(busyKey)}
                        className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {busyKey === `save-${organisation.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        Save Org Details
                      </button>
                      <button
                        onClick={() => { void handlePreviewReport(organisation.id); }}
                        disabled={Boolean(busyKey)}
                        className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {busyKey === `preview-${organisation.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                        Preview PDF
                      </button>
                      <button
                        onClick={() => { void handleSendReport(organisation.id); }}
                        disabled={Boolean(busyKey)}
                        className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {busyKey === `send-${organisation.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Approve & Send Report
                      </button>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-5 text-sm text-stone-500">
                      <span className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {organisation.directorEmail || 'No director email set yet'}
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
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#F9F8F4]/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-nobel-gold rounded-full flex items-center justify-center text-white font-serif font-bold text-xl shadow-sm pb-1">E</div>
            <span className={`font-serif font-bold text-lg tracking-wide transition-opacity ${scrolled || route.name !== 'landing' ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
              ELITE GLOBAL AI <span className="font-normal text-stone-500">Assessment</span>
            </span>
          </div>

          {renderTopNav()}
        </div>
      </nav>

      {renderMobileMenu()}

      {route.name === 'landing' ? renderLanding() : null}
      {route.name === 'start' ? renderStart() : null}
      {route.name === 'assessment' ? renderAssessment() : null}
      {route.name === 'complete' ? renderComplete() : null}
      {route.name === 'admin' ? renderAdmin() : null}

      {route.name !== 'assessment' ? (
        <footer className="bg-stone-900 text-stone-400 py-16">
          <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <div className="text-white font-serif font-bold text-2xl mb-2">Elite Global AI</div>
              <p className="text-sm">AI Readiness Assessment Platform for benchmark-led reporting and commercial follow-through</p>
            </div>
          </div>
          <div className="text-center mt-12 text-xs text-stone-600">
            {backendStatus === 'connected'
              ? `Connected to ${backendService || 'elite-global-ai-backend'} via ${apiHealthUrl}.`
              : backendStatus === 'checking'
                ? 'Checking backend connectivity through the configured /api proxy.'
                : 'Backend health check is not currently reachable from this frontend.'}
          </div>
        </footer>
      ) : null}
    </div>
  );
};

export default App;
