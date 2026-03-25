import { model, Schema, type Document } from "mongoose";

import { ZERO_AGGREGATE_SCORES } from "../constants/assessment.js";
import type {
  AggregateScores,
  OrganisationStatus
} from "../types/assessment.js";

export interface OrganisationDocument extends Document {
  domain: string;
  orgName: string;
  directorEmail: string | null;
  expectedRespondents: number | null;
  status: OrganisationStatus;
  aggregatedScores: AggregateScores;
  reportSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const aggregateScoresSchema = new Schema<AggregateScores>(
  {
    aiLiteracy: { type: Number, required: true },
    dataReadiness: { type: Number, required: true },
    aiStrategy: { type: Number, required: true },
    workflowAdoption: { type: Number, required: true },
    ethicsCompliance: { type: Number, required: true },
    total: { type: Number, required: true }
  },
  {
    _id: false
  }
);

const organisationSchema = new Schema<OrganisationDocument>(
  {
    domain: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true
    },
    orgName: { type: String, required: true, trim: true },
    directorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null
    },
    expectedRespondents: { type: Number, default: null },
    status: {
      type: String,
      required: true,
      enum: ["collecting", "ready", "approved", "sent"],
      default: "collecting"
    },
    aggregatedScores: {
      type: aggregateScoresSchema,
      required: true,
      default: () => ({ ...ZERO_AGGREGATE_SCORES })
    },
    reportSentAt: {
      type: Date,
      default: null
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
);

organisationSchema.index({ createdAt: -1 });

export const OrganisationModel = model<OrganisationDocument>(
  "Organisation",
  organisationSchema
);
