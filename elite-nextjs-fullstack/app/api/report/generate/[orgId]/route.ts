import { generateOrganisationReportPdf } from "@/lib/server/services/reportService";
import { markOrganisationApproved } from "@/lib/server/services/organisationService";
import { assertValidObjectId } from "@/lib/server/utils/objectId";
import {
  ensureServerInitialized,
  handleRouteError,
  requireAdmin
} from "@/lib/server/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  request: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    await ensureServerInitialized();

    const params = await context.params;
    const orgId = assertValidObjectId(params.orgId, "organisation id");
    await requireAdmin(request.headers, { organisationId: orgId });
    const { filename, buffer } = await generateOrganisationReportPdf(orgId);
    const pdfBytes = new Uint8Array(buffer);

    await markOrganisationApproved(orgId);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
