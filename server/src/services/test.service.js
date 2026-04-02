const testModel = require("../models/test.model");
const pool = require("../config/db"); // Bazaga ulanishni to'g'ridan-to'g'ri chaqiramiz (yoki model orqali)

exports.createTest = async (data) => {
  if (!data.title) throw new Error("Title is required");
  if (!data.subject_id) throw new Error("Subject ID is required");
  const price = data.price ? parseInt(data.price, 10) : 10000;
  return await testModel.createTest(data.title, data.description, data.subject_id, price);
};

exports.getTests = async (page = null, limit = null) => {
  if (page && limit) {
    return await testModel.getTests(limit, (page - 1) * limit);
  }
  return await testModel.getTests();
};

/**
 * TESTNI O'CHIRISH: Bog'liqliklar bilan birga
 */
exports.deleteTest = async (id) => {
  try {
    // 1. Avval ushbu testga tegishli barcha savollarni o'chirib tashlaymiz
    // Agar buni qilmasangiz, baza testni o'chirishga yo'l qo'ymaydi
    await pool.query("DELETE FROM questions WHERE test_id = $1", [id]);

    // 2. Endi testning o'zini o'chiramiz
    const result = await testModel.deleteTest(id);
    
    return result; 
  } catch (err) {
    console.error("Service Error (deleteTest):", err.message);
    throw new Error("Testni o'chirib bo'lmadi: " + err.message);
  }
};