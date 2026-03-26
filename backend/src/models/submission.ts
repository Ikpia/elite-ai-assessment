import { model, Schema, type Document } from "mongoose";

import {
  FIRM_TYPES,
  ROLE_LEVELS,
  SINGLE_CHOICE_OPTIONS
} from "../constants/assessment.js";
import type {
  DimensionScores,
  FirmType,
  RoleLevel,
  ScoredAnswerRecord
} from "../types/assessment.js";

export interface SubmissionDocument extends Document {
  orgDomain: string;
  firmType: FirmType;
  orgName: string;
  respondentEmailDomain: string;
  respondentEmail: string;
  respondentName: string;
  respondentRole: RoleLevel;
  respondentDept: string;
  consentAcceptedAt: Date;
  answers: ScoredAnswerRecord[];
  dimensionScores: DimensionScores;
  totalScore: number;
  submittedAt: Date;
}

const scoredAnswerSchema = new Schema<ScoredAnswerRecord>(
  {
    questionId: { type: Number, required: true },
    score: { type: Number, required: true },
    selectedOption: {
      type: String,
      enum: SINGLE_CHOICE_OPTIONS,
      required: false
    },
    selectedOptions: {
      type: [String],
      required: false,
      default: undefined
    }
  },
  {
    _id: false
  }
);

const dimensionScoresSchema = new Schema<DimensionScores>(
  {
    aiLiteracy: { type: Number, required: true },
    dataReadiness: { type: Number, required: true },
    aiStrategy: { type: Number, required: true },
    workflowAdoption: { type: Number, required: true },
    ethicsCompliance: { type: Number, required: true }
  },
  {
    _id: false
  }
);

const submissionSchema = new Schema<SubmissionDocument>(
  {
    orgDomain: { type: String, required: true, index: true, lowercase: true },
    firmType: {
      type: String,
      enum: FIRM_TYPES,
      required: true
    },
    orgName: { type: String, required: true, trim: true },
    respondentEmailDomain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    respondentEmail: { type: String, required: true, trim: true, lowercase: true },
    respondentName: { type: String, required: true, trim: true },
    respondentRole: {
      type: String,
      enum: ROLE_LEVELS,
      required: true
    },
    respondentDept: { type: String, required: true, trim: true },
    consentAcceptedAt: { type: Date, required: true },
    answers: { type: [scoredAnswerSchema], required: true },
    dimensionScores: { type: dimensionScoresSchema, required: true },
    totalScore: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now, required: true, index: true }
  },
  {
    versionKey: false
  }
);

submissionSchema.index({ orgDomain: 1, submittedAt: -1 });

export const SubmissionModel = model<SubmissionDocument>(
  "Submission",
  submissionSchema
);
