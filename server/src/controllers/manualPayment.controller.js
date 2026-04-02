const manualPaymentService = require("../services/manualPayment.service");

exports.create = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { amount, currency, test_id, receipt_url, comment } = req.body || {};
    const payment = await manualPaymentService.createManualPayment({ user_id, test_id, amount, currency, receipt_url, comment });
    res.status(201).json({ success: true, payment });
  } catch (err) {
    res.status(400).json({ message: err.message || "To'lov yaratishda xatolik" });
  }
};

exports.uploadReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { receipt_url } = req.body || {};
    const payment = await manualPaymentService.findPayment(id);
    if (!payment) return res.status(404).json({ message: "To'lov topilmadi" });
    if (payment.user_id !== req.user.id && String(req.user.role).toLowerCase() !== 'admin') {
      return res.status(403).json({ message: "Chekni faqat egasi yangilashi mumkin" });
    }
    const updated = await manualPaymentService.uploadReceipt(id, receipt_url);
    res.json({ success: true, payment: updated });
  } catch (err) {
    res.status(400).json({ message: err.message || "Chek yuklashda xatolik" });
  }
};

exports.uploadReceiptFile = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await manualPaymentService.findPayment(id);
    if (!payment) return res.status(404).json({ message: "To'lov topilmadi" });
    if (payment.user_id !== req.user.id && String(req.user.role).toLowerCase() !== 'admin') {
      return res.status(403).json({ message: "Chekni faqat egasi yangilashi mumkin" });
    }
    if (!req.file) return res.status(400).json({ message: "Fayl topilmadi" });
    const fileUrl = `/uploads/receipts/${req.file.filename}`;
    const updated = await manualPaymentService.uploadReceipt(id, fileUrl);
    res.json({ success: true, payment: updated, fileUrl });
  } catch (err) {
    res.status(400).json({ message: err.message || "Chek yuklashda xatolik" });
  }
};

exports.myPayments = async (req, res) => {
  try {
    const payments = await manualPaymentService.getUserPayments(req.user.id);
    res.json({ success: true, payments });
  } catch (err) {
    res.status(400).json({ message: err.message || "To'lovlarni olishda xatolik" });
  }
};

exports.pending = async (req, res) => {
  try {
    const payments = await manualPaymentService.getPendingPayments();
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const base = `${proto}://${host}`;
    const withLinks = payments.map((payment) => {
      if (!payment.receipt_url) return { ...payment, receipt_file_url: null };
      if (/^https?:\/\//i.test(payment.receipt_url)) {
        return { ...payment, receipt_file_url: payment.receipt_url };
      }
      const path = payment.receipt_url.startsWith('/') ? payment.receipt_url : `/${payment.receipt_url}`;
      return { ...payment, receipt_file_url: `${base}${path}` };
    });
    res.json({ success: true, payments: withLinks });
  } catch (err) {
    res.status(400).json({ message: err.message || "To'lovlarni olishda xatolik" });
  }
};

exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body || {};
    const payment = await manualPaymentService.findPayment(id);
    if (!payment) return res.status(404).json({ message: "To'lov topilmadi" });
    const updated = await manualPaymentService.approvePayment(id, req.user.id, comment);
    res.json({ success: true, payment: updated });
  } catch (err) {
    res.status(400).json({ message: err.message || "Tasdiqlashda xatolik" });
  }
};

exports.reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body || {};
    const payment = await manualPaymentService.findPayment(id);
    if (!payment) return res.status(404).json({ message: "To'lov topilmadi" });
    const updated = await manualPaymentService.rejectPayment(id, req.user.id, comment);
    res.json({ success: true, payment: updated });
  } catch (err) {
    res.status(400).json({ message: err.message || "Rad etishda xatolik" });
  }
};
