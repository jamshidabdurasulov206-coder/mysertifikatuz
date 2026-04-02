const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const isAdmin = require("../middlewares/isAdmin.middleware");
const aiController = require("../controllers/ai.controller");

const multer = require("multer");
const upload = multer({ 
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Faqat PDF fayllarga ruxsat berilgan"));
  }
});

// JSON matnli test uchun
router.post("/parse-test", auth, isAdmin, aiController.parseTest);

// PDF fayldan o'qib AI tahlil qilish uchun
router.post("/parse-pdf", auth, isAdmin, upload.single("pdf"), aiController.parsePdfTest);

module.exports = router;