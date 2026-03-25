import type { Request, Response, NextFunction } from "express";

import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authorizationHeader = req.get("authorization");
  const bearerSecret = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length).trim()
    : null;
  const headerSecret = req.get("x-admin-secret")?.trim() || null;
  const providedSecret = bearerSecret || headerSecret;

  if (!providedSecret || providedSecret !== env.adminSecret) {
    throw new HttpError(401, "Admin authentication failed.");
  }

  next();
}
