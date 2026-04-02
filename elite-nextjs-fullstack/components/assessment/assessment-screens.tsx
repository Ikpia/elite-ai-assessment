import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Loader2,
  Mail,
  Send,
  Users,
  X
} from "lucide-react";

import { getFirmTypeLabel } from "@/lib/shared/questions";
import type {
  AssessmentInvitePrefillResponse,
  FirmType,
  Question,
  RoleLevel,
  SubmissionDraft
} from "@/lib/shared/types";

export interface AssessmentResultSnapshot {
  organisationId: string;
  organisationKey: string;
  firmType: FirmType;
  orgName: string;
  respondentTotalScore: number;
  respondentReadinessLevel: string;
  latestTotalScore: number;
  latestReadinessLevel: string;
  submissionCount: number;
  recipientEmail: string;
  reportViewUrl: string;
  generatedAt: string;
  deliveryMode: "mock" | "live";
}

export interface DirectorSetupDraft {
  firmType: FirmType;
  orgName: string;
  email: string;
  name: string;
  dept: string;
  consentAccepted: boolean;
}

const inputClasses =
  "w-full rounded-[18px] border border-stone-200 bg-white px-4 py-3 text-[15px] font-medium text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100";
const primaryButtonClasses =
  "inline-flex items-center justify-center gap-2 rounded-full bg-blue-900 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70";
const secondaryButtonClasses =
  "inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700";
const chipClasses =
  "rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04
    }
  }
} as const;

const fadeUpItem = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
  }
} as const;

