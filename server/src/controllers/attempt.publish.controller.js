const publishService = require("../services/publish.service");

/**
 * Admin "Natijalarni e'lon qilish" tugmasini bosganda ishlaydi.
 * Ma'lum bir test (testId) bo'yicha barcha 'reviewed' statusidagi
 * urinishlar uchun guruh asosida Rasch ballarini hisoblab, 'published' qiladi.
 */
exports.publishAllReviewed = async (req, res) => {
  try {
    const { testId } = req.body || {};

    // Agar testId berilsa — o'sha test uchun, aks holda barcha rasch_scored urinishlarni e'lon qiladi
    if (testId) {
      const { count, mu, sigma } = await publishService.publishBatch(testId, { publish: true });
      return res.json({
        message: `${count} ta natija muvaffaqiyatli e'lon qilindi!`,
        details: { count, mu, sigma }
      });
    }

    const pool = require("../config/db");
    const testIdsRes = await pool.query("SELECT DISTINCT test_id FROM attempts WHERE status = 'rasch_scored' AND is_published = false");

    let total = 0;
    for (const row of testIdsRes.rows) {
      const { count } = await publishService.publishBatch(row.test_id, { publish: true });
      total += count;
    }

    return res.json({ message: `${total} ta natija e'lon qilindi`, details: { total } });
  } catch (err) {
    console.error("[PublishAllReviewed] Error:", err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: Raschni hisoblash (e'lon qilmasdan) — status: rasch_scored, is_published=false
exports.computeRaschAll = async (req, res) => {
  try {
    const { testId } = req.body || {};

    if (testId) {
      const { count, mu, sigma } = await publishService.publishBatch(testId, { publish: false });
      return res.json({
        message: count === 0 ? "Hisoblash uchun tayyor urinish yo'q" : `${count} ta urinish uchun Rasch hisoblandi (e'lon qilinmadi)` ,
        details: { count, mu, sigma }
      });
    }

    const pool = require("../config/db");
    const testIdsRes = await pool.query("SELECT DISTINCT test_id FROM attempts WHERE status IN ('ready_for_rasch','reviewed') AND is_published = false");

    let total = 0;
    for (const row of testIdsRes.rows) {
      const { count } = await publishService.publishBatch(row.test_id, { publish: false });
      total += count;
    }

    return res.json({
      message: total === 0 ? "Hisoblash uchun tayyor urinish yo'q" : `${total} ta urinish uchun Rasch hisoblandi (e'lon qilinmadi)` ,
      details: { total }
    });
  } catch (err) {
    console.error("[ComputeRaschAll] Error:", err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * ID bo'yicha bitta urinishni e'lon qilish (Agar kerak bo'lsa)
 * Eslatma: Rasch modeli guruhga bog'liq bo'lganligi sababli, 
 * bitta-bitta e'lon qilish tavsiya etilmaydi.
 */
exports.publishAttemptById = async (req, res) => {
  try {
    const attemptId = req.params.id;
    // Bitta urinish uchun o'rtacha statsni ishlatish mumkin (fallback)
    res.status(400).json({ message: "Guruhli e'lon qilish rejimida individual e'lon qilish to'xtatilgan." });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Barcha kutilayotganlarni e'lon qilish (TestId bo'yicha guruhlaydi)
 */
exports.publishResult = async (req, res) => {
  try {
    const pool = require("../config/db");
    const testIdsRes = await pool.query("SELECT DISTINCT test_id FROM attempts WHERE status = 'rasch_scored' AND is_published = false");
    
    let totalPublished = 0;
    for (const row of testIdsRes.rows) {
      const { count } = await publishService.publishBatch(row.test_id, { publish: true });
      totalPublished += count;
    }

    res.json({ message: "Hamma testlar bo'yicha natijalar e'lon qilindi", total: totalPublished });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
