const express = require("express");
const router = express.Router();

const subjectController = require("../controllers/subject.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const isAdmin = require("../middlewares/isAdmin.middleware");


router.post("/", authMiddleware, isAdmin, subjectController.createSubject);
router.get("/", subjectController.getSubjects);
router.delete("/:id", authMiddleware, isAdmin, subjectController.deleteSubject);

module.exports = router;
