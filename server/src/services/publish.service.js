const pool = require("../config/db");
const { 
  calculateZScore, 
  calculateTScore, 
  calculateStandardBall, 
  calculateLevel,
  calculatePercentage
} = require("../utils/rasch");

function normalizeOpenCredit(val) {
  const num = Number(val);
  if (!isFinite(num)) return 0;
  return num >= 0.5 ? 1 : 0;
}

/**
 * Ma'lum bir test bo'yicha barcha tekshirilgan natijalarni guruh asosida Rasch hisoblash.
 * publish=true bo'lsa e'lon qiladi, publish=false bo'lsa faqat hisoblab qo'yadi (is_published=false, status='rasch_scored').
 */
exports.publishBatch = async (testId, { publish = true } = {}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Tayyor bo'lgan (AI ko'rgan) va e'lon qilinmagan urinishlarni olish
    const eligibleStatuses = publish ? ['rasch_scored'] : ['ready_for_rasch', 'reviewed'];
    const attemptsRes = await client.query(
      `SELECT * FROM attempts WHERE test_id = $1 AND status = ANY($2) AND is_published = false`,
      [testId, eligibleStatuses]
    );
    const attempts = attemptsRes.rows;

    if (attempts.length === 0) {
      await client.query('ROLLBACK');
      return { count: 0, mu: null, sigma: null, publish };
    }

    // 2. Savollarni olish va matritsa qurish
    const questionsRes = await client.query(
      "SELECT id, correct_option, type FROM questions WHERE test_id = $1 ORDER BY id",
      [testId]
    );
    const questions = questionsRes.rows;
    const questionCount = questions.length;
    if (questionCount === 0) throw new Error("Testda savollar mavjud emas.");

    // Helper: parse stored fields
    const parseJSON = (val) => {
      if (val === null || val === undefined) return {};
      if (typeof val === 'object') return val;
      if (typeof val === 'string' && val.trim().length > 0) {
        try { return JSON.parse(val); } catch (e) { return {}; }
      }
      return {};
    };

    const OPEN_TYPES = new Set(["writing", "open", "open_ended", "open-ended", "open ended", "openended", "openEnded", "OPEN_ENDED"]);

    // 3. Item qiyinliklari (b_i) ni hisoblash (open savollarda 0/1 credit bilan)
    const perQuestionCorrect = new Map();
    for (const q of questions) perQuestionCorrect.set(q.id, 0);

    for (const att of attempts) {
      const answersObj = parseJSON(att.answers);
      const writtenScores = parseJSON(att.written_scores);

      for (const q of questions) {
        const isOpen = OPEN_TYPES.has((q.type || '').toLowerCase()) || q.type === 'OPEN_ENDED';
        let credit = 0;
        if (isOpen) {
          const val = writtenScores[q.id];
          credit = normalizeOpenCredit(val);
        } else {
          const userAnswer = answersObj[q.id];
          if (userAnswer !== undefined && userAnswer !== null && q.correct_option !== null && q.correct_option !== undefined) {
            credit = String(userAnswer).trim() === String(q.correct_option).trim() ? 1 : 0;
          }
        }
        perQuestionCorrect.set(q.id, perQuestionCorrect.get(q.id) + credit);
      }
    }

    const questionDifficulties = new Map();
    for (const q of questions) {
      const correct = perQuestionCorrect.get(q.id) || 0;
      const p = (correct + 0.5) / (attempts.length + 1); // Laplace smoothing
      const b = -Math.log(p / (1 - p)); // yuqori b → qiyinroq
      questionDifficulties.set(q.id, b);
    }

    const avgB = [...questionDifficulties.values()].reduce((a, b) => a + b, 0) / questionDifficulties.size;

    // 4. Har bir o'quvchi uchun theta va yakuniy ko'rsatkichlar
    const thetaResults = [];
    for (const att of attempts) {
      const answersObj = parseJSON(att.answers);
      const writtenScores = parseJSON(att.written_scores);

      let weightedCorrectCount = 0;
      let binaryCorrectCount = 0;
      for (const q of questions) {
        const isOpen = OPEN_TYPES.has((q.type || '').toLowerCase()) || q.type === 'OPEN_ENDED';
        let credit = 0;
        if (isOpen) {
          const val = writtenScores[q.id];
          credit = normalizeOpenCredit(val);
        } else {
          const userAnswer = answersObj[q.id];
          if (userAnswer !== undefined && userAnswer !== null && q.correct_option !== null && q.correct_option !== undefined) {
            credit = String(userAnswer).trim() === String(q.correct_option).trim() ? 1 : 0;
          }
        }
        weightedCorrectCount += credit;
        if (credit >= 0.5) binaryCorrectCount += 1;
      }

      const r = weightedCorrectCount;
      const n = questionCount;
      const theta = Math.log((r + 0.5) / ((n - r) + 0.5)) + avgB; // oddiy Rasch yaqinlashuvi
      thetaResults.push({ id: att.id, theta, subject_name: att.subject_name, rawWeighted: r, rawBinary: binaryCorrectCount });
    }

    const thetas = thetaResults.map(r => r.theta);
    const mu = thetas.reduce((a, b) => a + b, 0) / thetas.length;
    const sigmaBase = Math.sqrt(thetas.reduce((a, b) => a + Math.pow(b - mu, 2), 0) / thetas.length) || 0;
    const sigma = sigmaBase === 0 ? 1 : sigmaBase; // sigma 0 bo'lsa formulani barqaror ishlatish uchun 1 qo'llanadi

    // 5. Har bir urinishni yangilash

    for (const res of thetaResults) {
      const nextStatus = publish ? 'published' : 'rasch_scored';
      const nextPublished = publish ? true : false;

      let final_theta_score = res.theta;
      let z_score;
      let t_score;
      let standard_ball;
      let level;

      z_score = calculateZScore(res.theta, mu, sigma);
      t_score = calculateTScore(z_score);
      standard_ball = calculateStandardBall(t_score, res.subject_name);
      level = calculateLevel(t_score);

      // Foiz ko'rsatkichi (T>=65 bo'lsa 100%, aks holda standard_ball/maxBall)
      const percentage = calculatePercentage(res.subject_name, standard_ball, t_score);

      await client.query(
        `UPDATE attempts SET 
          final_theta_score = $1,
          z_score = $2,
          t_score = $3,
          standard_ball = $4,
          level = $5,
          status = $6,
          is_published = $7,
          final_score = $8,
          score = $9,
          raw_score = $10
         WHERE id = $11`,
        [final_theta_score, z_score, t_score, standard_ball, level, nextStatus, nextPublished, standard_ball, res.rawBinary, res.rawBinary, res.id]
      );
    }

    await client.query('COMMIT');
    return { count: attempts.length, mu, sigma, publish };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
