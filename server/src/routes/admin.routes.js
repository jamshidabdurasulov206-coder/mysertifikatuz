const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const auth = require("../middlewares/auth.middleware");
const isAdmin = require("../middlewares/isAdmin.middleware");

router.post("/login", adminController.login);
router.post("/publish-test/:testId", adminController.publishTestResults);

// Dashboard stats (admin only)
router.get("/stats", auth, isAdmin, adminController.getStats);

// CSV export (admin only)
router.get("/export/results", auth, isAdmin, adminController.exportResults);

// Leaderboard (public — anyone can see top scores)
router.get("/leaderboard", adminController.getLeaderboard);

// Audit logs (admin only)
router.get("/audit-logs", auth, isAdmin, adminController.getAuditLogs);

// Test Editor (admin only)
router.get("/tests/:testId/full", auth, isAdmin, adminController.getTestFull);
router.put("/tests/:testId", auth, isAdmin, adminController.updateTestAndQuestions);

// Test Analytics (admin + user accessible)
router.get("/analytics/:testId", auth, adminController.getTestAnalytics);

module.exports = router;
