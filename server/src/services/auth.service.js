const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const mailService = require("./mail.service");

exports.register = async (userData) => {
  // Frontenddan 'full_name' keladi, shuni username sifatida ishlatamiz
  const { username, name, full_name, email, password, role } = userData;
  const finalUsername = username || name || full_name; 
  const finalRole = role ? String(role).toLowerCase() : 'user';

  // 1. Foydalanuvchi borligini tekshirish
  const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  
  if (existingUser.rows.length > 0) {
    throw new Error("User already exists");
  }

  // 2. Token generatsiya va parolni hashlash
  const hashedPassword = await bcrypt.hash(password, 10);
  const verifyToken = mailService.generateToken();

  // 3. Bazaga yozish (role ustuni bilan)
  const newUser = await pool.query(
    "INSERT INTO users (username, email, password, role, verify_token) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role",
    [finalUsername, email, hashedPassword, finalRole, verifyToken]
  );

  // 4. Emailga yuborish (xato bo'lsa ham ro'yxatdan o'tishni to'xtatmaymiz)
  try {
    await mailService.sendVerificationEmail(email, verifyToken);
  } catch (err) {
    console.error("Verification email sending failed:", err);
  }

  return newUser.rows[0];
};

exports.verifyEmail = async (token) => {
  const result = await pool.query("UPDATE users SET email_verified = true, verify_token = NULL WHERE verify_token = $1 RETURNING id", [token]);
  if (result.rowCount === 0) {
    throw new Error("Havola eskirgan yoti noto'g'ri");
  }
  return true;
};

exports.forgotPassword = async (email) => {
  const userRes = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (userRes.rows.length === 0) {
    throw new Error("Bunday email mavjud emas");
  }
  
  const resetToken = mailService.generateToken();
  // Expires in 1 hour
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  
  await pool.query(
    "UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3",
    [resetToken, expires, email]
  );
  
  try {
    await mailService.sendPasswordResetEmail(email, resetToken);
  } catch (err) {
    console.error("Reset email sending failed:", err);
    throw new Error("Xatni yuborishda xatolik");
  }
  return true;
};

exports.resetPassword = async (token, newPassword) => {
  const userRes = await pool.query("SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()", [token]);
  if (userRes.rows.length === 0) {
    throw new Error("Havola eskirgan yoki noto'g'ri");
  }
  
  const userId = userRes.rows[0].id;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await pool.query(
    "UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2",
    [hashedPassword, userId]
  );
  
  return true;
};

exports.login = async ({ email, password }) => {
  // 1. Bazadan qidirish
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];

  if (!user) {
    throw new Error("User not found");
  }

  // 2. Parolni solishtirish
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid password");
  }

  // 3. Token yaratish (role har doim string bo'lishi uchun)
  const userRole = user.role ? String(user.role) : 'user';
  const token = jwt.sign(
    { id: user.id, email: user.email, role: userRole },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  return {
    token,
    id: user.id,
    name: user.username || user.name || '',
    email: user.email,
    role: userRole
  };
};