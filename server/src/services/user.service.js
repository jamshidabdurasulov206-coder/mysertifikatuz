const pool = require("../config/db");

exports.getById = async (id) => {
  const res = await pool.query(
    "SELECT id, username, email, role, created_at FROM users WHERE id = $1",
    [id]
  );
  return res.rows[0];
};

const bcrypt = require("bcrypt");

exports.updateUser = async (id, { username, email, password }) => {
  // First get current user to ensure they exist
  const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  const user = res.rows[0];
  if (!user) throw new Error("User not found");

  let newUsername = username || user.username;
  let newEmail = email || user.email;
  let newPassword = user.password;

  if (password) {
    newPassword = await bcrypt.hash(password, 10);
  }

  // Check if new email is already taken by someone else
  if (email && email !== user.email) {
    const emailCheck = await pool.query("SELECT id FROM users WHERE email = $1 AND id != $2", [email, id]);
    if (emailCheck.rows.length > 0) throw new Error("Bu email band qilingan");
  }

  const updateRes = await pool.query(
    "UPDATE users SET username = $1, email = $2, password = $3 WHERE id = $4 RETURNING id, username, email, role, created_at",
    [newUsername, newEmail, newPassword, id]
  );
  
  return updateRes.rows[0];
};