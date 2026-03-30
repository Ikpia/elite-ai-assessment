import { Resend } from "resend";

import { env } from "../config/env";
import type { ReportData } from "../types/assessment";
import { HttpError } from "../utils/httpError";

function buildReportEmailHtml(reportData: ReportData): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h1 style="margin-bottom: 8px;">Elite Global AI Readiness Report</h1>
      <p style="margin-top: 0;">${reportData.orgName}'s assessment report is ready.</p>
      <p>
        Overall readiness score:
        <strong>${reportData.aggregatedScores.total}/100</strong>
        (${reportData.readinessLevel})
      </p>
      <p>
        Responses captured: <strong>${reportData.submittedRespondents}</strong>
      </p>
      <p>
        Benchmark comparison:
        local baseline ${reportData.benchmarkLocal}/100,
        global benchmark ${reportData.benchmarkGlobal}/100.
      </p>
      <p>
        Priority actions:
      </p>
      <ul>
        ${reportData.weakestDimensions
          .map(
            (dimension) =>
              `<li><strong>${dimension.label}</strong>: ${dimension.recommendation}</li>`
          )
          .join("")}
      </ul>
      <p>
        Recommended next step:
        schedule a strategy and training call with Elite Global AI.
      </p>
      <p>
        <a href="${env.appBaseUrl}" style="color: #0b5fff;">Visit Elite Global AI</a>
      </p>
    </div>
  `;
}

function buildAdminAccessEmailHtml(params: {
  accessLabel: string;
  accessUrl: string;
  expiresInHours: number;
}): string {
  const { accessLabel, accessUrl, expiresInHours } = params;

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h1 style="margin-bottom: 8px;">Elite Global AI Admin Access</h1>
      <p style="margin-top: 0;">A secure admin link was requested for ${accessLabel}.</p>
      <p>
        <a
          href="${accessUrl}"
          style="display:inline-block;padding:12px 20px;border-radius:999px;background:#0b5fff;color:#ffffff;text-decoration:none;font-weight:700;"
        >
          Open Admin Dashboard
        </a>
      </p>
      <p>This link expires in ${expiresInHours} hour${expiresInHours === 1 ? "" : "s"}.</p>
      <p>If you did not request this access, you can ignore this email.</p>
    </div>
  `;
}

export async function sendOrganisationReportEmail(params: {
  directorEmail: string;
  filename: string;
  pdfBuffer: Buffer;
  reportData: ReportData;
}): Promise<{ mode: "mock" | "live"; messageId: string | null }> {
  const { directorEmail, filename, pdfBuffer, reportData } = params;

  if (!env.resendApiKey || !env.resendFromEmail) {
    return {
      mode: "mock",
      messageId: null
    };
  }

  const resend = new Resend(env.resendApiKey);
  const { data, error } = await resend.emails.send({
    from: env.resendFromEmail,
    to: directorEmail,
    subject: `${reportData.orgName} AI Readiness Assessment Report`,
    html: buildReportEmailHtml(reportData),
    attachments: [
      {
        filename,
        content: pdfBuffer.toString("base64")
      }
    ]
  });

  if (error) {
    throw new HttpError(502, "Report email delivery failed.", error);
  }

  return {
    mode: "live",
    messageId: data?.id || null
  };
}

export async function sendAdminAccessEmail(params: {
  recipientEmail: string;
  accessLabel: string;
  accessUrl: string;
  expiresInHours: number;
}): Promise<{ mode: "mock" | "live"; messageId: string | null }> {
  const { recipientEmail, accessLabel, accessUrl, expiresInHours } = params;

  if (!env.resendApiKey || !env.resendFromEmail) {
    return {
      mode: "mock",
      messageId: null
    };
  }

  const resend = new Resend(env.resendApiKey);
  const { data, error } = await resend.emails.send({
    from: env.resendFromEmail,
    to: recipientEmail,
    subject: `${accessLabel} admin dashboard access`,
    html: buildAdminAccessEmailHtml({
      accessLabel,
      accessUrl,
      expiresInHours
    })
  });

  if (error) {
    if (env.nodeEnv !== "production") {
      console.warn("Admin access email delivery failed; falling back to mock mode.", error);
      return {
        mode: "mock",
        messageId: null
      };
    }

    throw new HttpError(502, "Admin access email delivery failed.", error);
  }

  return {
    mode: "live",
    messageId: data?.id || null
  };
}
