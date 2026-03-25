import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Clock3,
  Loader2,
  ShieldCheck,
  Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { backendApi } from "../lib/backend";
import {
  ANSWERS_STORAGE_KEY,
  EMPTY_ENTRY_DRAFT,
  MARKETING_SITE_URL,
  RESPONDENT_STORAGE_KEY
} from "../lib/app/constants";
import { getErrorMessage } from "../lib/app/helpers";
import { readStorage, writeStorage } from "../lib/app/storage";
import type { SubmissionDraft, ValidateEmailResponse } from "../types";

const ENTRY_HIGHLIGHTS = [
  {
    icon: Clock3,
    label: "Time Commitment",
    value: "7-10 mins"
  },
  {
    icon: ShieldCheck,
    label: "Response Handling",
    value: "Anonymised in final report"
  },
  {
    icon: BarChart3,
    label: "Outcome",
    value: "Executive-grade readiness report"
  }
];

const ENTRY_STEPS = [
  "Share respondent details so the assessment can be attributed correctly.",
  "Complete 25 guided questions across readiness, leadership, workflow, and governance.",
  "Elite Global AI aggregates the submissions into one director-ready report."
];

export function EntryScreen() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SubmissionDraft>(() => {
    const storedDraft = readStorage<Partial<SubmissionDraft>>(
      RESPONDENT_STORAGE_KEY
    );

    return {
      ...EMPTY_ENTRY_DRAFT,
      ...storedDraft
    };
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateFormField = <K extends keyof SubmissionDraft>(
    key: K,
    value: SubmissionDraft[K]
  ) => {
    setFormData((current) => ({
      ...current,
      [key]: value
    }));
  };

  const validateEmailInput = async (
    emailToValidate: string
  ): Promise<ValidateEmailResponse | null> => {
    if (!emailToValidate.trim()) {
      return null;
    }

    setLoading(true);
    setError("");

    try {
      const result = await backendApi.assessment.validateEmail(emailToValidate);

      if (!result.valid || !result.domain || !result.normalizedEmail) {
        setError(result.reason || "Please use a valid email address.");
        return null;
      }

      updateFormField("email", result.normalizedEmail);
      return result;
    } catch (error) {
      setError(getErrorMessage(error, "Connection error. Please try again."));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = await validateEmailInput(formData.email);

    if (!validation?.normalizedEmail) {
      return;
    }

    writeStorage(RESPONDENT_STORAGE_KEY, {
      ...formData,
      email: validation.normalizedEmail
    });
    localStorage.removeItem(ANSWERS_STORAGE_KEY);
    navigate("/assessment/1");
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="grid-backdrop absolute inset-0 opacity-35" />
      <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-brand-100/80 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-emerald-100/60 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="grid w-full gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="panel-dark relative overflow-hidden p-8 sm:p-10 lg:p-12"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,125,240,0.2),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />

            <div className="relative space-y-10">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 font-display text-lg font-bold text-white">
                    E
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold tracking-tight text-white">
                      Elite Global AI
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200/80">
                      Assessment Platform
                    </p>
                  </div>
                </div>

                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.24em] text-blue-100">
                  2026 Benchmark
                </span>
              </div>

              <div className="max-w-xl space-y-5">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-blue-200">
                  AI Readiness Diagnostic
                </p>
                <h1 className="max-w-2xl text-4xl leading-[1.02] text-white sm:text-5xl lg:text-[3.7rem]">
                  Establish where your organisation stands before the market decides for you.
                </h1>
                <p className="max-w-xl text-base text-slate-300 sm:text-lg">
                  This assessment captures operational readiness, leadership maturity,
                  workflow adoption, and governance discipline across your team.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {ENTRY_HIGHLIGHTS.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                    >
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-blue-100">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-blue-200/70">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-white">{item.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                  <p className="mb-5 text-[11px] font-extrabold uppercase tracking-[0.24em] text-blue-200">
                    What Happens Next
                  </p>
                  <div className="space-y-4">
                    {ENTRY_STEPS.map((step, index) => (
                      <div key={step} className="flex gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-sm font-bold text-white">
                          {index + 1}
                        </div>
                        <p className="text-sm text-slate-300">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-emerald-400/20 bg-emerald-400/10 p-6">
                  <div className="mb-5 flex items-center gap-3 text-emerald-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">For leadership teams</p>
                      <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">
                        Internal deployment
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-emerald-50/90">
                    Best run with 5 to 20 respondents per organisation so the
                    director receives a credible cross-functional view rather than
                    a single-person opinion.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="panel relative p-7 sm:p-9 lg:p-10"
          >
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-900 font-display text-sm font-bold text-white">
                E
              </div>
              <div>
                <p className="font-display text-base font-bold tracking-tight text-slate-950">
                  Respondent Entry
                </p>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Step 1 of 2
                </p>
              </div>
            </div>

            <div className="mb-8 space-y-3">
              <h2 className="text-4xl text-slate-950 sm:text-[2.8rem]">Welcome</h2>
              <p className="max-w-md text-sm font-medium text-slate-500 sm:text-base">
                Provide the respondent information below before starting the
                assessment. These details stay internal and support the final
                organisation-level analysis.
              </p>
            </div>

            <div className="mb-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-brand-700">
                No login required
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                Mobile responsive
              </span>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                Report sent separately
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2.5">
                <label className="eyebrow ml-1">Email Address</label>
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  className="input-shell"
                  value={formData.email}
                  onBlur={() => {
                    if (formData.email.trim()) {
                      void validateEmailInput(formData.email);
                    }
                  }}
                  onChange={(event) => updateFormField("email", event.target.value)}
                />
              </div>

              <div className="space-y-2.5">
                <label className="eyebrow ml-1">Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="John Doe"
                  className="input-shell"
                  value={formData.name}
                  onChange={(event) => updateFormField("name", event.target.value)}
                />
              </div>

              <div className="space-y-2.5">
                <label className="eyebrow ml-1">Organisation Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. GTBank"
                  className="input-shell"
                  value={formData.orgName}
                  onChange={(event) => updateFormField("orgName", event.target.value)}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2.5">
                  <label className="eyebrow ml-1">Role Level</label>
                  <select
                    required
                    className="input-shell appearance-none"
                    value={formData.role}
                    onChange={(event) =>
                      updateFormField(
                        "role",
                        event.target.value as SubmissionDraft["role"]
                      )
                    }
                  >
                    <option value="">Select role level</option>
                    <option value="c-suite">C-Suite</option>
                    <option value="manager">Manager</option>
                    <option value="ic">Individual Contributor</option>
                  </select>
                </div>

                <div className="space-y-2.5">
                  <label className="eyebrow ml-1">Department</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Finance"
                    className="input-shell"
                    value={formData.dept}
                    onChange={(event) => updateFormField("dept", event.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <label className="flex items-start gap-4 rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
                <input
                  required
                  type="checkbox"
                  checked={formData.consentAccepted}
                  onChange={(event) =>
                    updateFormField("consentAccepted", event.target.checked)
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                />
                <span className="font-medium">
                  I consent to Elite Global AI processing this assessment data
                  and understand that only anonymised organisation-level results
                  will be shared in the final report.{" "}
                  <a
                    href={MARKETING_SITE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-brand-700 hover:text-brand-900"
                  >
                    View privacy information
                  </a>
                  .
                </span>
              </label>

              <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <a
                  href={MARKETING_SITE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-bold text-slate-500 transition-colors hover:text-slate-900"
                >
                  Back to Elite Global AI
                </a>

                <button
                  disabled={loading}
                  type="submit"
                  className="btn-primary flex w-full items-center justify-center gap-3 sm:w-auto sm:min-w-[220px]"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Start Assessment <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
