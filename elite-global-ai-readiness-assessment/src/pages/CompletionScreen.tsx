import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, FileText, ShieldCheck } from "lucide-react";

import { MARKETING_SITE_URL } from "../lib/app/constants";

export function CompletionScreen() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="grid-backdrop absolute inset-0 opacity-30" />
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand-100/70 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-100/60 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-5 py-10 sm:px-8">
        <motion.section
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="panel w-full max-w-3xl overflow-hidden"
        >
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="panel-dark rounded-none border-0 p-8 sm:p-10">
              <div className="space-y-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-emerald-400/10 text-emerald-100">
                  <CheckCircle2 className="h-9 w-9" />
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-emerald-100/80">
                    Submission Complete
                  </p>
                  <h1 className="text-4xl leading-[1.04] text-white">
                    Response recorded successfully.
                  </h1>
                  <p className="text-base text-slate-300">
                    The respondent input is now stored and will contribute to the
                    final organisation-level readiness report.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 flex items-center gap-3 text-blue-100">
                      <ShieldCheck className="h-5 w-5" />
                      <p className="text-sm font-bold">Confidential handling</p>
                    </div>
                    <p className="text-sm text-slate-300">
                      Individual responses remain internal. Directors only receive
                      aggregated organisation-level output.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 flex items-center gap-3 text-blue-100">
                      <FileText className="h-5 w-5" />
                      <p className="text-sm font-bold">Next operational step</p>
                    </div>
                    <p className="text-sm text-slate-300">
                      Elite Global AI reviews the aggregate data, generates the PDF,
                      and sends it to the configured director email.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 sm:p-10">
              <div className="space-y-6">
                <p className="eyebrow">What Happens Next</p>
                <h2 className="text-4xl text-slate-950">Assessment Complete</h2>
                <p className="text-base font-medium text-slate-500">
                  Thank you for completing the assessment. You can now return to
                  the main Elite Global AI site while the organisation report is
                  prepared through the admin workflow.
                </p>

                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <div className="space-y-4 text-sm font-medium text-slate-600">
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-900 font-display text-sm font-bold text-white">
                        1
                      </div>
                      <p>Responses from the same organisation are aggregated together.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-900 font-display text-sm font-bold text-white">
                        2
                      </div>
                      <p>The admin team reviews the aggregate score profile and response count.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-900 font-display text-sm font-bold text-white">
                        3
                      </div>
                      <p>The final branded PDF report is sent to the configured director.</p>
                    </div>
                  </div>
                </div>

                <a
                  href={MARKETING_SITE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary inline-flex items-center gap-3"
                >
                  Return to Elite Global AI
                  <ArrowRight className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
