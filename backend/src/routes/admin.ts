import { Router } from "express";

import { requireAdmin } from "../middleware/adminAuth.js";
import {
  listOrganisationDashboards,
  updateOrganisationAdminSettings
} from "../services/organisationService.js";
import { parseOrganisationUpdateBody } from "../services/payloadValidators.js";
import { validateCompanyEmail } from "../services/emailValidationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { assertValidObjectId } from "../utils/objectId.js";

const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get(
  "/organisations",
  asyncHandler(async (_req, res) => {
    const organisations = await listOrganisationDashboards();

    res.json({
      organisations
    });
  })
);

adminRouter.patch(
  "/organisations/:orgId",
  asyncHandler(async (req, res) => {
    const orgId = assertValidObjectId(req.params.orgId, "organisation id");
    const updates = parseOrganisationUpdateBody(req.body);

    if (updates.directorEmail) {
      const validation = validateCompanyEmail(updates.directorEmail);

      if (!validation.valid) {
        throw new HttpError(
          400,
          validation.reason || "directorEmail must be a valid email address."
        );
      }

      updates.directorEmail = validation.normalizedEmail || updates.directorEmail;
    }

    const organisation = await updateOrganisationAdminSettings(orgId, updates);

    res.json({
      message: "Organisation settings updated.",
      organisation
    });
  })
);

export { adminRouter };
