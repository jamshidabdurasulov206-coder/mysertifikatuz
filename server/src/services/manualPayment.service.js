const manualPaymentModel = require("../models/manualPayment.model");

async function createManualPayment(payload) {
  return manualPaymentModel.createPayment(payload);
}

async function uploadReceipt(id, receipt_url) {
  return manualPaymentModel.attachReceipt(id, receipt_url);
}

async function getUserPayments(user_id) {
  return manualPaymentModel.listByUser(user_id);
}

async function getPendingPayments() {
  return manualPaymentModel.listPending();
}

async function approvePayment(id, approver_id, comment) {
  return manualPaymentModel.setStatus(id, 'approved', approver_id, comment);
}

async function rejectPayment(id, approver_id, comment) {
  return manualPaymentModel.setStatus(id, 'rejected', approver_id, comment);
}

async function hasApprovedPayment(user_id, test_id) {
  return manualPaymentModel.hasApproved(user_id, test_id);
}

async function findPayment(id) {
  return manualPaymentModel.findById(id);
}

module.exports = {
  createManualPayment,
  uploadReceipt,
  getUserPayments,
  getPendingPayments,
  approvePayment,
  rejectPayment,
  hasApprovedPayment,
  findPayment
};
