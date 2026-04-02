import { NextResponse } from "next/server";

import { resolveOrganisationByName } from "@/lib/server/services/organisationService";
import { parseResolveOrganisationBody } from "@/lib/server/services/payloadValidators";
import {
  ensureServerInitialized,
  handleRouteError
} from "@/lib/server/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await ensureServerInitialized();

    const body = await request.json();
    const { orgName } = parseResolveOrganisationBody(body);
    const organisation = await resolveOrganisationByName(orgName);

    return NextResponse.json(organisation);
  } catch (error) {
    return handleRouteError(error);
  }
}
