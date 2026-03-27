import { NextResponse } from "next/server";

import { purgeExpiredSubmissions } from "@/lib/server/services/retentionService";
import { ensureServerInitialized } from "@/lib/server/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 }
    );
  }

  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  await ensureServerInitialized();
  const result = await purgeExpiredSubmissions();

  return NextResponse.json({
    message: "Retention cleanup completed.",
    ...result
  });
}
