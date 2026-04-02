const express = require("express");
const router = express.Router();
const questionController = require("../controllers/question.controller");

router.post("/", questionController.createQuestion);
router.get("/:testId", questionController.getQuestionsByTest);

module.exports = router;