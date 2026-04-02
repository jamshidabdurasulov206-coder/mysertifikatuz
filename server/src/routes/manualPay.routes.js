const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const isAdmin = require("../middlewares/isAdmin.middleware");
const ctrl = require("../controllers/manualPayment.controller");
const upload = require("../middlewares/uploadReceipt.middleware");

router.use(auth);

// Foydalanuvchi to'lov so'rovi yaratadi
router.post("/", ctrl.create);
// Chek rasmini/linkini yuklash
router.post("/:id/receipt", ctrl.uploadReceipt);
router.post("/:id/receipt/upload", upload.single("file"), ctrl.uploadReceiptFile);
// Foydalanuvchining barcha to'lovlari
router.get("/my", ctrl.myPayments);

// Admin uchun
router.get("/pending", isAdmin, ctrl.pending);
router.post("/:id/approve", isAdmin, ctrl.approve);
router.post("/:id/reject", isAdmin, ctrl.reject);

module.exports = router;
