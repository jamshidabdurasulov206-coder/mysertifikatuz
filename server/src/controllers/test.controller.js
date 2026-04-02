const testService = require("../services/test.service");
const questionService = require("../services/question.service");
const attemptService = require("../services/attempt.service");

/**
 * YANGI TEST YARATISH (Savollari bilan birga)
 */
exports.createTest = async (req, res) => {
  try {
    const { title, description, subject_id, questions, price } = req.body;

    if (!title || !subject_id) {
      return res.status(400).json({ message: "Sarlavha va fan tanlanishi shart!" });
    }

    // 1. Avval TESTni yaratamiz
    const newTest = await testService.createTest({ title, description, subject_id, price });

    // 2. Agar savollar yuborilgan bo'lsa, ularni yangi test_id bilan saqlaymiz
    if (questions && Array.isArray(questions) && questions.length > 0) {
      for (const q of questions) {
        // Normalize type
        let type = (q.type || '').toLowerCase();
        if (["multiple_choice", "choice", "multiple"].includes(type)) type = "multiple";
        else if (["open_ended", "open", "writing"].includes(type)) type = "open";

        await questionService.createQuestion({
          test_id: newTest.id,
          question_text: q.question_text,
          type,
          options: type === 'multiple' ? (typeof q.options === 'string' ? q.options : JSON.stringify(q.options)) : "[]",
          correct_option: type === 'multiple' ? Number(q.correct_option) : null,
          correct_answer_text: type === 'open' ? (q.correct_answer_text || "") : null,
          difficulty_level: parseFloat(q.difficulty_level) || 1.0,
          image_url: q.image_url || ''
        });
      }
    }

    res.status(201).json({ 
      success: true,
      message: "Test va savollar muvaffaqiyatli saqlandi", 
      test: newTest 
    });
    
  } catch (err) {
    console.error("Test yaratishda xato:", err);
    res.status(400).json({ message: "Saqlashda xatolik: " + err.message });
  }
};

/**
 * BARCHA TESTLARNI OLISH
 */
exports.getTests = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const tests = await testService.getTests(page, limit);
    res.json(tests);
  } catch (err) {
    console.error("Testlarni yuklashda xato:", err);
    res.status(500).json({ message: "Ma'lumotlarni yuklab bo'lmadi" });
  }
};

/**
 * TESTNI O'CHIRISH
 */
exports.deleteTest = async (req, res) => {
  try {
    const { id } = req.params;

    // Muhim: Service qatlamida avval savollarni o'chirish mantiqi bo'lishi kerak
    // Agar Service faqat bitta jadval bilan ishlasa, bu yerda ketma-ketlikni ta'minlaymiz:
    
    // 1. Avval shu testga bog'langan savollarni o'chiramiz
    // Bu Foreign Key xatosi (test o'chirilmayotgani)ni oldini oladi
    if (questionService.deleteQuestionsByTestId) {
        await questionService.deleteQuestionsByTestId(id);
    }

    // 2. Testni o'chiramiz
    const deletedTest = await testService.deleteTest(id);

    if (!deletedTest) {
      return res.status(404).json({ message: "O'chiriladigan test topilmadi" });
    }

    res.json({ 
        success: true, 
        message: "Test va unga tegishli savollar muvaffaqiyatli o'chirildi" 
    });

  } catch (err) {
    console.error("O'chirishda xatolik yuz berdi:", err.message);
    res.status(400).json({ 
        message: "Testni o'chirib bo'lmadi. Bog'langan ma'lumotlar mavjud bo'lishi mumkin.",
        error: err.message 
    });
  }
};

/**
 * BITTA TESTNI ID BO'YICHA OLISH (Agar kerak bo'lsa)
 */
exports.getTestById = async (req, res) => {
  try {
    const test = await testService.getTestById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test topilmadi" });
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.startSession = async (req, res) => {
  try {
    const testId = req.params.id;
    const userId = req.user.id;
    const pool = require("../config/db");

    // Bir foydalanuvchi bir testni faqat bir marta ishlashi kerak
    const existingAttempt = await attemptService.findAttemptByUserAndTest(userId, testId);
    if (existingAttempt) {
      return res.status(409).json({ message: "Siz avval bu testga qatnashgansiz." });
    }
    
    const activeSession = await pool.query(
        "SELECT * FROM test_sessions WHERE user_id = $1 AND test_id = $2 AND is_completed = false AND expires_at > NOW() ORDER BY id DESC LIMIT 1",
        [userId, testId]
    );
    
    if (activeSession.rows.length > 0) {
        return res.json({ message: "Faol sessiya mavjud", session: activeSession.rows[0] });
    }
    
    const expiresAt = new Date(Date.now() + 120 * 60000); 
    
    const newSession = await pool.query(
        "INSERT INTO test_sessions (user_id, test_id, expires_at) VALUES ($1, $2, $3) RETURNING *",
        [userId, testId, expiresAt]
    );
    
    res.status(201).json({ message: "Sessiya yaratildi", session: newSession.rows[0] });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
  }
};