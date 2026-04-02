const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller'); // Hali yaratamiz

// Talaba javoblarini yuborganda ishlaydigan yo'lak
router.post('/submit', examController.submitExam);

module.exports = router;