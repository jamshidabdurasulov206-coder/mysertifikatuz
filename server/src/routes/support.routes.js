const express = require("express");
const router = express.Router();
const supportController = require("../controllers/support.controller");
const auth = require("../middlewares/auth.middleware");
const isAdmin = require("../middlewares/isAdmin.middleware");

// Public Endpoint
router.post("/send", supportController.sendMessage);

// Admin Endpoints
router.get("/admin/messages", auth, isAdmin, supportController.getMessages);
router.put("/admin/messages/:id/read", auth, isAdmin, supportController.markAsRead);

module.exports = router;
