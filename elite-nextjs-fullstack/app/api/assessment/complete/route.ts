import { NextResponse } from "next/server";

import { parseAssessmentCompletionBody } from "@/lib/server/services/payloadValidators";
import { submitAssessmentAndGenerateImmediateReport } from "@/lib/server/services/submissionService";
import {
  ensureServerInitialized,
  handleRouteError
} from "@/lib/server/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    await ensureServerInitialized();

    const body = await request.json();
    const payload = parseAssessmentCompletionBody(body);
    const response = await submitAssessmentAndGenerateImmediateReport({
      payload,
      requestUrl: request.url
    });

    return NextResponse.json(
      response,
      { status: 201 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
