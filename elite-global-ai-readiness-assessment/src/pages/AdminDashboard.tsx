import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  LogOut,
  Mail,
  Send,
  ShieldCheck,
  Users
} from "lucide-react";

import { backendApi } from "../lib/backend";
import { ADMIN_SECRET_STORAGE_KEY } from "../lib/app/constants";
import {
  buildAdminDrafts,
  formatDimensionLabel,
  getErrorMessage,
  getStatusBadgeClass,
  type AdminDraftState
} from "../lib/app/helpers";
import { cn } from "../lib/utils";
import type { Organisation } from "../types";

const LOGIN_NOTES = [
  "Review response counts and readiness scores before sending the final report.",
  "Capture the correct director email and expected respondent count per organisation.",
  "Generate and send the PDF report only when you are satisfied with the aggregate data."
];

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

function getReadinessLabel(total: number): string {
  if (total <= 30) {
    return "Low";
  }

  if (total <= 54) {
    return "Developing";
  }

  if (total <= 74) {
    return "Moderate";
  }

  if (total <= 89) {
    return "Advanced";
  }

  return "Leading";
}

export function AdminDashboard() {
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [drafts, setDrafts] = useState<AdminDraftState>({});
  const [loading, setLoading] = useState(true);
  const [secret, setSecret] = useState(
    () => sessionStorage.getItem(ADMIN_SECRET_STORAGE_KEY) || ""
  );
  const [isAuthed, setIsAuthed] = useState(false);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const fetchOrgs = async (providedSecret = secret) => {
    if (!providedSecret.trim()) {
      setError("Enter the admin secret to continue.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await backendApi.admin.organisations.list(providedSecret);

      setOrgs(data.organisations);
      setDrafts(buildAdminDrafts(data.organisations));
      setIsAuthed(true);
      sessionStorage.setItem(ADMIN_SECRET_STORAGE_KEY, providedSecret);
    } catch (error) {
      setIsAuthed(false);
      sessionStorage.removeItem(ADMIN_SECRET_STORAGE_KEY);
      setError(
        getErrorMessage(error, "Unable to access the admin dashboard.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedSecret = sessionStorage.getItem(ADMIN_SECRET_STORAGE_KEY);

    if (storedSecret) {
      void fetchOrgs(storedSecret);
      return;
    }

    setLoading(false);
  }, []);

  const updateDraft = (
    organisationId: string,
    field: "directorEmail" | "expectedRespondents",
    value: string
  ) => {
    setDrafts((current) => ({
      ...current,
      [organisationId]: {
        ...current[organisationId],
        [field]: value
      }
    }));
  };

  const handleSaveOrg = async (organisationId: string) => {
    const draft = drafts[organisationId];

    if (!draft) {
      return;
    }

    const payload: Record<string, unknown> = {};
    const directorEmail = draft.directorEmail.trim();
    const expectedRespondents = draft.expectedRespondents.trim();

    if (directorEmail) {
      payload.directorEmail = directorEmail;
    }

    if (expectedRespondents) {
      const numericValue = Number(expectedRespondents);

      if (!Number.isInteger(numericValue) || numericValue <= 0) {
        setError("Expected respondents must be a positive whole number.");
        return;
      }

      payload.expectedRespondents = numericValue;
    } else {
      payload.expectedRespondents = null;
    }

    setBusyKey(`save-${organisationId}`);
    setError("");

    try {
      await backendApi.admin.organisations.update(secret, organisationId, payload);
      await fetchOrgs(secret);
    } catch (error) {
      setError(getErrorMessage(error, "Failed to update organisation."));
    } finally {
      setBusyKey(null);
    }
  };

  const handleSendReport = async (organisationId: string) => {
    const draft = drafts[organisationId];
    const directorEmail = draft?.directorEmail.trim();

    setBusyKey(`send-${organisationId}`);
    setError("");

    try {
      await backendApi.report.send(
        secret,
        organisationId,
        directorEmail ? { directorEmail } : undefined
      );
      await fetchOrgs(secret);
    } catch (error) {
      setError(getErrorMessage(error, "Failed to send report."));
    } finally {
      setBusyKey(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_SECRET_STORAGE_KEY);
    setSecret("");
    setIsAuthed(false);
    setOrgs([]);
    setDrafts({});
    setError("");
  };

  const totalSubmissions = orgs.reduce(
    (total, organisation) => total + organisation.submissionCount,
    0
  );
  const reportsSent = orgs.filter((organisation) => organisation.status === "sent").length;
  const averageScore =
    orgs.length > 0
      ? orgs.reduce(
          (total, organisation) => total + organisation.aggregatedScores.total,
          0
        ) / orgs.length
      : 0;

  if (!isAuthed) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div className="grid-backdrop absolute inset-0 opacity-30" />
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand-100/80 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-100/60 blur-3xl" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="grid w-full gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <section className="panel-dark p-8 sm:p-10 lg:p-12">
              <div className="space-y-10">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 font-display text-lg font-bold text-white">
                    E
                  </div>
                  <div>
                    <p className="font-display text-xl font-bold text-white">
                      Elite Admin Console
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200/80">
                      Internal Operations
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-blue-200">
                    Delivery Workflow
                  </p>
                  <h1 className="max-w-2xl text-4xl leading-[1.02] text-white sm:text-5xl">
                    Review the aggregate, validate the recipient, then release the report.
                  </h1>
                  <p className="max-w-xl text-base text-slate-300 sm:text-lg">
                    This console is for Elite Global AI operations only. Use it to
                    manage organisation readiness records and send polished PDF reports.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <ShieldCheck className="mb-4 h-5 w-5 text-blue-100" />
                    <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-blue-200/80">
                      Access
                    </p>
                    <p className="text-sm font-semibold text-white">
                      Protected by shared admin token
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <BarChart3 className="mb-4 h-5 w-5 text-blue-100" />
                    <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-blue-200/80">
                      Visibility
                    </p>
                    <p className="text-sm font-semibold text-white">
                      Aggregate scores before final delivery
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <Send className="mb-4 h-5 w-5 text-blue-100" />
                    <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-blue-200/80">
                      Output
                    </p>
                    <p className="text-sm font-semibold text-white">
                      Director-ready PDF report via email
                    </p>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                  <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.22em] text-blue-200">
                    Recommended Sequence
                  </p>
                  <div className="space-y-4">
                    {LOGIN_NOTES.map((note, index) => (
                      <div key={note} className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-sm font-bold text-white">
                          {index + 1}
                        </div>
                        <p className="text-sm text-slate-300">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="panel p-7 sm:p-9 lg:p-10">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-900 font-display text-sm font-bold text-white">
                  E
                </div>
                <div>
                  <p className="font-display text-lg font-bold text-slate-950">
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
                <p className="max-w-md text-sm font-medium text-slate-500 sm:text-base">
                  Enter the internal admin secret from the backend environment to
                  load the organisation readiness dashboard.
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2.5">
                  <label className="eyebrow ml-1">Secure Access Token</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    className="input-shell font-mono"
                    value={secret}
                    onChange={(event) => setSecret(event.target.value)}
                  />
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => void fetchOrgs(secret)}
                  disabled={loading}
                  className="btn-primary flex w-full items-center justify-center gap-3"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Login to Dashboard <ArrowUpRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="grid-backdrop absolute inset-0 opacity-25" />
      <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand-100/70 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-100/50 blur-3xl" />

      <div className="relative">
        <nav className="border-b border-white/60 bg-white/75 backdrop-blur-xl">
          <div className="section-container flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-900 font-display text-sm font-bold text-white">
                E
              </div>
              <div>
                <p className="font-display text-xl font-bold tracking-tight text-slate-950">
                  Elite Admin Dashboard
                </p>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Operations console
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                {orgs.length} orgs
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                {totalSubmissions} submissions
              </div>
              <button
                onClick={handleLogout}
                className="btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </div>
        </nav>

        <main className="section-container py-8 sm:py-10">
          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="metric-card">
              <p className="eyebrow mb-3">Tracked Organisations</p>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-extrabold tracking-tight text-slate-950">
                  {orgs.length}
                </p>
                <Building2 className="h-5 w-5 text-slate-300" />
              </div>
            </div>

            <div className="metric-card">
              <p className="eyebrow mb-3">Total Submissions</p>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-extrabold tracking-tight text-slate-950">
                  {totalSubmissions}
                </p>
                <Users className="h-5 w-5 text-slate-300" />
              </div>
            </div>

            <div className="metric-card">
              <p className="eyebrow mb-3">Reports Sent</p>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-extrabold tracking-tight text-slate-950">
                  {reportsSent}
                </p>
                <Send className="h-5 w-5 text-slate-300" />
              </div>
            </div>

            <div className="metric-card">
              <p className="eyebrow mb-3">Average Score</p>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-extrabold tracking-tight text-slate-950">
                  {averageScore.toFixed(1)}
                </p>
                <BarChart3 className="h-5 w-5 text-slate-300" />
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="panel flex items-center justify-center gap-3 p-10 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-semibold">Loading organisations...</span>
            </div>
          ) : orgs.length === 0 ? (
            <div className="panel p-12 text-center">
              <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                No Organisations Yet
              </p>
              <h2 className="mb-3 text-3xl text-slate-950">No assessment data available.</h2>
              <p className="mx-auto max-w-xl text-sm font-medium text-slate-500 sm:text-base">
                Organisations will appear here once respondents complete the assessment flow.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {orgs.map((org) => {
                const draft = drafts[org.id] || {
                  directorEmail: "",
                  expectedRespondents: ""
                };
                const readinessLabel = getReadinessLabel(org.aggregatedScores.total);
                const completionRatio = getCompletionRatio(org);

                return (
                  <section key={org.id} className="panel overflow-hidden p-6 sm:p-8">
                    <div className="mb-8 flex flex-col gap-6 border-b border-slate-200 pb-8 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-3xl text-slate-950">{org.orgName}</h2>
                          <span
                            className={cn(
                              "rounded-full px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.22em]",
                              getStatusBadgeClass(org.status)
                            )}
                          >
                            {org.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-500">
                          Assessment group:{" "}
                          <span className="font-mono font-semibold text-slate-700">
                            {org.organisationKey}
                          </span>
                        </p>
                        <p className="text-sm font-medium text-slate-500">
                          Report last sent:{" "}
                          <span className="font-semibold text-slate-700">
                            {formatReportDate(org.reportSentAt)}
                          </span>
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="metric-card min-w-[150px] px-5 py-4">
                          <p className="eyebrow mb-2">Responses</p>
                          <p className="text-3xl font-extrabold tracking-tight text-slate-950">
                            {org.submissionCount}
                            {org.expectedRespondents ? (
                              <span className="text-lg text-slate-300">
                                /{org.expectedRespondents}
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <div className="metric-card min-w-[150px] px-5 py-4">
                          <p className="eyebrow mb-2">Overall Score</p>
                          <p className="text-3xl font-extrabold tracking-tight text-slate-950">
                            {org.aggregatedScores.total.toFixed(1)}
                          </p>
                        </div>
                        <div className="metric-card min-w-[150px] px-5 py-4">
                          <p className="eyebrow mb-2">Readiness Band</p>
                          <p className="text-2xl font-extrabold tracking-tight text-slate-950">
                            {readinessLabel}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
                      <div className="space-y-6">
                        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                          <div className="mb-4 flex items-center justify-between gap-4">
                            <div>
                              <p className="eyebrow mb-2">Completion Tracking</p>
                              <p className="text-lg font-bold text-slate-900">
                                Monitor whether response volume is sufficient for delivery.
                              </p>
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-slate-300" />
                          </div>

                          {completionRatio !== null ? (
                            <>
                              <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-600">
                                <span>Progress toward expected respondents</span>
                                <span>{completionRatio.toFixed(0)}%</span>
                              </div>
                              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className="h-full rounded-full bg-brand-600"
                                  style={{ width: `${completionRatio}%` }}
                                />
                              </div>
                            </>
                          ) : (
                            <p className="text-sm font-medium text-slate-500">
                              Expected respondents have not been configured yet.
                            </p>
                          )}
                        </div>

                        <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                          <div className="mb-5 flex items-center justify-between gap-4">
                            <div>
                              <p className="eyebrow mb-2">Dimension Breakdown</p>
                              <p className="text-lg font-bold text-slate-900">
                                Current aggregate scores across the five readiness dimensions.
                              </p>
                            </div>
                            <BarChart3 className="h-5 w-5 text-slate-300" />
                          </div>

                          <div className="space-y-4">
                            {Object.entries(org.aggregatedScores)
                              .filter(([key]) => key !== "total")
                              .map(([key, value]) => {
                                const score = value as number;

                                return (
                                  <div key={key} className="space-y-2">
                                    <div className="flex items-center justify-between gap-4">
                                      <p className="text-sm font-bold text-slate-800">
                                        {formatDimensionLabel(key)}
                                      </p>
                                      <p className="text-sm font-extrabold text-slate-900">
                                        {score.toFixed(1)}/20
                                      </p>
                                    </div>
                                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                      <div
                                        className="h-full rounded-full bg-brand-600"
                                        style={{
                                          width: `${Math.min(100, (score / 20) * 100)}%`
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 sm:p-6">
                        <div className="mb-6 flex items-center justify-between gap-4">
                          <div>
                            <p className="eyebrow mb-2">Delivery Controls</p>
                            <p className="text-lg font-bold text-slate-900">
                              Set the report recipient and finalise the organisation record.
                            </p>
                          </div>
                          <FileText className="h-5 w-5 text-slate-300" />
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2.5">
                            <label className="eyebrow ml-1">Director Email</label>
                            <div className="relative">
                              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                              <input
                                type="email"
                                placeholder="director@organisation.com"
                                className="input-shell pl-11"
                                value={draft.directorEmail}
                                onChange={(event) =>
                                  updateDraft(
                                    org.id,
                                    "directorEmail",
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <label className="eyebrow ml-1">Expected Respondents</label>
                            <div className="relative">
                              <Users className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                              <input
                                type="number"
                                min="1"
                                placeholder="e.g. 12"
                                className="input-shell pl-11"
                                value={draft.expectedRespondents}
                                onChange={(event) =>
                                  updateDraft(
                                    org.id,
                                    "expectedRespondents",
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-4">
                          <p className="eyebrow mb-2">Readiness Summary</p>
                          <p className="text-sm font-medium text-slate-600">
                            {org.orgName} is currently in the{" "}
                            <span className="font-bold text-slate-900">{readinessLabel}</span>{" "}
                            band with an overall score of{" "}
                            <span className="font-bold text-slate-900">
                              {org.aggregatedScores.total.toFixed(1)}/100
                            </span>
                            .
                          </p>
                        </div>

                        <div className="mt-6 flex flex-col gap-3">
                          <button
                            onClick={() => void handleSaveOrg(org.id)}
                            disabled={busyKey === `save-${org.id}`}
                            className="btn-secondary flex w-full items-center justify-center gap-3 disabled:opacity-60"
                          >
                            {busyKey === `save-${org.id}` ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <>
                                <Building2 className="h-5 w-5" /> Save Organisation Details
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => void handleSendReport(org.id)}
                            disabled={busyKey === `send-${org.id}`}
                            className="btn-primary flex w-full items-center justify-center gap-3 disabled:opacity-60"
                          >
                            {busyKey === `send-${org.id}` ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <>
                                <FileText className="h-5 w-5" /> Approve & Send Report
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
