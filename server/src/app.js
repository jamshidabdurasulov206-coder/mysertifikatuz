const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const app = express();

const trustProxyEnv = process.env.TRUST_PROXY;
if (typeof trustProxyEnv === "string" && trustProxyEnv.length > 0) {
  if (trustProxyEnv === "true") app.set("trust proxy", true);
  else if (trustProxyEnv === "false") app.set("trust proxy", false);
  else if (/^\d+$/.test(trustProxyEnv)) app.set("trust proxy", Number(trustProxyEnv));
  else app.set("trust proxy", trustProxyEnv);
} else {
  // Dev proxy (frontend -> backend) holatida rate-limit X-Forwarded-For xatosini oldini oladi
  app.set("trust proxy", 1);
}

// 1. Middlewares
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
  : ["*"]; // temporary: allow all devices

const isOriginAllowed = (origin, list) => {
  const allowAll = list.includes("*");
  if (!origin || allowAll) return true;
  return list.some((entry) => {
    if (entry.endsWith("/*")) {
      const base = entry.slice(0, -2);
      return origin.startsWith(base);
    }
    return origin === entry;
  });
};

app.use(cors({
  origin: function (origin, callback) {
    // serverdan o'zi so'rov bo'lsa (Postman, curl) yoki ruxsat etilgan origin
    if (isOriginAllowed(origin, allowedOrigins)) {
      callback(null, true);
    } else {
      callback(new Error("CORS siyosati tomonidan rad etildi"));
    }
  },
  credentials: true
}));
// Rate limiting
const rateLimit = require("express-rate-limit");

// Global so'rovlar chegarasi (masalan, API ga 15 daqiqada 1000 ta so'rov)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000,
  message: { error: "Juda ko'p so'rov yuborildi. Iltimos, keyinroq urinib ko'ring." },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI tahlil qilish endpointi uchun qattiqroq cheklov (1 soatda 20 ta so'rov)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 20,
  message: { error: "AI kvotasi tugadi. Iltimos, 1 soatdan so'ng urinib ko'ring." },
});

app.use(express.json());
app.use(globalLimiter);
app.use(express.static(path.join(__dirname, "../public")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.get("/favicon.ico", (_req, res) => res.status(204).end());

// Debug: log incoming requests (temporary)
app.use((req, res, next) => {
  console.log(`[req] ${req.method} ${req.originalUrl}`);
  next();
});

// 2. Oddiy tekshiruv yo'lagi
app.get("/", (req, res) => {
  res.json({ message: "Milliy Sertifikat API is running..." });
});

// 3. Routerlarni ulash (Barchasini /api bilan standartlashtirdik)
try {
  // Fanlar endi http://localhost:4000/api/subjects bo'ldi
  app.use("/api/subjects", require("./routes/subject.routes"));
  app.use("/api/tests", require("./routes/test.routes"));
  
  // Bularni ham /api bilan boshlanadigan qildik (Frontend xato bermasligi uchun)
  app.use("/api/questions", require("./routes/question.routes"));
  app.use("/api/attempts", require("./routes/attempt.routes"));
  app.use("/api/auth", require("./routes/auth.routes"));
  app.use("/api/ai", aiLimiter, require("./routes/ai.routes"));
  app.use("/api/admin", require("./routes/admin.routes"));
  app.use("/api/exams", require("./routes/exam.routes"));
  app.use("/api/support", require("./routes/support.routes"));
  app.use("/api/pay/manual", require("./routes/manualPay.routes"));
  
  // PAYME INTEGRATSIYASI
  app.use("/api/payme", require("./routes/payme.routes"));
  
  console.log("✅ Barcha routerlar /api prefiksi bilan muvaffaqiyatli yuklandi");
} catch (error) {
  console.error("❌ Routerlarni yuklashda xato:", error.message);
}

const logger = require("./utils/logger");

// 4. Xatoliklarni ushlab qolish middleware
app.use((err, req, res, next) => {
  logger.error("Unhandled Error middleware:", err);
  res.status(500).json({ error: "Server ichki xatosi!" });
});

// React Router bilan muammosiz ishlash uchun
const appIndexPath = path.join(__dirname, "../public/index.html");
app.get(/^(.*)$/, (req, res) => {
  if (fs.existsSync(appIndexPath)) {
    return res.sendFile(appIndexPath);
  }
  return res.status(404).json({ message: "Not Found" });
});

module.exports = app;                                                                                                                                                                                                                                               