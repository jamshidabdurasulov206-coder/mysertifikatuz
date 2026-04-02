// Get current user info
exports.getMe = async (req, res) => {
  try {
    const user = await require("../services/user.service").getById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ id: user.id, full_name: user.username, email: user.email, role: user.role, created_at: user.created_at });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;
    const updatedUser = await require("../services/user.service").updateUser(req.user.id, { 
      username: full_name, 
      email, 
      password 
    });
    res.json({ message: "Profil yangilandi", user: { id: updatedUser.id, full_name: updatedUser.username, email: updatedUser.email } });
  } catch (err) {
    res.status(400).json({ message: err.message || "Profilni yangilashda xatolik" });
  }
};
// controllers/auth.controller.js
const authService = require("../services/auth.service");

exports.register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body || {};
    if (!full_name || typeof full_name !== 'string' || full_name.trim().split(/\s+/).length < 2) {
      return res.status(400).json({ message: "Ism va familiyangizni to'liq kiriting (kamida 2 ta so'z)" });
    }
    const user = await authService.register({ full_name, email, password });
    res.json({ id: user.id, full_name: user.full_name });
  } catch (err) {
    res.status(400).json({ message: err && err.message ? err.message : "Xatolik yuz berdi" });
  }
};

exports.login = async (req, res) => {
  try {
    console.log("[login] request body", req.body);
    const data = await authService.login(req.body);
    console.log("[login] success for", data.email);
    res.json(data);
  } catch (err) {
    console.error("[login] error", err);
    res.status(400).json({ message: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    await authService.verifyEmail(req.body.token);
    res.json({ message: "Email muvaffaqiyatli tasdiqlandi" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    if (!req.body.email) return res.status(400).json({ message: "Email kiritish majburiy" });
    await authService.forgotPassword(req.body.email);
    res.json({ message: "Parolni tiklash havolasi elektron pochtangizga yuborildi" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: "Ma'lumotlar to'liq emas" });
    await authService.resetPassword(token, newPassword);
    res.json({ message: "Parol muvaffaqiyatli yangilandi" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ======== 2FA OTP ========
const mailService = require("../services/mail.service");
const pool = require("../config/db");

// In-memory OTP store (production: use Redis or DB)
const otpStore = new Map();

// Cleanup expired OTPs every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of otpStore.entries()) {
    if (now > val.expires) otpStore.delete(key);
  }
}, 600000);

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email kiritish majburiy" });

    // Check user exists
    const userRes = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: "Bunday email topilmadi" });
    }

    // Generate and store OTP
    const otpCode = mailService.generateOtp();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore.set(email, { code: otpCode, expires, attempts: 0 });

    // Send OTP via email
    await mailService.sendOtpEmail(email, otpCode);

    res.json({ message: "Tasdiqlash kodi emailingizga yuborildi", expiresIn: 300 });
  } catch (err) {
    res.status(500).json({ message: err.message || "OTP yuborishda xatolik" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: "Email va kod kiritish majburiy" });

    const stored = otpStore.get(email);
    if (!stored) {
      return res.status(400).json({ message: "Kod topilmadi. Qaytadan so'rang." });
    }

    // Check expiry
    if (Date.now() > stored.expires) {
      otpStore.delete(email);
      return res.status(400).json({ message: "Kod muddati o'tdi. Qaytadan so'rang." });
    }

    // Rate limit: max 5 attempts
    stored.attempts += 1;
    if (stored.attempts > 5) {
      otpStore.delete(email);
      return res.status(429).json({ message: "Juda ko'p urinish. Qaytadan kod so'rang." });
    }

    // Verify code
    if (stored.code !== String(code).trim()) {
      return res.status(400).json({ message: `Kod noto'g'ri. ${5 - stored.attempts} ta urinish qoldi.` });
    }

    // Success — delete OTP and return JWT
    otpStore.delete(email);

    // Get user and create token
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = userRes.rows[0];
    const jwt = require("jsonwebtoken");
    const userRole = user.role ? String(user.role) : 'user';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Muvaffaqiyatli tasdiqlandi",
      token,
      id: user.id,
      name: user.username || '',
      email: user.email,
      role: userRole
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "OTP tekshirishda xatolik" });
  }
};

// ======== GOOGLE AUTH ========
const { OAuth2Client } = require('google-auth-library');

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: "Token kiritilmadi" });

    // Ensure Client ID is available
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "Serverda GOOGLE_CLIENT_ID o'rnatilmagan" });
    }

    // Instead of verifyIdToken, we fetch from OAuth2 userinfo using the access_token
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${credential}` }
    });
    
    if (!userInfoResponse.ok) {
       throw new Error("Invalid Google access token");
    }
    const payload = await userInfoResponse.json();
    const { email, name, sub } = payload;
    
    if (!email) return res.status(400).json({ message: "Google profilingizda xato bor." });
    
    const jwt = require("jsonwebtoken");
    const bcrypt = require("bcrypt");
    
    // Check if user exists
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    let user;
    
    if (userRes.rows.length > 0) {
      user = userRes.rows[0];
    } else {
      // Create user
      const randomPassword = await bcrypt.hash(sub + Date.now().toString(), 10);
      const newUserRes = await pool.query(
        "INSERT INTO users (username, email, password, role, email_verified) VALUES ($1, $2, $3, 'user', true) RETURNING *",
        [name, email, randomPassword]
      );
      user = newUserRes.rows[0];
    }
    
    const userRole = user.role ? String(user.role) : 'user';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    
    res.json({
      message: "Google orqali muvaffaqiyatli kirdingiz",
      token,
      id: user.id,
      name: user.username || '',
      email: user.email,
      role: userRole
    });
  } catch (err) {
    console.error("Google Auth failed:", err);
    res.status(400).json({ message: "Google orqali kirishda xatolik yuz berdi. Client ID ni tekshiring." });
  }
};