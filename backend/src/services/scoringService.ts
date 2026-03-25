import {
  MULTI_SELECT_QUESTION_ID,
  MULTI_SELECT_TOOL_OPTIONS,
  QUESTION_DIMENSIONS,
  READINESS_BANDS,
  SINGLE_CHOICE_OPTIONS,
  SINGLE_CHOICE_SCORES,
  TOTAL_QUESTIONS,
  ZERO_DIMENSION_SCORES
} from "../constants/assessment.js";
import type {
  AssessmentAnswerInput,
  DimensionScores,
  MultiSelectToolOption,
  ReadinessBand,
  ReadinessLevel,
  ScoredAssessment,
  SingleChoiceOption
} from "../types/assessment.js";
import { HttpError } from "../utils/httpError.js";

function createEmptyDimensionScores(): DimensionScores {
  return {
    ...ZERO_DIMENSION_SCORES
  };
}

function getReadinessBand(score: number): ReadinessBand {
  const band = READINESS_BANDS.find(
    (candidate) => score >= candidate.min && score <= candidate.max
  );

  if (!band) {
    throw new HttpError(500, "Unable to determine readiness band.");
  }

  return band;
}

function assertCompleteAnswerSet(answers: AssessmentAnswerInput[]): Map<number, AssessmentAnswerInput["value"]> {
  if (!Array.isArray(answers) || answers.length !== TOTAL_QUESTIONS) {
    throw new HttpError(
      400,
      `Exactly ${TOTAL_QUESTIONS} answers are required for submission.`
    );
  }

  const answerMap = new Map<number, AssessmentAnswerInput["value"]>();

  for (const answer of answers) {
    if (!Number.isInteger(answer.questionId)) {
      throw new HttpError(400, "Each answer must include a numeric questionId.");
    }

    if (!QUESTION_DIMENSIONS[answer.questionId]) {
      throw new HttpError(400, `Question ${answer.questionId} is not recognised.`);
    }

    if (answerMap.has(answer.questionId)) {
      throw new HttpError(400, `Question ${answer.questionId} was submitted more than once.`);
    }

    answerMap.set(answer.questionId, answer.value);
  }

  for (let questionId = 1; questionId <= TOTAL_QUESTIONS; questionId += 1) {
    if (!answerMap.has(questionId)) {
      throw new HttpError(400, `Question ${questionId} is missing from the submission.`);
    }
  }

  return answerMap;
}

function scoreSingleChoiceAnswer(
  rawValue: AssessmentAnswerInput["value"],
  questionId: number
): { score: number; selectedOption: SingleChoiceOption } {
  if (
    typeof rawValue !== "string" ||
    !SINGLE_CHOICE_OPTIONS.includes(rawValue as SingleChoiceOption)
  ) {
    throw new HttpError(
      400,
      `Question ${questionId} must use one of ${SINGLE_CHOICE_OPTIONS.join(", ")}.`
    );
  }

  const selectedOption = rawValue as SingleChoiceOption;

  return {
    score: SINGLE_CHOICE_SCORES[selectedOption],
    selectedOption
  };
}

function scoreMultiSelectAnswer(
  rawValue: AssessmentAnswerInput["value"],
  questionId: number
): { score: number; selectedOptions: MultiSelectToolOption[] } {
  if (!Array.isArray(rawValue) || rawValue.length === 0) {
    throw new HttpError(400, `Question ${questionId} requires at least one selected option.`);
  }

  const uniqueSelections = [...new Set(rawValue)];

  for (const selection of uniqueSelections) {
    if (!MULTI_SELECT_TOOL_OPTIONS.includes(selection as MultiSelectToolOption)) {
      throw new HttpError(400, `Question ${questionId} contains an invalid multi-select option.`);
    }
  }

  const typedSelections = uniqueSelections as MultiSelectToolOption[];
  const includesNone = typedSelections.includes("none-of-the-above");

  if (includesNone && typedSelections.length > 1) {
    throw new HttpError(
      400,
      'Question 4 cannot combine "none-of-the-above" with other selections.'
    );
  }

  const effectiveSelectionCount = includesNone ? 0 : typedSelections.length;

  let score = 0;

  if (effectiveSelectionCount >= 1 && effectiveSelectionCount <= 2) {
    score = 1;
  } else if (effectiveSelectionCount >= 3 && effectiveSelectionCount <= 4) {
    score = 2;
  } else if (effectiveSelectionCount >= 5) {
    score = 4;
  }

  return {
    score,
    selectedOptions: typedSelections
  };
}

export function getReadinessLevel(score: number): ReadinessLevel {
  return getReadinessBand(score).label;
}

export function getReadinessDescription(score: number): string {
  return getReadinessBand(score).description;
}

export function scoreAssessment(
  answers: AssessmentAnswerInput[]
): ScoredAssessment {
  const answerMap = assertCompleteAnswerSet(answers);
  const dimensionScores = createEmptyDimensionScores();
  const scoredAnswers: ScoredAssessment["answers"] = [];

  for (let questionId = 1; questionId <= TOTAL_QUESTIONS; questionId += 1) {
    const rawValue = answerMap.get(questionId);

    if (rawValue === undefined) {
      throw new HttpError(400, `Question ${questionId} is missing from the submission.`);
    }

    const dimension = QUESTION_DIMENSIONS[questionId];

    if (questionId === MULTI_SELECT_QUESTION_ID) {
      const { score, selectedOptions } = scoreMultiSelectAnswer(rawValue, questionId);

      dimensionScores[dimension] += score;
      scoredAnswers.push({
        questionId,
        score,
        selectedOptions
      });
      continue;
    }

    const { score, selectedOption } = scoreSingleChoiceAnswer(rawValue, questionId);
    dimensionScores[dimension] += score;
    scoredAnswers.push({
      questionId,
      score,
      selectedOption
    });
  }

  const totalScore =
    dimensionScores.aiLiteracy +
    dimensionScores.dataReadiness +
    dimensionScores.aiStrategy +
    dimensionScores.workflowAdoption +
    dimensionScores.ethicsCompliance;

  return {
    answers: scoredAnswers,
    dimensionScores,
    totalScore,
    readinessLevel: getReadinessLevel(totalScore)
  };
}
