const pool = require("../config/db");

exports.createSubject = async (name) => {
  const res = await pool.query(
    "INSERT INTO subjects (name) VALUES ($1) RETURNING *",
    [name]
  );
  return res.rows[0];
};

exports.getSubjects = async (limit = null, offset = null) => {
  let query = "SELECT * FROM subjects ORDER BY id DESC";

  if (limit !== null && offset !== null) {
    const countRes = await pool.query("SELECT COUNT(*) FROM subjects");
    const total = parseInt(countRes.rows[0].count, 10);
    const res = await pool.query(query + " LIMIT $1 OFFSET $2", [limit, offset]);
    return { data: res.rows, total, totalPages: Math.ceil(total / limit), currentPage: Math.floor(offset / limit) + 1 };
  } else {
    const res = await pool.query(query);
    return res.rows;
  }
};

exports.deleteSubject = async (id) => {
  const res = await pool.query("DELETE FROM subjects WHERE id = $1", [id]);
  return res.rowCount > 0;
};