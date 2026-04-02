const attemptService = require("../services/attempt.service");
const manualPaymentService = require("../services/manualPayment.service");
const attemptAiController = require("./attempt.ai.controller");
const { calculatePercentage } = require("../utils/rasch");

const withPercentage = (attempt) => {
  if (!attempt) return attempt;
  const pct = calculatePercentage(attempt.subject_name, attempt.standard_ball, attempt.t_score);
  return { ...attempt, percentage: pct };
};

exports.createAttempt = async (req, res) => {
  try {
    const { user_id, test_id, subject_name, answers, score } = req.body;

    if (!user_id || !test_id || !subject_name || !answers || typeof score === 'undefined') {
      return res.status(400).json({ message: "Majburiy maydonlar to'liq emas" });
    }

    // Bir foydalanuvchi bir testni faqat bir marta topshirsin
    const exists = await attemptService.findAttemptByUserAndTest(user_id, test_id);
    if (exists) {
      return res.status(409).json({ message: "Bu test avval yakunlangan. Bir foydalanuvchi testni faqat bir marta ishlashi mumkin." });
    }

    // To'lov talab qilinganda (REQUIRE_MANUAL_PAYMENT=true) tasdiqlangan to'lovni tekshiramiz
    const requirePayment = process.env.REQUIRE_MANUAL_PAYMENT === "true";
    if (requirePayment) {
      const hasPaid = await manualPaymentService.hasApprovedPayment(user_id, test_id);
      if (!hasPaid) {
        return res.status(402).json({ message: "To'lov tasdiqlanmagan. Chekni yuboring va admin tasdiqlaganda testni boshlang." });
      }
    }

    const pool = require("../config/db");
    const sessionRes = await pool.query(
      "SELECT * FROM test_sessions WHERE user_id = $1 AND test_id = $2 AND is_completed = false ORDER BY id DESC LIMIT 1",
      [user_id, test_id]
    );
    
    if (sessionRes.rows.length > 0) {
        const session = sessionRes.rows[0];
        if (new Date() > new Date(session.expires_at)) {
            // Uncomment the strict return below to strictly enforce the timer. 
            // return res.status(403).json({ message: "Test vaqti tugagan." });
            console.warn(`Time expired for user ${user_id} on test ${test_id}`);
        }
        await pool.query("UPDATE test_sessions SET is_completed = true WHERE id = $1", [session.id]);
    }

    let attempt;
    try {
      attempt = await attemptService.createAttempt({
        user_id,
        test_id,
        subject_name,
        answers,
        score,
        status: 'waiting_ai'
      });
    } catch (e) {
      if (e.code === '23505') { // unique_violation
        return res.status(409).json({ message: "Bu test allaqachon yakunlangan." });
      }
      throw e;
    }

    // AI baholashni navbatga qo'shamiz (fallback: sinxron attemptQueue ichida)
    try {
      const { enqueueAttemptEvaluation } = require("../queue/attemptQueue");
      await enqueueAttemptEvaluation(attempt.id);
    } catch (e) {
      console.error("[Background Auto-evaluate] navbatga qo'shishda xato:", e.message);
    }

    res.status(201).json(attempt);
  } catch (err) {
    res.status(500).json({ message: "Server xatosi", error: err.message });
  }
};

exports.getAttemptsByTest = async (req, res) => {
  try {
    const testId = Number(req.params.testId);
    if (!Number.isInteger(testId) || testId <= 0) {
      return res.status(400).json({ message: "Noto'g'ri test ID" });
    }
    const attempts = await attemptService.getAttemptsByTest(testId);
    res.json(attempts.map(withPercentage));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAttempt = async (req, res) => {
  try {
    const success = await attemptService.deleteAttempt(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Natija topilmadi" });
    }
    res.json({ message: "Natija muvaffaqiyatli o'chirildi" });
  } catch (err) {
    res.status(500).json({ message: "Server xatosi", error: err.message });
  }
};

exports.getAttemptsByUser = async (req, res) => {
  try {
    const userId = req.user?.id || req.params.userId;
    const attempts = await attemptService.getAttemptsByUser(userId);
    res.json(attempts.map(withPercentage));
  } catch (err) {
    console.error('getAttemptsByUser error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllUserAttempts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await attemptService.getAllUserAttempts(page, limit);

    const attempts = result.data.map(attempt => {
      let ws = {};
      if (attempt.written_scores && typeof attempt.written_scores === "string" && attempt.written_scores.trim().length > 0) {
        try { ws = JSON.parse(attempt.written_scores); } catch (e) { ws = {}; }
      } else if (typeof attempt.written_scores === 'object' && attempt.written_scores !== null) {
        ws = attempt.written_scores;
      }
      return withPercentage({ ...attempt, written_scores: ws });
    });

    res.json({ ...result, data: attempts });
  } catch (err) {
    console.error("[getAllUserAttempts] 500 error:", err);
    res.status(500).json({ message: "Server xatosi", error: err.message });
  }
};

exports.getAttemptAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const attempt = await attemptService.getAttemptById(id);
    if (!attempt) return res.status(404).json({ message: "Urinish topilmadi" });

    // Owners and admins only
    if (!isAdmin && attempt.user_id !== userId) {
      return res.status(403).json({ message: "Sizda ushbu ma'lumotni ko'rish imkoniyati yo'q" });
    }

    const questions = await attemptService.getQuestionsByTestId(attempt.test_id);

    res.json({ success: true, attempt: withPercentage(attempt), questions });
  } catch (err) {
    res.status(500).json({ message: "Tahlilni olishda xatolik", error: err.message });
  }
};
