const attemptModel = require("../models/attempt.model");
const { calculateAllRaschStats } = require('../utils/rasch');

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

    const questions = await attemptModel.getQuestionsByTestId(attempt.test_id);

    let totalCredit = 0;
    let openCount = 0;
    for (const q of questions) {
      if (q.type === 'writing' || q.type === 'open' || q.type === 'OPEN_ENDED') {
        openCount += 1;
        const val = written_scores[q.id];
        const num = Number(val);
        if (isFinite(num)) {
          if (num >= 1) totalCredit += 1;
          else if (num >= 0.5) totalCredit += 0.5;
        }
      }
    }
    const wrong = Math.max(0, openCount - totalCredit);
    const theta = Math.log((totalCredit + 0.5) / (wrong + 0.5));

    let finalScore = attempt.final_score;
    if (typeof finalScore !== 'number' || isNaN(finalScore)) finalScore = 0;
    
    // We pass null for pool in calculateAllRaschStats because it uses attemptModel instead inside the util if we updated it, but the util uses a passed pool. Wait, rasch.js might need the pool. Let's pass pool.
    const pool = require("../config/db");
    const stats = await calculateAllRaschStats(pool, theta, finalScore, attempt.subject_name);

    const updatedAttempt = await attemptModel.updateAttemptReviewWithStats(attemptId, written_scores, theta, stats);

    res.json({
      message: "Baholash saqlandi", attempt: updatedAttempt,
      theta, ...stats
    });
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
