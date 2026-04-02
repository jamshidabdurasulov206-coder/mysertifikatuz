const pool = require("../config/db");

exports.createQuestion = async (test_id, question_text, options, correct_option) => {
  const res = await pool.query(
    "INSERT INTO questions (test_id, question_text, options, correct_option) VALUES ($1, $2, $3, $4) RETURNING *",
    [test_id, question_text, options, correct_option]
  );
  return res.rows[0];
};

exports.getQuestionsByTest = async (test_id) => {
  const res = await pool.query(
    "SELECT * FROM questions WHERE test_id=$1 ORDER BY id",
    [test_id]
  );
  return res.rows;
};