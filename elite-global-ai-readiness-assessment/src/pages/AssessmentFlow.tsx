import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  ShieldCheck
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { ProgressBar } from "../components/ProgressBar";
import { ASSESSMENT_QUESTIONS } from "../constants";
import { backendApi } from "../lib/backend";
import {
  ANSWERS_STORAGE_KEY,
  RESPONDENT_STORAGE_KEY
} from "../lib/app/constants";
import {
  clearAssessmentStorage,
  getErrorMessage,
  hasAnswerValue,
  isCompleteDraft,
  type AnswerState
} from "../lib/app/helpers";
import { readStorage, writeStorage } from "../lib/app/storage";
import { cn } from "../lib/utils";
import type { SubmissionDraft } from "../types";

const DIAGNOSTIC_NOTES = [
  "Choose the answer that best reflects your team today, not the aspirational future state.",
  "Responses contribute only to organisation-level reporting; individual answers stay internal.",
  "Use the final question action to submit the full assessment."
];

export function AssessmentFlow() {
  const navigate = useNavigate();
  const { step } = useParams();
  const [respondent] = useState(() =>
    readStorage<SubmissionDraft>(RESPONDENT_STORAGE_KEY)
  );
  const [answers, setAnswers] = useState<AnswerState>(
    () => readStorage<AnswerState>(ANSWERS_STORAGE_KEY) || {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  const totalSteps = ASSESSMENT_QUESTIONS.length;
  const parsedStep = Number(step);
  const currentStep =
    Number.isInteger(parsedStep) && parsedStep >= 1 && parsedStep <= totalSteps
      ? parsedStep
      : 1;
  const question = ASSESSMENT_QUESTIONS[currentStep - 1];
  const answeredCount = ASSESSMENT_QUESTIONS.filter((item) =>
    hasAnswerValue(answers[item.id])
  ).length;
  const currentDimensionQuestions = ASSESSMENT_QUESTIONS.filter(
    (item) => item.dimension === question?.dimension
  );
  const currentDimensionIndex = currentDimensionQuestions.findIndex(
    (item) => item.id === question?.id
  );

  useEffect(() => {
    if (!isCompleteDraft(respondent)) {
      navigate("/start", { replace: true });
    }
  }, [navigate, respondent]);

  useEffect(() => {
    if (step !== String(currentStep)) {
      navigate(`/assessment/${currentStep}`, { replace: true });
    }
  }, [currentStep, navigate, step]);

  useEffect(() => {
    writeStorage(ANSWERS_STORAGE_KEY, answers);
  }, [answers]);

  if (!question || !isCompleteDraft(respondent)) {
    return null;
  }

  const currentAnswer = answers[question.id];

  const goToStep = (nextStep: number) => {
    navigate(`/assessment/${nextStep}`);
  };

  const handleSelect = (value: string) => {
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
        goToStep(currentStep + 1);
      }, 250);
    }
  };

  const handleFinish = async () => {
    const missingQuestion = ASSESSMENT_QUESTIONS.find(
      (item) => !hasAnswerValue(answers[item.id])
    );

    if (missingQuestion) {
      setSubmissionError("Please answer every question before submitting.");
      goToStep(missingQuestion.id);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError("");

    const submissionPayload = {
      orgName: respondent.orgName,
      respondentEmail: respondent.email,
      respondentName: respondent.name,
      respondentRole: respondent.role,
      respondentDept: respondent.dept,
      consentAccepted: true as const,
      answers: ASSESSMENT_QUESTIONS.map((item) => ({
        questionId: item.id,
        value: answers[item.id]
      }))
    };

    try {
      await backendApi.assessment.submit(submissionPayload);
      clearAssessmentStorage();
      navigate("/complete");
    } catch (error) {
      setSubmissionError(
        getErrorMessage(error, "Failed to submit. Please try again.")
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ProgressBar current={currentStep} total={totalSteps} />

      <div className="grid-backdrop absolute inset-0 opacity-30" />
      <div className="absolute -left-16 top-24 h-72 w-72 rounded-full bg-brand-100/70 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-100/60 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 pb-10 pt-10 sm:px-8 lg:px-10">
        <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/60 bg-white/70 px-5 py-4 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.3)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-900 font-display text-sm font-bold text-white">
              E
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-slate-950">
                Elite Global AI Diagnostic
              </p>
              <p className="text-sm font-medium text-slate-500">
                {respondent.orgName} · {respondent.role.replace("-", " ")} · {respondent.dept}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
              {answeredCount}/{totalSteps} answered
            </div>
            <div className="rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-brand-700">
              Question {currentStep} of {totalSteps}
            </div>
          </div>
        </div>

        <div className="grid flex-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="panel-dark h-fit p-6 sm:p-7 lg:sticky lg:top-10">
            <div className="space-y-7">
              <div className="space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-blue-200">
                  Current Dimension
                </p>
                <h2 className="text-2xl text-white">{question.dimension}</h2>
                <p className="text-sm text-slate-300">
                  Question {currentDimensionIndex + 1} of {currentDimensionQuestions.length} in
                  this section.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-blue-100">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-blue-200/80">
                    Organisation
                  </p>
                  <p className="text-sm font-semibold text-white">{respondent.orgName}</p>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-blue-100">
                    <Clock3 className="h-5 w-5" />
                  </div>
                  <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-blue-200/80">
                    Session Pace
                  </p>
                  <p className="text-sm font-semibold text-white">
                    Usually completed in one sitting
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-blue-100">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-blue-200/80">
                    Privacy
                  </p>
                  <p className="text-sm font-semibold text-white">
                    Individual responses stay internal
                  </p>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.22em] text-blue-200">
                  Response Guidance
                </p>
                <div className="space-y-4">
                  {DIAGNOSTIC_NOTES.map((note, index) => (
                    <div key={note} className="flex gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-xs font-bold text-white">
                        {index + 1}
                      </div>
                      <p className="text-sm text-slate-300">{note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="flex flex-col">
            <AnimatePresence mode="wait">
              <motion.section
                key={currentStep}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
                className="panel flex h-full flex-col p-6 sm:p-8 lg:p-10"
              >
                <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-4xl space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
                        {question.dimension}
                      </span>
                      {question.multiSelect ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-amber-700">
                          Multi-select question
                        </span>
                      ) : null}
                    </div>

                    <h1 className="text-3xl leading-[1.08] text-slate-950 sm:text-4xl lg:text-[2.9rem]">
                      {question.text}
                    </h1>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 sm:min-w-[185px]">
                    <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                      Assessment Progress
                    </p>
                    <p className="text-3xl font-extrabold tracking-tight text-slate-950">
                      {Math.round((currentStep / totalSteps) * 100)}%
                    </p>
                    <p className="text-sm font-medium text-slate-500">
                      {answeredCount} questions completed so far
                    </p>
                  </div>
                </div>

                {question.multiSelect ? (
                  <div className="mb-6 rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900">
                    Select all answers that apply to your current workflow. Use
                    “None of the above” only when no listed capability is in use.
                  </div>
                ) : null}

                <div className="grid gap-4">
                  {question.options.map((option, index) => {
                    const isSelected = question.multiSelect
                      ? Array.isArray(currentAnswer) &&
                        currentAnswer.includes(option.value)
                      : currentAnswer === option.value;
                    const optionLabel = question.multiSelect
                      ? `${index + 1}`
                      : option.value;

                    return (
                      <button
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          "group flex w-full items-start gap-5 rounded-[30px] border px-5 py-5 text-left transition-all duration-300 sm:px-6 sm:py-6",
                          isSelected
                            ? "border-brand-700 bg-brand-900 text-white shadow-[0_24px_60px_-35px_rgba(16,33,63,0.8)]"
                            : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_22px_50px_-36px_rgba(15,23,42,0.3)]"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-extrabold transition-all",
                            isSelected
                              ? "border-white/20 bg-white/10 text-white"
                              : "border-slate-200 bg-slate-50 text-slate-500 group-hover:border-brand-200 group-hover:bg-brand-50 group-hover:text-brand-700"
                          )}
                        >
                          {isSelected ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            optionLabel
                          )}
                        </div>

                        <div className="flex-1">
                          <p
                            className={cn(
                              "text-base font-extrabold leading-relaxed sm:text-lg",
                              isSelected ? "text-white" : "text-slate-900"
                            )}
                          >
                            {option.label}
                          </p>
                        </div>

                        <div
                          className={cn(
                            "mt-1 h-6 w-6 shrink-0 rounded-full border transition-all",
                            isSelected
                              ? "border-white bg-white/10"
                              : "border-slate-300 group-hover:border-brand-400"
                          )}
                        />
                      </button>
                    );
                  })}
                </div>

                {submissionError && (
                  <div className="mt-6 rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                      <span>{submissionError}</span>
                    </div>
                  </div>
                )}

                <div className="mt-auto flex flex-col gap-5 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    disabled={currentStep === 1}
                    onClick={() => goToStep(currentStep - 1)}
                    className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-500 transition-colors hover:text-slate-950 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronLeft className="h-5 w-5" /> Previous Question
                  </button>

                  {currentStep === totalSteps ? (
                    <button
                      onClick={handleFinish}
                      disabled={!hasAnswerValue(currentAnswer) || isSubmitting}
                      className="btn-primary flex w-full items-center justify-center gap-3 disabled:opacity-50 sm:w-auto sm:min-w-[240px]"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          Finish Assessment <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      disabled={!hasAnswerValue(currentAnswer)}
                      onClick={() => goToStep(currentStep + 1)}
                      className="btn-secondary flex w-full items-center justify-center gap-3 disabled:opacity-40 sm:w-auto sm:min-w-[220px]"
                    >
                      Continue <ChevronRight className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </motion.section>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
