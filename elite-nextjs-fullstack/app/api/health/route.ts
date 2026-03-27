import { NextResponse } from "next/server";

import { env } from "@/lib/server/config/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "elite-global-ai-backend",
    environment: env.nodeEnv
  });
}
