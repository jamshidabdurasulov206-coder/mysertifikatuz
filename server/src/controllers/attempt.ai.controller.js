const { evaluateAttemptByAI } = require("../services/attemptEvaluation.service");

exports.autoEvaluateAttempt = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const result = await evaluateAttemptByAI(attemptId);

    if (res.json) {
      res.json({
        message: "Avtomatik tekshiruv yakunlandi",
        attemptId,
        totalRawScore: result.totalRawScore,
        status: 'ready_for_rasch'
      });
    }
  } catch (err) {
    console.error("[AI] autoEvaluateAttempt error", err);
    if (res.status) res.status(500).json({ message: 'Server error', error: err.message });
  }
};
