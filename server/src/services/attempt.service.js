const attemptModel = require("../models/attempt.model");

exports.createAttempt = async (data) => {
  if (!data.test_id || !data.user_id || !data.answers || data.subject_name == null || data.score == null)
    throw new Error("All fields required");
  return await attemptModel.createAttempt(data.test_id, data.user_id, data.answers, data.score, data.subject_name, data.status || 'pending');
};

exports.findAttemptByUserAndTest = async (user_id, test_id) => {
  return await attemptModel.findByUserAndTest(user_id, test_id);
};

exports.deleteAttempt = async (id) => {
  const rowCount = await attemptModel.deleteAttempt(id);
  return rowCount > 0;
};

exports.getAttemptsByTest = async (test_id) => {
  return await attemptModel.getAttemptsByTest(test_id);
};

exports.getAttemptsByUser = async (user_id) => {
  return await attemptModel.getAttemptsByUser(user_id);
};

exports.getAllUserAttempts = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  return await attemptModel.getAllUserAttempts(limit, offset);
};

exports.getAttemptById = async (id) => {
  return await attemptModel.getAttemptById(id);
};

exports.getQuestionsByTestId = async (test_id) => {
  return await attemptModel.getQuestionsByTestId(test_id);
};