function SurfaceBanner({
  tone,
  message,
  onClose
}: {
  tone: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  const isSuccess = tone === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={`rounded-[18px] border px-4 py-3 text-sm ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 font-semibold">{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-current/15 bg-white/60"
          aria-label="Dismiss message"
        >
          <span className="text-sm leading-none">x</span>
        </button>
      </div>
    </div>
  );
}

function AssessmentModal({
  eyebrow,
  title,
  description,
  onClose,
  children,
  footer,
  widthClass = "max-w-4xl",
  animationKey = "assessment-modal"
}: {
  eyebrow: string;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string;
  animationKey?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/45 px-2 py-3 backdrop-blur-[6px] sm:px-4 sm:py-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="mx-auto flex min-h-full w-full items-start justify-center sm:items-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={animationKey}
            initial={{ opacity: 0, y: 36, scale: 0.965 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.985 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className={`relative flex max-h-[calc(100dvh-1rem)] w-full ${widthClass} flex-col overflow-hidden rounded-[28px] border border-white/90 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_32px_96px_rgba(15,23,42,0.24),0_10px_28px_rgba(15,23,42,0.12)]`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-slate-500 shadow-[0_12px_32px_rgba(15,23,42,0.12)] transition-colors hover:text-slate-950"
              aria-label="Close assessment modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="shrink-0 border-b border-stone-200/70 px-5 py-5 pr-16 sm:px-7">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
                {eyebrow}
              </p>
              <h1 className="mt-2.5 font-serif text-[1.45rem] leading-[1.08] text-slate-950 sm:text-[1.9rem]">
                {title}
              </h1>
              {description ? (
                <p className="mt-2.5 max-w-xl text-[0.92rem] leading-6 text-slate-500">
                  {description}
                </p>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">{children}</div>

            {footer ? (
              <div className="shrink-0 border-t border-stone-200/70 bg-white/75 px-5 py-4 sm:px-7">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function CompactMetric({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[18px] border border-stone-200 bg-stone-50 px-4 py-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 font-serif text-[1.2rem] text-slate-950">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function getAssessmentProgressCopy(progress: number, remainingQuestions: number): {
  title: string;
  message: string;
} | null {
  if (progress >= 88 || remainingQuestions <= 2) {
    return {
      title: "Almost done",
      message: "You are in the final stretch. Just a few answers left."
    };
  }

  if (progress >= 65) {
    return {
      title: "Strong progress",
      message: "You are moving well through the assessment. Keep going."
    };
  }

  return null;
}

function getProcessingCopy(progress: number): string {
  if (progress >= 85) {
    return "Almost done. Finalizing your report now.";
  }

  if (progress >= 55) {
    return "Your report is taking shape. We are compiling the latest snapshot.";
  }

  return "We are processing your responses and preparing the report.";
}

function formatGeneratedAt(value: string): string {
  return new Date(value).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function AssessmentSplitEntryScreen({
  onSelectRespondent,
  onSelectDirector,
  onClose
}: {
  onSelectRespondent: () => void;
  onSelectDirector: () => void;
  onClose: () => void;
}) {
  return (
    <AssessmentModal
      eyebrow="Assessment Entry"
      title="Choose your path"
      description="Stay in this modal and continue."
      onClose={onClose}
      widthClass="max-w-5xl"
      animationKey="assessment-entry"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 lg:grid-cols-2"
      >
        <motion.div variants={fadeUpItem} className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-blue-50 text-blue-700">
            <Users className="h-5 w-5" />
          </div>
          <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
            Respondent
          </p>
          <h2 className="mt-3 font-serif text-[1.35rem] leading-tight text-slate-950">
            I’m taking the assessment.
          </h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Answer the questions and get your live report link.
          </p>
          <button
            type="button"
            onClick={onSelectRespondent}
            className={`${primaryButtonClasses} mt-6`}
          >
            Continue as Respondent
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>

        <motion.div variants={fadeUpItem} className="rounded-[24px] border border-stone-200 bg-[#0f172a] p-5 text-slate-100 shadow-sm sm:p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-white/10 text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
            Director
          </p>
          <h2 className="mt-3 font-serif text-[1.35rem] leading-tight text-white">
            I’m setting this up for my team.
          </h2>
          <p className="mt-4 text-sm leading-6 text-slate-200">
            Create the firm and get the team invite link.
          </p>
          <button
            type="button"
            onClick={onSelectDirector}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white px-5 py-3 text-sm font-bold text-slate-950"
          >
            Continue as Director
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </motion.div>
    </AssessmentModal>
  );
}

export function AssessmentWelcomeScreen({
  formData,
  invitePrefill,
  firmTypeOptions,
  roleOptions,
  entryLoading,
  inviteLoading,
  entryError,
  entryNotice,
  onDismissEntryError,
  onDismissEntryNotice,
  onFirmTypeChange,
  onOrgNameChange,
  onRoleChange,
  onDeptChange,
  onBack,
  onSubmit,
  onClose
}: {
  formData: Pick<SubmissionDraft, "orgName" | "role" | "dept" | "firmType">;
  invitePrefill: AssessmentInvitePrefillResponse | null;
  firmTypeOptions: Array<{ value: FirmType; label: string; description: string }>;
  roleOptions: Array<{ value: RoleLevel; label: string }>;
  entryLoading: boolean;
  inviteLoading: boolean;
  entryError: string;
  entryNotice: string;
  onDismissEntryError: () => void;
  onDismissEntryNotice: () => void;
  onFirmTypeChange: (value: FirmType) => void;
  onOrgNameChange: (value: string) => void;
  onRoleChange: (value: RoleLevel | "") => void;
  onDeptChange: (value: string) => void;
  onBack: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  const isInviteFlow = Boolean(invitePrefill) || inviteLoading;

  return (
    <AssessmentModal
      eyebrow={isInviteFlow ? "Team Invite" : "Respondent"}
      title="Start the assessment"
      description="Add your team context to continue."
      onClose={onClose}
      widthClass="max-w-3xl"
      animationKey={isInviteFlow ? "respondent-entry-invite" : "respondent-entry"}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onBack} className={secondaryButtonClasses}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="submit"
            form="respondent-entry-form"
            disabled={entryLoading || inviteLoading}
            className={`${primaryButtonClasses} sm:flex-1`}
          >
            {entryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      }
    >
      <motion.form
        id="respondent-entry-form"
        className="space-y-4"
        onSubmit={onSubmit}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {isInviteFlow ? (
          <motion.div variants={fadeUpItem} className="flex flex-wrap gap-2">
            <span className={chipClasses}>Invite prefilled</span>
          </motion.div>
        ) : null}

        <motion.div variants={fadeUpItem} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
              Firm Type
            </label>
            <select
              value={formData.firmType}
              onChange={(event) => onFirmTypeChange(event.target.value as FirmType)}
              disabled={Boolean(invitePrefill)}
              className={`${inputClasses} ${
                invitePrefill ? "cursor-not-allowed border-stone-200 bg-stone-100 text-slate-500" : ""
              }`}
            >
              {firmTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
              Organisation Name
            </label>
            <input
              type="text"
              placeholder="Your organisation"
              value={formData.orgName}
              onChange={(event) => onOrgNameChange(event.target.value)}
              disabled={Boolean(invitePrefill)}
              className={`${inputClasses} ${
                invitePrefill ? "cursor-not-allowed border-stone-200 bg-stone-100 text-slate-500" : ""
              }`}
            />
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
              Role Level
            </label>
            <select
              value={formData.role}
              onChange={(event) => onRoleChange(event.target.value as RoleLevel | "")}
              className={inputClasses}
            >
              <option value="">Select role</option>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
              Department
            </label>
            <input
              type="text"
              placeholder="Department or function"
              value={formData.dept}
              onChange={(event) => onDeptChange(event.target.value)}
              className={inputClasses}
            />
          </div>
        </motion.div>

        {inviteLoading ? (
          <motion.div variants={fadeUpItem} className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading invitation...
          </motion.div>
        ) : null}

        {entryNotice ? (
          <motion.div variants={fadeUpItem}>
            <SurfaceBanner tone="success" message={entryNotice} onClose={onDismissEntryNotice} />
          </motion.div>
        ) : null}

        {entryError ? (
          <motion.div variants={fadeUpItem}>
            <SurfaceBanner tone="error" message={entryError} onClose={onDismissEntryError} />
          </motion.div>
        ) : null}
      </motion.form>
    </AssessmentModal>
  );
}

export function AssessmentQuestionScreen({
  question,
  currentAnswer,
  currentStep,
  totalSteps,
  answeredCount,
  currentDimensionIndex,
  currentDimensionQuestionsCount,
  activeFirmTypeLabel,
  orgName,
  roleLabel,
  dept,
  submissionError,
  onDismissSubmissionError,
  onSelect,
  onBack,
  onNext,
  onFinish,
  currentQuestionAnswered,
  isSubmitting,
  onClose
}: {
  question: Question;
  currentAnswer: string | string[] | undefined;
  currentStep: number;
  totalSteps: number;
  answeredCount: number;
  currentDimensionIndex: number;
  currentDimensionQuestionsCount: number;
  activeFirmTypeLabel: string;
  orgName: string;
  roleLabel: string;
  dept: string;
  submissionError: string;
  onDismissSubmissionError: () => void;
  onSelect: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
  currentQuestionAnswered: boolean;
  isSubmitting: boolean;
  onClose: () => void;
}) {
  const overallProgress = Math.max(4, Math.round((currentStep / totalSteps) * 100));
  const sectionProgress = currentDimensionQuestionsCount
    ? Math.round(((currentDimensionIndex + 1) / currentDimensionQuestionsCount) * 100)
    : 0;
  const instruction = question.multiSelect
    ? "Select all options that apply."
    : "Choose the one option that best fits.";
  const remainingQuestions = Math.max(totalSteps - currentStep, 0);
  const progressCopy = getAssessmentProgressCopy(overallProgress, remainingQuestions);

  return (
    <motion.main
      key={currentStep}
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -18 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="h-screen overflow-hidden bg-[#F9F8F4] px-3 py-2 text-slate-900 sm:px-4 sm:py-3 lg:px-5"
    >
      <div className="mx-auto flex h-full max-w-[min(96vw,1400px)] flex-col">
        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="mb-2 rounded-[24px] border border-stone-200 bg-white px-4 py-2.5 shadow-sm sm:px-5"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-base font-serif font-bold text-white shadow-sm">
                E
              </div>
              <div>
                <p className="font-serif text-[1.12rem] font-bold leading-none text-slate-950 sm:text-[1.28rem]">
                  Elite Global AI <span className="font-normal text-slate-500">Assessment</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">
                Question {currentStep} of {totalSteps}
              </span>
              <button type="button" onClick={onClose} className={primaryButtonClasses}>
                Exit Assessment
              </button>
            </div>
          </div>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04, duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="mb-2 rounded-[22px] border border-stone-200 bg-white p-3 shadow-sm"
        >
          <div className="grid gap-3 lg:grid-cols-[1.5fr_0.7fr] lg:items-center">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className={chipClasses}>{activeFirmTypeLabel}</span>
                <span className={chipClasses}>{roleLabel}</span>
                {dept.trim() ? <span className={chipClasses}>{dept}</span> : null}
              </div>

              <p className="mt-2 text-[12px] font-medium text-slate-600">
                {orgName} · Section {currentDimensionIndex + 1}/{currentDimensionQuestionsCount} · {answeredCount} answered
              </p>
            </div>

            <div className="rounded-[18px] border border-blue-100 bg-[linear-gradient(135deg,rgba(239,246,255,0.96)_0%,rgba(255,255,255,0.98)_100%)] p-3">
              <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                <span>Progress</span>
                <span>{overallProgress}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-stone-100">
                <motion.div
                  className="h-full rounded-full bg-blue-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                <span>{currentStep}/{totalSteps}</span>
                <span>{sectionProgress}% section</span>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          className="flex min-h-0 flex-1 flex-col rounded-[24px] border border-stone-200 bg-white p-3 shadow-sm"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div>
              {progressCopy ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`progress-copy-${currentStep}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-3 rounded-[14px] border border-blue-100 bg-blue-50 px-3 py-2 text-[12px] leading-5 text-blue-800"
                  >
                    <span className="font-semibold">{progressCopy.title}:</span> {progressCopy.message}
                  </motion.div>
                </AnimatePresence>
              ) : null}

              <h1 className="font-serif text-[1.02rem] font-bold leading-[1.12] tracking-[-0.01em] text-slate-950 sm:text-[1.08rem] lg:text-[1.16rem] xl:text-[1.22rem]">
                {question.text}
              </h1>
              <p className="mt-2 text-[12px] font-medium leading-5 text-slate-700">{instruction}</p>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="min-h-0 flex-1 overflow-y-auto pr-1"
            >
              <div className="grid gap-2.5 lg:grid-cols-2">
                {question.options.map((option, index) => {
                  const selected = question.multiSelect
                    ? Array.isArray(currentAnswer) && currentAnswer.includes(option.value)
                    : currentAnswer === option.value;
                  const marker = question.multiSelect ? String(index + 1).padStart(2, "0") : option.value;

                  return (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => onSelect(option.value)}
                      variants={fadeUpItem}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.995 }}
                      className={`w-full rounded-[18px] border px-3 py-3 text-left transition-all ${
                        selected
                          ? "border-blue-500 bg-blue-50 shadow-[0_10px_24px_rgba(37,99,235,0.12)]"
                          : "border-stone-200 bg-white hover:border-blue-200 hover:bg-blue-50/35"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[10px] font-extrabold ${selected ? "border-blue-600 bg-blue-600 text-white" : "border-stone-200 bg-stone-50 text-slate-500"}`}>
                          {marker}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
                            <p className="text-[12px] font-bold leading-[1.35] text-slate-900 sm:text-[12.5px]">
                              {option.label}
                            </p>
                            <span className={`inline-flex min-w-[74px] items-center justify-center rounded-full border px-2.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.14em] ${selected ? "border-blue-600 bg-blue-600 text-white" : "border-stone-200 bg-white text-slate-400"}`}>
                              {selected ? "Selected" : question.multiSelect ? "Add" : "Select"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {submissionError ? (
            <div className="mt-3">
              <SurfaceBanner tone="error" message={submissionError} onClose={onDismissSubmissionError} />
            </div>
          ) : null}

          <div className="mt-3 flex flex-col gap-3 border-t border-stone-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={onBack} className={secondaryButtonClasses}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={onNext}
                disabled={!currentQuestionAnswered}
                className={primaryButtonClasses}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onFinish}
                disabled={!currentQuestionAnswered || isSubmitting}
                className={primaryButtonClasses}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Finish
              </button>
            )}
          </div>
        </motion.section>
      </div>
    </motion.main>
  );
}

