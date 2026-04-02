/**
 * Exam Controller
 * T-14: exam_results jadvaliga yozish o'rniga attempts jadvalidan foydalanish
 * T-13: Question type nomlari standartlashtirildi (multiple/open)
 */

const pool = require("../config/db");
const { calculateAllRaschStats } = require("../utils/rasch");

// Standart question type aniqlash
function normalizeQuestionType(type) {
  const t = (type || '').toLowerCase();
  if (['multiple_choice', 'choice', 'multiple'].includes(t)) return 'multiple';
  if (['open_ended', 'open', 'writing'].includes(t)) return 'open';
  return t;
}

// Levenshtein distance algoritmi (fuzzy match)
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
      else matrix[i][j] = Math.min(
        matrix[i - 1][j - 1] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j] + 1
      );
    }
  }
  return matrix[b.length][a.length];
}

exports.submitExam = async (req, res) => {
  try {
    const { userAnswers, userId, subjectId, testId, subjectName } = req.body;
    let testRaw = 0, testTotal = 0, writtenRaw = 0, writtenTotal = 0, pendingCount = 0;
    let details = [];
    let answersMap = {};

    for (const item of userAnswers) {
      const questionRes = await pool.query("SELECT * FROM questions WHERE id = $1", [item.question_id]);
      const question = questionRes.rows[0];
      if (!question) continue;

      const qType = normalizeQuestionType(question.type);
      let isCorrect = false;
      let isPending = false;

      answersMap[question.id] = item.answer;

      if (qType === 'multiple') {
        isCorrect = parseInt(item.answer) === question.correct_option;
        testTotal += parseFloat(question.difficulty_level || 1);
        if (isCorrect) testRaw += parseFloat(question.difficulty_level || 1);
      } else if (qType === 'open') {
        writtenTotal += parseFloat(question.difficulty_level || 1);
        if (item.checked === false || item.checked === undefined) {
          isPending = true;
          pendingCount++;
        } else if (typeof item.score === 'number') {
          writtenRaw += item.score;
        }
      }

      details.push({
        question_id: question.id,
        isCorrect,
        isPending,
        user_answer: item.answer,
        correct_answer: qType === 'multiple' ? question.correct_option : question.correct_answer_text
      });
    }

    const totalRaw = testRaw + writtenRaw;

    // Attempts jadvaliga yozish — AI navbatida tekshiriladi
    const savedResult = await pool.query(
      `INSERT INTO attempts (user_id, test_id, subject_name, answers, score, final_score,
       final_theta_score, is_reviewed, is_published, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [userId, testId, subjectName || '', JSON.stringify(answersMap), testRaw, null, null, false, false, 'waiting_ai']
    );

    // AI baholashni navbatga qo'shamiz (fallBack: sinxron qo'llash attemptQueue ichida)
    try {
      const { enqueueAttemptEvaluation } = require("../queue/attemptQueue");
      await enqueueAttemptEvaluation(savedResult.rows[0].id);
    } catch (e) {
      console.error("Attempt navbatga qo'shishda xato", e.message);
    }

    res.json({
      success: true,
      pendingCount,
      details,
      attemptId: savedResult.rows[0].id
    });

  } catch (error) {
    console.error("Exam xato:", error.message);
    res.status(500).json({ error: "Natijani hisoblashda xatolik" });
  }
};