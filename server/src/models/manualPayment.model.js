const pool = require("../config/db");

async function createPayment({ user_id, test_id, amount, currency, receipt_url, comment }) {
  const res = await pool.query(
    `INSERT INTO manual_payments (user_id, test_id, amount, currency, receipt_url, comment)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [user_id, test_id || null, amount || 0, currency || 'UZS', receipt_url || null, comment || null]
  );
  return res.rows[0];
}

async function attachReceipt(id, receipt_url) {
  const res = await pool.query(
    `UPDATE manual_payments SET receipt_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [receipt_url || null, id]
  );
  return res.rows[0];
}

async function listByUser(user_id) {
  const res = await pool.query(
    `SELECT * FROM manual_payments WHERE user_id = $1 ORDER BY created_at DESC`,
    [user_id]
  );
  return res.rows;
}

async function listPending() {
  const res = await pool.query(
    `SELECT mp.*, u.username, u.email
       FROM manual_payments mp
       JOIN users u ON mp.user_id = u.id
      WHERE mp.status = 'pending'
      ORDER BY mp.created_at ASC`
  );
  return res.rows;
}

async function setStatus(id, status, approver_id, comment) {
  const res = await pool.query(
    `UPDATE manual_payments
      SET status = $1::varchar,
            approver_id = $2,
        approved_at = CASE WHEN $1::varchar = 'approved' THEN NOW() ELSE approved_at END,
            comment = COALESCE($3, comment),
            updated_at = NOW()
      WHERE id = $4
      RETURNING *`,
    [status, approver_id || null, comment || null, id]
  );
  return res.rows[0];
}

async function findById(id) {
  const res = await pool.query(`SELECT * FROM manual_payments WHERE id = $1`, [id]);
  return res.rows[0];
}

async function hasApproved(user_id, test_id) {
  const res = await pool.query(
    `SELECT 1 FROM manual_payments WHERE user_id = $1 AND (test_id = $2 OR $2 IS NULL) AND status = 'approved' LIMIT 1`,
    [user_id, test_id || null]
  );
  return res.rows.length > 0;
}

module.exports = {
  createPayment,
  attachReceipt,
  listByUser,
  listPending,
  setStatus,
  findById,
  hasApproved
};
