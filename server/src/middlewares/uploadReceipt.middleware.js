const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads/receipts");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const base = path.basename(file.originalname || "file", ext).replace(/[^a-zA-Z0-9_-]/g, "");
    const name = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${base || "receipt"}${ext || ""}`;
    cb(null, name);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "application/pdf"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Yaroqsiz fayl turi. Faqat JPG, PNG yoki PDF ruxsat."));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

module.exports = upload;
