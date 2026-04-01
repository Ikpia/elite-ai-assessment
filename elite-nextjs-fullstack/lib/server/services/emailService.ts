import nodemailer from "nodemailer";
import { Resend } from "resend";

import { env } from "../config/env";
import type { ReportData } from "../types/assessment";
import { HttpError } from "../utils/httpError";

type EmailDeliveryResult = {
  mode: "mock" | "live";
  messageId: string | null;
};

type EmailAttachment = {
  filename: string;
  content: Buffer;
};

type EmailSendParams = {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
  failureMessage: string;
};

function toErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack
    };
  }

  return error;
}

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

function buildDirectorInviteEmailHtml(params: {
  directorName: string;
  orgName: string;
  shareUrl: string;
}): string {
  const { directorName, orgName, shareUrl } = params;

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h1 style="margin-bottom: 8px;">Elite Global AI Team Assessment Link</h1>
      <p style="margin-top: 0;">Hello ${directorName},</p>
      <p>
        Your email has been registered as the firm admin for <strong>${orgName}</strong>.
      </p>
      <p>
        Share the link below with your team so they can open the respondent form for your firm
        and continue into the assessment.
      </p>
      <p>
        <a
          href="${shareUrl}"
          style="display:inline-block;padding:12px 20px;border-radius:999px;background:#0b5fff;color:#ffffff;text-decoration:none;font-weight:700;"
        >
          Open Team Assessment Form
        </a>
      </p>
      <p>
        You can also use your email on the admin login screen to access your firm dashboard.
      </p>
    </div>
  `;
}

function isSmtpConfigured(): boolean {
  return Boolean(env.smtpHost && env.smtpFromEmail);
}

function isResendConfigured(): boolean {
  return Boolean(env.resendApiKey && env.resendFromEmail);
}

function shouldMockOnFailure(): boolean {
  return env.nodeEnv !== "production";
}

function getConfiguredProvider(): "smtp" | "resend" | "mock" {
  if (isSmtpConfigured()) {
    return "smtp";
  }

  if (isResendConfigured()) {
    return "resend";
  }

  return "mock";
}

function getSmtpAuth() {
  if (!env.smtpUser && !env.smtpPass) {
    return undefined;
  }

  if (!env.smtpUser || !env.smtpPass) {
    throw new Error("SMTP_USER and SMTP_PASS must both be set when SMTP auth is enabled.");
  }

  return {
    user: env.smtpUser,
    pass: env.smtpPass
  };
}

async function sendViaSmtp(params: EmailSendParams): Promise<EmailDeliveryResult> {
  if (!env.smtpHost || !env.smtpFromEmail) {
    return {
      mode: "mock",
      messageId: null
    };
  }

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: getSmtpAuth()
  });

  const result = await transporter.sendMail({
    from: env.smtpFromEmail,
    to: params.to,
    subject: params.subject,
    html: params.html,
    attachments: params.attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content
    }))
  });

  return {
    mode: "live",
    messageId: result.messageId || null
  };
}

async function sendViaResend(params: EmailSendParams): Promise<EmailDeliveryResult> {
  if (!env.resendApiKey || !env.resendFromEmail) {
    return {
      mode: "mock",
      messageId: null
    };
  }

  const resend = new Resend(env.resendApiKey);
  const { data, error } = await resend.emails.send({
    from: env.resendFromEmail,
    to: params.to,
    subject: params.subject,
    html: params.html,
    attachments: params.attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content.toString("base64")
    }))
  });

  if (error) {
    throw new HttpError(502, params.failureMessage, error);
  }

  return {
    mode: "live",
    messageId: data?.id || null
  };
}

async function sendWithConfiguredProvider(params: EmailSendParams): Promise<EmailDeliveryResult> {
  const provider = getConfiguredProvider();

  if (provider === "mock") {
    return {
      mode: "mock",
      messageId: null
    };
  }

  try {
    if (provider === "smtp") {
      return await sendViaSmtp(params);
    }

    return await sendViaResend(params);
  } catch (error) {
    if (shouldMockOnFailure()) {
      console.warn(
        `${provider.toUpperCase()} email delivery failed; falling back to mock mode.`,
        error
      );
      return {
        mode: "mock",
        messageId: null
      };
    }

    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(502, params.failureMessage, toErrorDetails(error));
  }
}

export async function sendOrganisationReportEmail(params: {
  directorEmail: string;
  filename: string;
  pdfBuffer: Buffer;
  reportData: ReportData;
}): Promise<EmailDeliveryResult> {
  const { directorEmail, filename, pdfBuffer, reportData } = params;

  return sendWithConfiguredProvider({
    to: directorEmail,
    subject: `${reportData.orgName} AI Readiness Assessment Report`,
    html: buildReportEmailHtml(reportData),
    attachments: [
      {
        filename,
        content: pdfBuffer
      }
    ],
    failureMessage: "Report email delivery failed."
  });
}

export async function sendAdminAccessEmail(params: {
  recipientEmail: string;
  accessLabel: string;
  accessUrl: string;
  expiresInHours: number;
}): Promise<EmailDeliveryResult> {
  const { recipientEmail, accessLabel, accessUrl, expiresInHours } = params;

  return sendWithConfiguredProvider({
    to: recipientEmail,
    subject: `${accessLabel} admin dashboard access`,
    html: buildAdminAccessEmailHtml({
      accessLabel,
      accessUrl,
      expiresInHours
    }),
    failureMessage: "Admin access email delivery failed."
  });
}

export async function sendDirectorInviteEmail(params: {
  directorEmail: string;
  directorName: string;
  orgName: string;
  shareUrl: string;
}): Promise<EmailDeliveryResult> {
  const { directorEmail, directorName, orgName, shareUrl } = params;

  return sendWithConfiguredProvider({
    to: directorEmail,
    subject: `${orgName} team assessment link`,
    html: buildDirectorInviteEmailHtml({
      directorName,
      orgName,
      shareUrl
    }),
    failureMessage: "Director invite email delivery failed."
  });
}
