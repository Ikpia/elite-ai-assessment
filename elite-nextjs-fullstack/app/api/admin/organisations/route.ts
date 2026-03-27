import { NextResponse } from "next/server";

import { listOrganisationDashboards } from "@/lib/server/services/organisationService";
import {
  ensureServerInitialized,
  handleRouteError,
  requireAdmin
} from "@/lib/server/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await ensureServerInitialized();
    requireAdmin(request.headers);

    const organisations = await listOrganisationDashboards();

    return NextResponse.json({ organisations });
  } catch (error) {
    return handleRouteError(error);
  }
}
