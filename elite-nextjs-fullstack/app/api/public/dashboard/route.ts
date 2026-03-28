import { NextResponse } from "next/server";

import { getCachedPublicDashboardSnapshot } from "@/lib/server/services/organisationService";
import {
  ensureServerInitialized,
  handleRouteError
} from "@/lib/server/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureServerInitialized();

    const dashboard = await getCachedPublicDashboardSnapshot();

    return NextResponse.json(dashboard, {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=120"
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
