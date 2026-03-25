import { Resend } from "resend";

import { env } from "../config/env.js";
import type { ReportData } from "../types/assessment.js";
import { HttpError } from "../utils/httpError.js";

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
