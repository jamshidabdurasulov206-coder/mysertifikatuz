const express = require("express");
const crudController = require("../controllers/attempt.crud.controller");
const aiController = require("../controllers/attempt.ai.controller");
const reviewController = require("../controllers/attempt.review.controller");
const publishController = require("../controllers/attempt.publish.controller");

const isAdmin = require('../middlewares/isAdmin.middleware');
const auth = require("../middlewares/auth.middleware");
const router = express.Router();

// Rasch statistikasi (mu va sigma)
router.get('/theta-stats', auth, isAdmin, reviewController.getThetaStats);

// Foydalanuvchi o‘zining test natijalarini ko‘rishi uchun
router.get('/user-tests', auth, crudController.getAttemptsByUser);

// Admin barcha foydalanuvchilarning natijalarini ko‘rishi uchun
router.get('/all-user-tests', auth, isAdmin, crudController.getAllUserAttempts);

// AI baholash endpointi (admin yoki avtomatik)
router.post('/:id/auto-evaluate', auth, isAdmin, aiController.autoEvaluateAttempt);

// Admin review: yozma javoblarni tekshirish va e'lon qilish
router.patch('/:id/save-review', auth, isAdmin, reviewController.saveReview);
router.post('/publish-all', auth, isAdmin, publishController.publishAllReviewed);
router.post('/rasch-run', auth, isAdmin, publishController.computeRaschAll);

// Tekshirilmagan yozma javoblar ro'yxati
router.get('/unreviewed', auth, isAdmin, reviewController.getUnreviewedAttempts);
router.get('/pending', auth, isAdmin, reviewController.getPendingAttempts);
router.get('/admin/pre-rasch-review', auth, isAdmin, reviewController.getPreRaschReviewAttempts);
router.get('/pre-rasch-review', auth, isAdmin, reviewController.getPreRaschReviewAttempts);

// Admin tomonidan ball qo'yish va natijani e'lon qilish
router.post('/review', auth, isAdmin, reviewController.reviewAttempt);
router.patch('/:id/review', auth, isAdmin, reviewController.reviewAttemptById);

// Admin: Publish a specific user's attempt for a test (all)
router.post("/publish", auth, isAdmin, publishController.publishResult);

// Admin: Publish a specific attempt by id
router.post('/:id/publish', auth, isAdmin, publishController.publishAttemptById);

// Basic CRUD Operations
router.post("/", auth, crudController.createAttempt);
router.get("/user/:userId", auth, crudController.getAttemptsByUser);
router.get("/:id/analysis", auth, crudController.getAttemptAnalysis);
router.get("/:testId", auth, crudController.getAttemptsByTest);
router.delete("/:id", auth, isAdmin, crudController.deleteAttempt);

module.exports = router;