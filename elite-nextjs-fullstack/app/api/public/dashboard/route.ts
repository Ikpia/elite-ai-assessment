import { NextResponse } from "next/server";

import { getPublicDashboardSnapshot } from "@/lib/server/services/organisationService";
import {
  ensureServerInitialized,
  handleRouteError
} from "@/lib/server/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureServerInitialized();

    const dashboard = await getPublicDashboardSnapshot();

    return NextResponse.json(dashboard);
  } catch (error) {
    return handleRouteError(error);
  }
}
