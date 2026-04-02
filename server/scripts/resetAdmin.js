require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../src/config/db');

(async () => {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  try {
    const hash = await bcrypt.hash(password, 10);
    const res = await pool.query(
      "UPDATE users SET email = $1, password = $2, role = 'admin' WHERE username = 'admin' RETURNING id, username, email, role",
      [email, hash]
    );
    if (res.rowCount === 0) {
      console.log('No admin row found to update.');
    } else {
      console.log('Admin updated:', res.rows[0]);
      console.log('Login with email:', email, 'password:', password);
    }
  } catch (err) {
    console.error('Error updating admin:', err.message);
  } finally {
    pool.end();
  }
})();
