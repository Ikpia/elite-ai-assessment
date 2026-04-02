import { generateOrganisationReportPdf } from "@/lib/server/services/reportService";
import { verifyReportAccessToken } from "@/lib/server/utils/reportAccess";
import {
  ensureServerInitialized,
  handleRouteError
} from "@/lib/server/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  _request: Request,
  context: { params: Promise<{ accessToken: string }> }
) {
  try {
    await ensureServerInitialized();

    const params = await context.params;
    const payload = verifyReportAccessToken(params.accessToken);
    const { filename, buffer } = await generateOrganisationReportPdf(payload.organisationId);
    const pdfBytes = new Uint8Array(buffer);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow"
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
