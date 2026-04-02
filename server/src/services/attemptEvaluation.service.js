const attemptModel = require("../models/attempt.model");
const { checkAllAnswers } = require("./evaluationService");
const { evaluateAnswer } = require("../utils/evaluator");
const pool = require("../config/db");

// Normalize and parse stored JSON safely
function parseJSON(value) {
  if (value === null || value === undefined) return {};
  if (typeof value === "object") return value;
  if (typeof value === "string" && value.trim().length > 0) {
    try { return JSON.parse(value); } catch (e) { return {}; }
  }
  return {};
}

const OPEN_TYPES = new Set(["writing", "open", "open_ended", "open-ended", "open ended", "openended", "openended", "openEnded", "OPEN_ENDED"]);

// Evaluate a single attempt: score open answers via AI/fallback, multiple choice locally, update DB.
async function evaluateAttemptByAI(attemptId) {
  const attempt = await attemptModel.getAttemptById(attemptId);
  if (!attempt) throw new Error("Attempt not found");

  const answersObj = parseJSON(attempt.answers);
  const writtenScoresObj = parseJSON(attempt.written_scores);

  const questions = await attemptModel.getQuestionsByTestId(attempt.test_id);

  const openQuestions = questions.filter(q => OPEN_TYPES.has((q.type || "").toLowerCase()) || q.type === "OPEN_ENDED");
  const openPayload = openQuestions.map(q => ({
    id: q.id,
    userAnswer: answersObj[q.id] || "",
    correctText: q.correct_answer_text || ""
  }));

  let aiScores = {};
  if (openPayload.length > 0) {
    try {
      aiScores = await checkAllAnswers(openPayload) || {};
    } catch (e) {
      aiScores = {};
    }
  }

  let written_scores = { ...writtenScoresObj };
  let openTotalRaw = 0;
  let openTotalBinary = 0;
  let closedTotal = 0;

  for (const q of questions) {
    const userAnswer = answersObj[q.id];
    const isOpen = OPEN_TYPES.has((q.type || "").toLowerCase()) || q.type === "OPEN_ENDED";

    if (isOpen) {
      const aiScore = typeof aiScores[q.id] === "number" ? aiScores[q.id] : null;
      const fallbackScore = evaluateAnswer(userAnswer || "", q.correct_answer_text || "");
      const rawScore = aiScore !== null ? aiScore : fallbackScore;
      const binaryScore = rawScore >= 0.5 ? 1 : 0; // Rasch dichotomous oqimi uchun 0/1
      written_scores[q.id] = binaryScore;
      openTotalRaw += binaryScore;
      openTotalBinary += binaryScore;
    } else {
      const hasAnswer = userAnswer !== undefined && userAnswer !== null && String(userAnswer).length > 0;
      let correct = false;
      if (hasAnswer && q.correct_option !== null && q.correct_option !== undefined) {
        correct = String(userAnswer).trim() === String(q.correct_option).trim();
      }
      closedTotal += correct ? 1 : 0;
    }
  }

  const totalRawScore = openTotalRaw + closedTotal;
  const totalBinaryScore = openTotalBinary + closedTotal;

  await pool.query(
    `UPDATE attempts SET written_scores = $1, score = $2, raw_score = $3, final_score = NULL,
     is_reviewed = true, is_published = false, status = 'ready_for_rasch',
     final_theta_score = NULL, z_score = NULL, t_score = NULL,
     standard_ball = NULL, level = 'PENDING'
     WHERE id = $4`,
    [JSON.stringify(written_scores), totalBinaryScore, totalRawScore, attemptId]
  );

  return { attemptId, totalRawScore, totalBinaryScore, openTotalRaw, openTotalBinary, closedTotal, written_scores };
}

module.exports = { evaluateAttemptByAI };