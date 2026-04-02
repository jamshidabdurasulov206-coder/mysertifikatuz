const attemptModel = require("../models/attempt.model");
const { calculateAllRaschStats } = require('../utils/rasch');
const { evaluateAnswer } = require("../utils/evaluator");
const pool = require("../config/db");

const OPEN_TYPES = new Set(["writing", "open", "open_ended", "open-ended", "open ended", "openended", "openEnded", "OPEN_ENDED"]);

function parseJSON(value) {
  if (value === null || value === undefined) return {};
  if (typeof value === 'object') return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    try { return JSON.parse(value); } catch (e) { return {}; }
  }
  return {};
}

function normalizeBinary(value) {
  const num = Number(value);
  if (!isFinite(num)) return null;
  return num >= 0.5 ? 1 : 0;
}

exports.getThetaStats = async (req, res) => {
  try {
    const records = await attemptModel.getThetaScores();
    const thetas = records.map(r => Number(r.final_theta_score)).filter(x => !isNaN(x));
    if (thetas.length === 0) return res.json({ mu: 0, sigma: 1 });
    const mu = thetas.reduce((a, b) => a + b, 0) / thetas.length;
    const sigma = Math.sqrt(thetas.reduce((a, b) => a + Math.pow(b - mu, 2), 0) / thetas.length);
    res.json({ mu, sigma });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getUnreviewedAttempts = async (req, res) => {
  try {
    const attempts = await attemptModel.getUnreviewedAttempts();

    const attemptsWithQuestions = attempts.map(attempt => {
      let answersObj = {};
      try {
        if (typeof attempt.answers === 'object' && attempt.answers !== null) answersObj = attempt.answers;
        else if (typeof attempt.answers === 'string' && attempt.answers.trim().length > 0) answersObj = JSON.parse(attempt.answers);
      } catch (e) { answersObj = {}; }

      let writtenScoresObj = {};
      try {
        if (typeof attempt.written_scores === 'string') writtenScoresObj = JSON.parse(attempt.written_scores);
        else if (typeof attempt.written_scores === 'object' && attempt.written_scores !== null) writtenScoresObj = attempt.written_scores;
      } catch (e) { writtenScoresObj = {}; }

      return { ...attempt, answers: answersObj, written_scores: writtenScoresObj };
    });

    res.json(attemptsWithQuestions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Serverda xatolik yuz berdi" });
  }
};

exports.getPendingAttempts = async (req, res) => {
  try {
    const attempts = await attemptModel.getUnreviewedAttempts();
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getPreRaschReviewAttempts = async (req, res) => {
  try {
    const attemptsRes = await pool.query(
      `SELECT a.*, u.username as user_name, u.email as user_email, t.title as test_name
       FROM attempts a
       JOIN users u ON a.user_id = u.id
       JOIN tests t ON a.test_id = t.id
       WHERE a.is_published = false AND a.status IN ('ready_for_rasch', 'reviewed')
       ORDER BY a.created_at DESC`
    );

    const attempts = attemptsRes.rows;
    if (attempts.length === 0) return res.json([]);

    const testIds = [...new Set(attempts.map(a => a.test_id))];
    const questionsByTest = new Map();

    for (const testId of testIds) {
      const qRes = await pool.query(
        `SELECT id, question_text, type, options, correct_option, correct_answer_text
         FROM questions
         WHERE test_id = $1
         ORDER BY id`,
        [testId]
      );
      questionsByTest.set(testId, qRes.rows);
    }

    const mapped = attempts.map((attempt) => {
      const answersObj = parseJSON(attempt.answers);
      const writtenScoresObj = parseJSON(attempt.written_scores);
      const questions = questionsByTest.get(attempt.test_id) || [];

      const questionsWithScores = questions.map((q) => {
        const isOpen = OPEN_TYPES.has((q.type || '').toLowerCase()) || q.type === 'OPEN_ENDED';
        const userAnswer = answersObj[q.id] ?? "";

        let autoScore = 0;
        let aiCheckType = "key";
        let aiCheckDetail = "";
        if (isOpen) {
          aiCheckType = "ai";
          const aiRaw = evaluateAnswer(String(userAnswer || ""), String(q.correct_answer_text || ""));
          autoScore = aiRaw >= 0.5 ? 1 : 0;
          aiCheckDetail = `AI mazmuniy tekshiruv (raw=${Number(aiRaw).toFixed(2)})`; 
        } else {
          const hasAnswer = userAnswer !== undefined && userAnswer !== null && String(userAnswer).length > 0;
          if (hasAnswer && q.correct_option !== null && q.correct_option !== undefined) {
            autoScore = String(userAnswer).trim() === String(q.correct_option).trim() ? 1 : 0;
          }
          aiCheckDetail = "Kalit bo'yicha avtomatik tekshiruv";
        }

        const currentScore = normalizeBinary(writtenScoresObj[q.id]);
        const finalScore = currentScore === null ? autoScore : currentScore;
        const isOverridden = finalScore !== autoScore;

        let parsedOptions = [];
        try {
          parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : (Array.isArray(q.options) ? q.options : []);
        } catch (e) {
          parsedOptions = [];
        }

        return {
          id: q.id,
          question_text: q.question_text,
          type: q.type,
          options: parsedOptions,
          correct_option: q.correct_option,
          correct_answer_text: q.correct_answer_text,
          user_answer: userAnswer,
          ai_check_type: aiCheckType,
          ai_check_detail: aiCheckDetail,
          auto_score: autoScore,
          current_score: finalScore,
          is_overridden: isOverridden
        };
      });

      return {
        id: attempt.id,
        user_id: attempt.user_id,
        user_name: attempt.user_name,
        user_email: attempt.user_email,
        test_id: attempt.test_id,
        test_name: attempt.test_name,
        subject_name: attempt.subject_name,
        status: attempt.status,
        created_at: attempt.created_at,
        questions: questionsWithScores
      };
    });

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.reviewAttemptById = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const { written_scores } = req.body;
    const attempt = await attemptModel.updateAttemptReview(attemptId, written_scores);
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    res.json({ message: "Review saved", attempt });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.saveReview = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const { written_scores } = req.body;
    const attempt = await attemptModel.getAttemptById(attemptId);
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    const mergedScores = {
      ...parseJSON(attempt.written_scores),
      ...parseJSON(written_scores)
    };

    Object.keys(mergedScores).forEach((key) => {
      const normalized = normalizeBinary(mergedScores[key]);
      if (normalized === null) {
        delete mergedScores[key];
      } else {
        mergedScores[key] = normalized;
      }
    });

    const updated = await pool.query(
      `UPDATE attempts
       SET written_scores = $1,
           is_reviewed = true,
           is_published = false,
           status = 'reviewed',
           final_theta_score = NULL,
           z_score = NULL,
           t_score = NULL,
           standard_ball = NULL,
           level = 'PENDING'
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(mergedScores), attemptId]
    );

    res.json({ message: "Foydalanuvchi tasdiqlandi", attempt: updated.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.reviewAttempt = async (req, res) => {
  try {
    const { attemptId, writtenScores } = req.body;
    const attempt = await attemptModel.getAttemptById(attemptId);
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    let totalScore = attempt.score || 0;
    let writtenTotal = 0;
    for (const qid in writtenScores) {
      writtenTotal += Number(writtenScores[qid]);
    }
    totalScore += writtenTotal;

    let theta = attempt.final_theta_score;
    if (typeof theta !== 'number' || isNaN(theta)) theta = 0;
    const pool = require("../config/db");
    const stats = await calculateAllRaschStats(pool, theta, totalScore, attempt.subject_name);

    await attemptModel.updateAttemptPublish(attemptId, writtenScores, totalScore, stats);

    res.json({
      message: "Natija e'lon qilindi", attemptId, totalScore, ...stats
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
