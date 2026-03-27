import { NextResponse } from "next/server";

import { parseValidateEmailBody } from "@/lib/server/services/payloadValidators";
import { validateCompanyEmail } from "@/lib/server/services/emailValidationService";
import { handleRouteError } from "@/lib/server/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = parseValidateEmailBody(body);
    const validation = validateCompanyEmail(email);

    return NextResponse.json(validation);
  } catch (error) {
    return handleRouteError(error);
  }
}
