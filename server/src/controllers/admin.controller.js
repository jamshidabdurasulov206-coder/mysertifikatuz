const attemptService = require("../services/attempt.service");
const pool = require("../config/db");

// Publish all attempts for a testId (set status to 'published')
exports.publishTestResults = async (req, res) => {
  try {
    const testId = req.params.testId;
    await attemptService.publishAttemptsByTest(testId);
    res.json({ success: true, message: "Natijalar e'lon qilindi." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const jwt = require("jsonwebtoken");

// Hardcoded admin credentials (change for production!)
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin123";
const JWT_SECRET = process.env.JWT_SECRET || "admin_jwt_secret";

exports.login = (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ id: 0, email: ADMIN_EMAIL, role: 'admin' }, JWT_SECRET, { expiresIn: "1d" });
    return res.json({ token });
  }
  return res.status(401).json({ message: "Invalid admin credentials" });
};

// GET /api/admin/stats — real dashboard statistics
exports.getStats = async (req, res) => {
  try {
    const [usersRes, testsRes, attemptsRes, avgRes, publishedRes, todayRes, manualSumRes, paymeSumRes] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users"),
      pool.query("SELECT COUNT(*) FROM tests"),
      pool.query("SELECT COUNT(*) FROM attempts"),
      pool.query("SELECT ROUND(AVG(final_score)::numeric, 1) as avg_score FROM attempts WHERE final_score IS NOT NULL"),
      pool.query("SELECT COUNT(*) FROM attempts WHERE is_published = true"),
      pool.query("SELECT COUNT(*) FROM attempts WHERE DATE(created_at) = CURRENT_DATE"),
      pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM manual_payments WHERE status = 'approved'"),
      pool.query("SELECT COALESCE(SUM(t.price),0) AS total FROM orders o JOIN tests t ON t.id = o.test_id WHERE o.state = 2"),
    ]);

    res.json({
      totalUsers:    parseInt(usersRes.rows[0].count),
      totalTests:    parseInt(testsRes.rows[0].count),
      totalAttempts: parseInt(attemptsRes.rows[0].count),
      avgScore:      parseFloat(avgRes.rows[0].avg_score) || 0,
      publishedCount: parseInt(publishedRes.rows[0].count),
      todayAttempts: parseInt(todayRes.rows[0].count),
      totalRevenue:   (parseFloat(manualSumRes.rows[0].total) || 0) + (parseFloat(paymeSumRes.rows[0].total) || 0),
      totalManual:    parseFloat(manualSumRes.rows[0].total) || 0,
      totalOnline:    parseFloat(paymeSumRes.rows[0].total) || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/export/results — CSV export
exports.exportResults = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.id, u.username as full_name, u.email,
        a.subject_name, a.score, a.final_score,
        ROUND(a.final_theta_score::numeric, 3) as theta,
        a.z_score, a.t_score, a.standard_ball, a.level,
        a.is_reviewed, a.is_published,
        TO_CHAR(a.created_at, 'YYYY-MM-DD HH24:MI') as created_at
      FROM attempts a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
    `);

    const rows = result.rows;
    if (!rows.length) return res.status(404).json({ message: "Ma'lumot topilmadi" });

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map(row =>
        headers.map(h => {
          const val = row[h] === null || row[h] === undefined ? "" : String(row[h]);
          return `"${val.replace(/"/g, '""')}"`;
        }).join(",")
      )
    ].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="natijalar_${Date.now()}.csv"`);
    res.send("\uFEFF" + csv); // BOM for Excel UTF-8
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/leaderboard — top scores (public)
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const result = await pool.query(`
      SELECT 
        u.username as full_name,
        a.subject_name,
        a.final_score,
        a.standard_ball,
        a.level,
        a.t_score,
        TO_CHAR(a.created_at, 'YYYY-MM-DD') as date
      FROM attempts a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.is_published = true AND a.final_score IS NOT NULL
      ORDER BY a.t_score DESC NULLS LAST, a.final_score DESC
      LIMIT $1
    `, [limit]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/audit-logs — admin action logs
exports.getAuditLogs = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 30;
    const offset = (page - 1) * limit;

    // audit_logs table may not exist yet — handle gracefully
    const tableCheck = await pool.query(
      "SELECT to_regclass('public.audit_logs') as tbl"
    );
    if (!tableCheck.rows[0].tbl) {
      return res.json({ logs: [], total: 0, message: "Audit log jadvali hali yaratilmagan" });
    }

    const [logsRes, countRes] = await Promise.all([
      pool.query(
        "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2",
        [limit, offset]
      ),
      pool.query("SELECT COUNT(*) FROM audit_logs"),
    ]);
    res.json({ logs: logsRes.rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTestFull = async (req, res) => {
  try {
    const { testId } = req.params;
    const testRes = await pool.query("SELECT * FROM tests WHERE id = $1", [testId]);
    if (testRes.rows.length === 0) return res.status(404).json({ message: "Test topilmadi" });
    const test = testRes.rows[0];

    const questionsRes = await pool.query("SELECT * FROM questions WHERE test_id = $1 ORDER BY id ASC", [testId]);
    const questions = questionsRes.rows;

    res.json({ success: true, test, questions });
  } catch (err) {
    res.status(500).json({ message: "Server xatosi: " + err.message });
  }
};

exports.updateTestAndQuestions = async (req, res) => {
  const client = await pool.connect();
  try {
    const { testId } = req.params;
    const { title, description, subject_id, questions } = req.body;

    await client.query("BEGIN");

    await client.query(
      "UPDATE tests SET title = $1, description = $2, subject_id = $3 WHERE id = $4", 
      [title, description, subject_id, testId]
    );

    const existingQRes = await client.query("SELECT id FROM questions WHERE test_id = $1", [testId]);
    const existingIds = existingQRes.rows.map(row => row.id);
    const incomingIds = questions.filter(q => q.id).map(q => q.id);
    const toDeleteIds = existingIds.filter(id => !incomingIds.includes(id));

    if (toDeleteIds.length > 0) {
      await client.query("DELETE FROM questions WHERE id = ANY($1)", [toDeleteIds]);
    }

    for (const q of questions) {
      const type = q.type || 'multiple';
      const options = type === 'multiple' ? (Array.isArray(q.options) ? JSON.stringify(q.options) : q.options || "[]") : "[]";
      const qText = q.question_text || "Bo'sh savol";
      const dLevel = parseFloat(q.difficulty_level) || 1.0;
      const imgUrl = q.image_url || '';

      if (q.id) {
        await client.query(
          "UPDATE questions SET question_text=$1, type=$2, options=$3, correct_option=$4, correct_answer_text=$5, difficulty_level=$6, image_url=$7 WHERE id=$8",
          [qText, type, options, q.correct_option, q.correct_answer_text, dLevel, imgUrl, q.id]
        );
      } else {
        await client.query(
          "INSERT INTO questions (test_id, question_text, type, options, correct_option, correct_answer_text, difficulty_level, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          [testId, qText, type, options, q.correct_option, q.correct_answer_text, dLevel, imgUrl]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Test va savollar muvaffaqiyatli saqlandi!" });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === '23503') {
       return res.status(400).json({ message: "Ushbu savol tizimda xotiralangan javoblarga ega (o'quvchilar allaqachon ishlab yakunlagan). O'chirib bo'lmaydi!" });
    }
    res.status(500).json({ message: "Tahrirlashda xatolik: " + err.message });
  } finally {
    client.release();
  }
};

// GET /api/admin/analytics/:testId — detailed test analytics
exports.getTestAnalytics = async (req, res) => {
  try {
    const { testId } = req.params;

    // 1. Test info
    const testRes = await pool.query("SELECT id, title, subject_id FROM tests WHERE id = $1", [testId]);
    if (testRes.rows.length === 0) return res.status(404).json({ message: "Test topilmadi" });
    const test = testRes.rows[0];

    // 2. Subject name
    const subRes = await pool.query("SELECT name FROM subjects WHERE id = $1", [test.subject_id]);
    const subjectName = subRes.rows.length > 0 ? subRes.rows[0].name : "Noma'lum";

    // 3. Attempts summary
    const attemptsRes = await pool.query(`
      SELECT 
        COUNT(*) as total_attempts,
        ROUND(AVG(final_score)::numeric, 1) as avg_score,
        MIN(final_score) as min_score,
        MAX(final_score) as max_score,
        COUNT(CASE WHEN is_published THEN 1 END) as published_count,
        COUNT(CASE WHEN is_reviewed THEN 1 END) as reviewed_count
      FROM attempts WHERE test_id = $1 AND final_score IS NOT NULL
    `, [testId]);
    const summary = attemptsRes.rows[0];

    // 4. Level distribution
    const levelRes = await pool.query(`
      SELECT level, COUNT(*) as count
      FROM attempts WHERE test_id = $1 AND level IS NOT NULL
      GROUP BY level ORDER BY level
    `, [testId]);

    // 5. Score distribution (bucketed)
    const scoreDistRes = await pool.query(`
      SELECT
        CASE 
          WHEN final_score >= 90 THEN '90-100'
          WHEN final_score >= 80 THEN '80-89'
          WHEN final_score >= 70 THEN '70-79'
          WHEN final_score >= 60 THEN '60-69'
          WHEN final_score >= 50 THEN '50-59'
          ELSE '0-49'
        END as range,
        COUNT(*) as count
      FROM attempts WHERE test_id = $1 AND final_score IS NOT NULL
      GROUP BY range ORDER BY range DESC
    `, [testId]);

    // 6. Per-question analysis (accuracy)
    const questionsRes = await pool.query(
      "SELECT id, question_text, type, correct_option FROM questions WHERE test_id = $1 ORDER BY id",
      [testId]
    );
    const questions = questionsRes.rows;

    // get all attempts with answers
    const answersRes = await pool.query(
      "SELECT answers FROM attempts WHERE test_id = $1 AND answers IS NOT NULL",
      [testId]
    );

    // Calculate per-question accuracy
    const questionStats = questions.map(q => {
      let totalAnswered = 0;
      let correctCount = 0;

      for (const row of answersRes.rows) {
        let answers;
        try {
          answers = typeof row.answers === 'string' ? JSON.parse(row.answers) : row.answers;
        } catch { continue; }
        if (!answers) continue;

        // answers could be object {questionId: answer} or array
        const userAnswer = answers[q.id] || answers[String(q.id)];
        if (userAnswer !== undefined && userAnswer !== null) {
          totalAnswered++;
          if (q.type === 'multiple' && String(userAnswer) === String(q.correct_option)) {
            correctCount++;
          }
        }
      }

      return {
        id: q.id,
        text: (q.question_text || "").slice(0, 80),
        type: q.type,
        totalAnswered,
        correctCount,
        accuracy: totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0
      };
    });

    // 7. Recent attempts timeline
    const timelineRes = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM attempts WHERE test_id = $1
      GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 14
    `, [testId]);

    res.json({
      success: true,
      test: { id: test.id, title: test.title, subjectName },
      summary: {
        totalAttempts: parseInt(summary.total_attempts) || 0,
        avgScore: parseFloat(summary.avg_score) || 0,
        minScore: parseInt(summary.min_score) || 0,
        maxScore: parseInt(summary.max_score) || 0,
        publishedCount: parseInt(summary.published_count) || 0,
        reviewedCount: parseInt(summary.reviewed_count) || 0,
      },
      levelDistribution: levelRes.rows.map(r => ({ level: r.level, count: parseInt(r.count) })),
      scoreDistribution: scoreDistRes.rows.map(r => ({ range: r.range, count: parseInt(r.count) })),
      questionStats,
      timeline: timelineRes.rows.map(r => ({ date: r.date, count: parseInt(r.count) })),
    });
  } catch (err) {
    res.status(500).json({ message: "Tahlil xatosi: " + err.message });
  }
};

