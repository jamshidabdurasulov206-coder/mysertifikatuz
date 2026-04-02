const pool = require("../config/db");

exports.createTest = async (title, description, subject_id, price = 10000) => {
  const res = await pool.query(
    "INSERT INTO tests (title, description, subject_id, price) VALUES ($1, $2, $3, $4) RETURNING *",
    [title, description, subject_id, price]
  );
  return res.rows[0];
};

exports.getTests = async (limit = null, offset = null) => {
  let query = `SELECT tests.*, subjects.name as subject_name 
     FROM tests 
     LEFT JOIN subjects ON tests.subject_id = subjects.id 
     ORDER BY tests.id DESC`;

  if (limit !== null && offset !== null) {
    const countRes = await pool.query("SELECT COUNT(*) FROM tests");
    const total = parseInt(countRes.rows[0].count, 10);
    const res = await pool.query(query + " LIMIT $1 OFFSET $2", [limit, offset]);
    return { data: res.rows, total, totalPages: Math.ceil(total / limit), currentPage: Math.floor(offset / limit) + 1 };
  } else {
    const res = await pool.query(query);
    return res.rows;
  }
};

exports.deleteTest = async (id) => {
  const res = await pool.query("DELETE FROM tests WHERE id = $1", [id]);
  return res.rowCount > 0;
};