const express = require("express");
const router = express.Router();

const testController = require("../controllers/test.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const isAdmin = require("../middlewares/isAdmin.middleware");


router.post("/", authMiddleware, isAdmin, testController.createTest);
router.post("/:id/start-session", authMiddleware, testController.startSession);
router.get("/", testController.getTests);
router.delete("/:id", authMiddleware, isAdmin, testController.deleteTest);

module.exports = router;