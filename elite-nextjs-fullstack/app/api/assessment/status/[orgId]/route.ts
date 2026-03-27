import { NextResponse } from "next/server";

import { getOrganisationStatusById } from "@/lib/server/services/organisationService";
import { assertValidObjectId } from "@/lib/server/utils/objectId";
import {
  ensureServerInitialized,
  handleRouteError
} from "@/lib/server/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    await ensureServerInitialized();
    const params = await context.params;
    const orgId = assertValidObjectId(params.orgId, "organisation id");
    const organisation = await getOrganisationStatusById(orgId);

    return NextResponse.json(organisation);
  } catch (error) {
    return handleRouteError(error);
  }
}