export function AssessmentDimensionTransitionScreen({
  completedDimension,
  nextDimension,
  observation,
  onClose
}: {
  completedDimension: string;
  nextDimension: string;
  observation: string;
  onClose: () => void;
}) {
  return (
    <AssessmentModal
      eyebrow="Next Section"
      title={nextDimension}
      description={`You completed ${completedDimension}.`}
      onClose={onClose}
      widthClass="max-w-2xl"
      animationKey={`assessment-transition-${completedDimension}-${nextDimension}`}
    >
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
        <motion.div variants={fadeUpItem} className="rounded-[20px] border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-slate-600">
          {observation}
        </motion.div>
        <motion.div variants={fadeUpItem} className="grid gap-3 sm:grid-cols-2">
          <CompactMetric label="Completed" value={completedDimension} />
          <CompactMetric label="Up Next" value={nextDimension} />
        </motion.div>
        <motion.div
          variants={fadeUpItem}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Almost there. Moving to the next section...
        </motion.div>
      </motion.div>
    </AssessmentModal>
  );
}

export function AssessmentCompletionDetailsScreen({
  orgName,
  firmType,
  roleLabel,
  dept,
  answeredCount,
  totalSteps,
  name,
  email,
  phone,
  attribution,
  consentAccepted,
  attributionOptions,
  submissionError,
  isSubmitting,
  onDismissSubmissionError,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onAttributionChange,
  onConsentChange,
  onBack,
  onSubmit,
  onClose
}: {
  orgName: string;
  firmType: FirmType;
  roleLabel: string;
  dept: string;
  answeredCount: number;
  totalSteps: number;
  name: string;
  email: string;
  phone: string;
  attribution: string;
  consentAccepted: boolean;
  attributionOptions: readonly string[];
  submissionError: string;
  isSubmitting: boolean;
  onDismissSubmissionError: () => void;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onAttributionChange: (value: string) => void;
  onConsentChange: (value: boolean) => void;
  onBack: () => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <AssessmentModal
      eyebrow="Final Details"
      title="Send my report"
      description="Add your details for the live report link."
      onClose={onClose}
      widthClass="max-w-4xl"
      animationKey="assessment-details"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onBack} className={secondaryButtonClasses}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <button type="button" onClick={onSubmit} disabled={isSubmitting} className={`${primaryButtonClasses} sm:flex-1`}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Generate Report
          </button>
        </div>
      }
    >
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
        <motion.div variants={fadeUpItem} className="grid gap-3 sm:grid-cols-3">
          <CompactMetric label="Organisation" value={orgName} hint={getFirmTypeLabel(firmType)} />
          <CompactMetric label="Role" value={roleLabel} hint={dept || "Department optional"} />
          <CompactMetric
            label="Progress"
            value={`${answeredCount}/${totalSteps}`}
            hint={answeredCount >= totalSteps ? "You are almost done" : "Questions answered"}
          />
        </motion.div>

        <motion.div variants={fadeUpItem} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
              Full Name
            </label>
            <input type="text" value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="Jane Doe" className={inputClasses} />
          </div>
          <div className="space-y-2">
            <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
              Work Email
            </label>
            <input type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="you@company.com" className={inputClasses} />
          </div>
          <div className="space-y-2">
            <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
              Phone Number
            </label>
            <input type="tel" value={phone} onChange={(event) => onPhoneChange(event.target.value)} placeholder="Optional" className={inputClasses} />
          </div>
          <div className="space-y-2">
            <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
              Attribution
            </label>
            <select value={attribution} onChange={(event) => onAttributionChange(event.target.value)} className={inputClasses}>
              <option value="">Optional</option>
              {attributionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        <motion.label variants={fadeUpItem} className="flex items-start gap-3 rounded-[18px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-slate-600">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-stone-300 text-blue-700 focus:ring-blue-200"
            checked={consentAccepted}
            onChange={(event) => onConsentChange(event.target.checked)}
          />
          <span>
            I consent to report processing and delivery.
          </span>
        </motion.label>

        {submissionError ? (
          <motion.div variants={fadeUpItem}>
            <SurfaceBanner tone="error" message={submissionError} onClose={onDismissSubmissionError} />
          </motion.div>
        ) : null}
      </motion.div>
    </AssessmentModal>
  );
}

