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
    requireAdmin(request.headers);

    const params = await context.params;
    const orgId = assertValidObjectId(params.orgId, "organisation id");
    const { filename, buffer } = await generateOrganisationReportPdf(orgId);

    await markOrganisationApproved(orgId);

    return new Response(buffer, {
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
