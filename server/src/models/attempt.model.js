const pool = require("../config/db");

exports.createAttempt = async (test_id, user_id, answers, score, subject_name, status = 'pending') => {
  const res = await pool.query(
    "INSERT INTO attempts (user_id, test_id, answers, score, subject_name, is_reviewed, is_published, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
    [user_id, test_id, JSON.stringify(answers), score, subject_name, false, false, status]
  );
  return res.rows[0];
};

// Bitta foydalanuvchi bir testni faqat bir marta topshirishi uchun tekshiruv
exports.findByUserAndTest = async (user_id, test_id) => {
  const res = await pool.query(
    "SELECT * FROM attempts WHERE user_id = $1 AND test_id = $2 ORDER BY created_at DESC LIMIT 1",
    [user_id, test_id]
  );
  return res.rows[0];
};

exports.getAttemptById = async (id) => {
  const res = await pool.query('SELECT * FROM attempts WHERE id = $1', [id]);
  return res.rows[0];
};

exports.deleteAttempt = async (id) => {
  const res = await pool.query("DELETE FROM attempts WHERE id = $1 RETURNING id", [id]);
  return res.rowCount;
};

exports.getAttemptsByTest = async (test_id) => {
  const res = await pool.query("SELECT * FROM attempts WHERE test_id=$1 ORDER BY created_at DESC", [test_id]);
  return res.rows;
};

exports.getAttemptsByUser = async (user_id) => {
  const res = await pool.query("SELECT * FROM attempts WHERE user_id = $1 ORDER BY created_at DESC", [user_id]);
  return res.rows;
};

exports.getAllUserAttempts = async (limit = 20, offset = 0) => {
  const countRes = await pool.query("SELECT COUNT(*) FROM attempts");
  const total = parseInt(countRes.rows[0].count, 10);
  
  const res = await pool.query(`
    SELECT a.*, u.username as user_name, u.email as user_email, t.title as test_name, s.name as subject_name
    FROM attempts a
    JOIN users u ON a.user_id = u.id
    JOIN tests t ON a.test_id = t.id
    JOIN subjects s ON t.subject_id = s.id
    ORDER BY a.created_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);
  return { data: res.rows, total, totalPages: Math.ceil(total / limit), currentPage: Math.floor(offset / limit) + 1 };
};

exports.getQuestionsByTestId = async (test_id) => {
  const res = await pool.query(
    'SELECT id, question_text, type, correct_option, options, correct_answer_text, difficulty_level FROM questions WHERE test_id = $1 ORDER BY id',
    [test_id]
  );
  return res.rows;
};

exports.updateAttemptEvaluation = async (id, written_scores, finalScore, theta, stats) => {
  const res = await pool.query(
    `UPDATE attempts SET written_scores = $1, is_reviewed = true, is_published = false, 
     final_score = $2, final_theta_score = $3, z_score = $4, t_score = $5, 
     standard_ball = $6, level = $7 WHERE id = $8 RETURNING *`,
    [JSON.stringify(written_scores), finalScore, theta, stats.z_score, stats.t_score,
     stats.standard_ball, stats.level, id]
  );
  return res.rows[0];
};

exports.getThetaScores = async () => {
  const res = await pool.query("SELECT final_theta_score FROM attempts WHERE final_theta_score IS NOT NULL");
  return res.rows;
};

exports.getUnreviewedAttempts = async () => {
  const res = await pool.query(`
    SELECT a.*, u.username as user_name, u.email as user_email
    FROM attempts a
    JOIN users u ON a.user_id = u.id
    WHERE a.is_reviewed = false
    ORDER BY a.created_at DESC
  `);
  return res.rows;
};

exports.updateAttemptReview = async (id, written_scores) => {
  const res = await pool.query(
    `UPDATE attempts SET written_scores = $1, is_reviewed = true WHERE id = $2 RETURNING *`,
    [JSON.stringify(written_scores), id]
  );
  return res.rows[0];
};

exports.updateAttemptReviewWithStats = async (id, written_scores, theta, stats) => {
    const res = await pool.query(
      `UPDATE attempts SET written_scores = $1, is_reviewed = true, final_theta_score = $2, 
       z_score = $3, t_score = $4, standard_ball = $5, level = $6 WHERE id = $7 RETURNING *`,
      [JSON.stringify(written_scores), theta, stats.z_score, stats.t_score,
       stats.standard_ball, stats.level, id]
    );
    return res.rows[0];
};

exports.updateAttemptPublish = async (id, written_scores, totalScore, stats) => {
    const res = await pool.query(
      `UPDATE attempts SET written_scores = $1, is_reviewed = true, is_published = true, 
       final_score = $2, z_score = $3, t_score = $4, standard_ball = $5, level = $6 WHERE id = $7 RETURNING *`,
      [JSON.stringify(written_scores), totalScore, stats.z_score, stats.t_score,
       stats.standard_ball, stats.level, id]
    );
    return res.rows[0];
};

exports.publishAllReviewed = async () => {
    const res = await pool.query(
      `UPDATE attempts SET is_published = true WHERE is_reviewed = true AND is_published = false RETURNING id`
    );
    return { count: res.rowCount, ids: res.rows.map(r => r.id) };
};

exports.publishAttemptById = async (id) => {
    const res = await pool.query(
      `UPDATE attempts SET is_published = true WHERE id = $1 AND is_reviewed = true RETURNING *`,
      [id]
    );
    return res.rows[0];
};

exports.getReviewedUnpublishedAttempts = async () => {
    const res = await pool.query("SELECT * FROM attempts WHERE is_reviewed = true AND is_published = false");
    return res.rows;
};

exports.updateAttemptFinalPublish = async (id, finalScore, stats) => {
    const res = await pool.query(
        `UPDATE attempts SET is_published = true, final_score = $1, z_score = $2, 
         t_score = $3, standard_ball = $4, level = $5 WHERE id = $6 RETURNING *`,
        [finalScore, stats.z_score, stats.t_score, stats.standard_ball, stats.level, id]
    );
    return res.rows[0];
};