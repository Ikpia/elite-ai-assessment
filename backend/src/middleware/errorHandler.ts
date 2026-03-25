import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

import { HttpError } from "../utils/httpError.js";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      error: error.message,
      details: error.details ?? null
    });
    return;
  }

  if (error instanceof mongoose.Error) {
    res.status(400).json({
      error: "Database validation failed.",
      details: error.message
    });
    return;
  }

  const fallbackMessage =
    error instanceof Error ? error.message : "Unexpected server error.";

  res.status(500).json({
    error: fallbackMessage
  });
}