export function AssessmentProcessingScreen({
  processingProgress,
  processingDimensionIndex,
  dimensionLabels,
  onClose
}: {
  processingProgress: number;
  processingDimensionIndex: number;
  dimensionLabels: string[];
  onClose: () => void;
}) {
  const processingCopy = getProcessingCopy(processingProgress);

  return (
    <AssessmentModal
      eyebrow="Generating Report"
      title="Generating your report"
      description="Scoring responses and preparing your live link."
      onClose={onClose}
      widthClass="max-w-3xl"
      animationKey="assessment-processing"
    >
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-5">
        <motion.div variants={fadeUpItem} className="rounded-[20px] border border-blue-100 bg-[linear-gradient(135deg,rgba(239,246,255,0.96)_0%,rgba(255,255,255,0.96)_100%)] p-4 text-sm leading-6 text-slate-700">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-white text-blue-700 shadow-sm">
              <Clock3 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-700">Progress update</p>
              <p className="mt-1">{processingCopy}</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUpItem} className="rounded-[20px] border border-stone-200 bg-stone-50 p-4">
          <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
            <span>Progress</span>
            <span>{Math.round(processingProgress)}%</span>
          </div>
          <div className="mt-3 h-3 rounded-full bg-stone-200">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-400 transition-all"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(5, processingProgress)}%` }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: `${Math.max(5, processingProgress)}%` }}
            />
          </div>
        </motion.div>

        <motion.div variants={fadeUpItem} className="grid gap-3">
          {dimensionLabels.map((label, index) => {
            const isActive = index === processingDimensionIndex;
            const isComplete = index < processingDimensionIndex;

            return (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className={`flex items-center justify-between rounded-[18px] border px-4 py-3 text-sm ${
                  isActive
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : isComplete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-stone-200 bg-white text-slate-500"
                }`}
              >
                <span className="font-medium">{label}</span>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.16em]">
                  {isComplete ? "Complete" : isActive ? "Processing" : "Queued"}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          variants={fadeUpItem}
          animate={{ opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
        >
          <Clock3 className="h-4 w-4" />
          {processingProgress >= 85 ? "Almost done. Preparing your report link." : "Preparing your report link."}
        </motion.div>
      </motion.div>
    </AssessmentModal>
  );
}

export function AssessmentFinalResultScreen({
  lastSubmission,
  onStartAnother,
  onClose
}: {
  lastSubmission: AssessmentResultSnapshot | null;
  onStartAnother: () => void;
  onClose: () => void;
}) {
  const deliveryCopy =
    lastSubmission?.deliveryMode === "mock"
      ? "Email delivery is in mock mode here, but the secure report link is ready now."
      : `Your report was emailed to ${lastSubmission?.recipientEmail}.`;

  return (
    <AssessmentModal
      eyebrow="Report Ready"
      title="Report ready"
      description="Open your live organisation snapshot below."
      onClose={onClose}
      widthClass="max-w-4xl"
      animationKey="assessment-result"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onStartAnother} className={secondaryButtonClasses}>
            Start Another Response
            <ArrowRight className="h-4 w-4" />
          </button>
          {lastSubmission ? (
            <a
              href={lastSubmission.reportViewUrl}
              target="_blank"
              rel="noreferrer"
              className={`${primaryButtonClasses} sm:flex-1`}
            >
              <Eye className="h-4 w-4" />
              View My Report
            </a>
          ) : null}
        </div>
      }
    >
      {lastSubmission ? (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
          <motion.div variants={fadeUpItem} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CompactMetric label="Organisation" value={lastSubmission.orgName} hint={getFirmTypeLabel(lastSubmission.firmType)} />
            <CompactMetric label="Latest Snapshot" value={`${lastSubmission.latestTotalScore.toFixed(1)}/100`} hint={lastSubmission.latestReadinessLevel} />
            <CompactMetric label="Your Response" value={`${lastSubmission.respondentTotalScore}/100`} hint={lastSubmission.respondentReadinessLevel} />
            <CompactMetric label="Responses" value={String(lastSubmission.submissionCount)} hint={formatGeneratedAt(lastSubmission.generatedAt)} />
          </motion.div>

          <motion.div variants={fadeUpItem} className="rounded-[20px] border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-slate-700">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
              <p>{deliveryCopy}</p>
            </div>
          </motion.div>

          <motion.div variants={fadeUpItem} className="rounded-[20px] border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-slate-600">
            This link updates as new team responses arrive.
          </motion.div>
        </motion.div>
      ) : (
        <div className="rounded-[20px] border border-stone-200 bg-stone-50 p-6 text-center text-sm text-slate-600">
          The report link is no longer in local session storage. Start another response to generate a new live snapshot.
        </div>
      )}
    </AssessmentModal>
  );
}

export function DirectorSetupScreen({
  directorForm,
  firmTypeOptions,
  entryLoading,
  entryError,
  entryNotice,
  onDismissEntryError,
  onDismissEntryNotice,
  onFirmTypeChange,
  onOrgNameChange,
  onEmailChange,
  onNameChange,
  onDeptChange,
  onConsentChange,
  onBack,
  onSubmit,
  onClose
}: {
  directorForm: DirectorSetupDraft;
  firmTypeOptions: Array<{ value: FirmType; label: string; description: string }>;
  entryLoading: boolean;
  entryError: string;
  entryNotice: string;
  onDismissEntryError: () => void;
  onDismissEntryNotice: () => void;
  onFirmTypeChange: (value: FirmType) => void;
  onOrgNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onDeptChange: (value: string) => void;
  onConsentChange: (value: boolean) => void;
  onBack: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  return (
    <AssessmentModal
      eyebrow="Director Setup"
      title="Create team assessment"
      description="Create the firm and issue the team invite link."
      onClose={onClose}
      widthClass="max-w-4xl"
      animationKey="director-setup"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onBack} className={secondaryButtonClasses}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="submit"
            form="director-setup-form"
            disabled={entryLoading}
            className={`${primaryButtonClasses} sm:flex-1`}
          >
            {entryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Create Firm and Invite
          </button>
        </div>
      }
    >
      <motion.form
        id="director-setup-form"
        className="space-y-4"
        onSubmit={onSubmit}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUpItem} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
              Firm Type
            </label>
            <select value={directorForm.firmType} onChange={(event) => onFirmTypeChange(event.target.value as FirmType)} className={inputClasses}>
              {firmTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
              Full Name
            </label>
            <input type="text" value={directorForm.name} onChange={(event) => onNameChange(event.target.value)} placeholder="Jane Doe" className={inputClasses} />
          </div>
          <div className="space-y-2">
            <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
              Work Email
            </label>
            <input type="email" value={directorForm.email} onChange={(event) => onEmailChange(event.target.value)} placeholder="director@company.com" className={inputClasses} />
          </div>
          <div className="space-y-2">
            <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
              Organisation Name
            </label>
            <input type="text" value={directorForm.orgName} onChange={(event) => onOrgNameChange(event.target.value)} placeholder="Your organisation" className={inputClasses} />
          </div>
          <div className="space-y-2">
            <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
              Department
            </label>
            <input type="text" value={directorForm.dept} onChange={(event) => onDeptChange(event.target.value)} placeholder="Department" className={inputClasses} />
          </div>
        </motion.div>

        <motion.label variants={fadeUpItem} className="flex items-start gap-3 rounded-[18px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-slate-600">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-stone-300 text-blue-700 focus:ring-blue-200"
            checked={directorForm.consentAccepted}
            onChange={(event) => onConsentChange(event.target.checked)}
          />
          <span>I consent to using these details to create the firm and invite link.</span>
        </motion.label>

        {entryNotice ? (
          <motion.div variants={fadeUpItem}>
            <SurfaceBanner tone="success" message={entryNotice} onClose={onDismissEntryNotice} />
          </motion.div>
        ) : null}

        {entryError ? (
          <motion.div variants={fadeUpItem}>
            <SurfaceBanner tone="error" message={entryError} onClose={onDismissEntryError} />
          </motion.div>
        ) : null}
      </motion.form>
    </AssessmentModal>
  );
}
