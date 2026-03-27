import mongoose from "mongoose";

import { HttpError } from "./httpError";

export function assertValidObjectId(value: string, label = "id"): string {
  if (!mongoose.isValidObjectId(value)) {
    throw new HttpError(400, `Invalid ${label}.`);
  }

  return value;
}
