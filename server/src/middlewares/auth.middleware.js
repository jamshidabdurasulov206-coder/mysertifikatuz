// middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // Har xil harfda kelishi mumkin: authorization yoki Authorization
  let token = req.headers.authorization || req.headers.Authorization;

  // 1. Token borligini tekshirish
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  // 2. Agar token "Bearer [token]" formatida bo'lsa, faqat tokenni ajratib olish
  if (token.startsWith("Bearer ")) {
    token = token.split(" ")[1];
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next(); // Keyingi funksiyaga o'tish
  } catch (error) {
    console.error("JWT xatosi:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};