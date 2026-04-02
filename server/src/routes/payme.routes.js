const express = require("express");
const router = express.Router();
const paymeController = require("../controllers/payme.controller");

// Payme faqat POST so'rovi yuboradi — secret key tekshiruvi bilan
router.post("/callback", paymeController.verifyPaymeAuth, paymeController.paymeCallback);

module.exports = router;