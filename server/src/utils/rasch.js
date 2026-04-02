/**
 * Rasch modeli (IRT) yordamchi funksiyalari
 * T-17: Barcha controller'lardagi takrorlangan formulalar shu yerga chiqarildi
 */

/**
 * Barcha attempt'lardan mu va sigma hisoblash (Z-score uchun)
 */
async function calculateThetaStats(pool) {
  let mu = 0, sigma = 1;
  try {
    const statsRes = await pool.query("SELECT final_theta_score FROM attempts WHERE final_theta_score IS NOT NULL");
    const thetas = statsRes.rows.map(r => Number(r.final_theta_score)).filter(x => !isNaN(x));
    if (thetas.length > 0) {
      mu = thetas.reduce((a, b) => a + b, 0) / thetas.length;
      sigma = Math.sqrt(thetas.reduce((a, b) => a + Math.pow(b - mu, 2), 0) / thetas.length);
      if (!isFinite(sigma) || sigma === 0) sigma = 1;
    }
  } catch (e) { mu = 0; sigma = 1; }
  return { mu, sigma };
}

/**
 * Z-score hisoblash: Z = (theta - mu) / sigma
 */
function calculateZScore(theta, mu, sigma) {
  return sigma !== 0 ? (theta - mu) / sigma : 0;
}

/**
 * T-score hisoblash: T = 50 + 10Z
 */
function calculateTScore(zScore) {
  return 50 + 10 * zScore;
}

/**
 * Standard ball hisoblash (fan turi bo'yicha maxBall aniqlanadi)
 * @param {number} tScore - T-ball ko'rsatkichi
 * @param {string} subjectName - Fan nomi (moslik uchun saqlangan)
 */
function calculateStandardBall(tScore, subjectName) {
  const maxBall = 100;
  
  // 46 dan past bo'lsa sertifikat berilmaydi (0 ball)
  if (tScore < 46) return 0;

  // 46 dan yuqorida Rasch T-score proporsional konvert qilinadi.
  // Yuqori cap qo'yilmaydi: T-score oshsa, standard_ball ham oshadi.
  return Math.round((tScore / 65) * maxBall);
}

// Fan bo'yicha maksimal ball (sertifikatda ko'rsatiladigan) aniqlash
function getMaxBall(subjectName) {
  return 100;
}

// Foiz ko'rsatkichi: T-score ≥65 bo'lsa 100%, aks holda standard_ball / maxBall proporsiyasi
function calculatePercentage(subjectName, standardBall, tScore) {
  const maxBall = getMaxBall(subjectName);
  const safeBall = Number(standardBall) || 0;
  if (maxBall === 0) return 0;
  return Math.max(0, Math.min(100, Math.round((safeBall / maxBall) * 100)));
}

/**
 * T-score asosida daraja (level) aniqlash
 */
function calculateLevel(tScore) {
  const score = Number(tScore) || 0;
  if (score >= 70) return 'A+';
  if (score >= 65) return 'A';
  if (score >= 60) return 'B+';
  if (score >= 55) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 46) return 'C';
  return 'FAIL';
}

/**
 * Yozma ish (writing) ballarini 75 ballik tizimga konvertatsiya qilish
 * Formula: LangBall = (RawScore * 2) + 27
 */
function convertWritingScore(rawScore) {
  const score = (Number(rawScore) * 2) + 27;
  return Math.min(75, Math.max(27, score));
}

/**
 * Barcha Rasch statistikalarini hisoblash
 */
async function calculateAllRaschStats(pool, theta, thirdArg, fourthArg) {
  const numericTheta = Number(theta);
  if (!isFinite(numericTheta)) {
    throw new Error('Theta must be a finite number');
  }

  const legacyMaxBall = typeof fourthArg !== 'undefined' && isFinite(Number(thirdArg))
    ? Number(thirdArg)
    : null;
  const subjectName = typeof fourthArg === 'undefined' ? thirdArg : fourthArg;
  const { mu, sigma } = await calculateThetaStats(pool);
  const z_score = calculateZScore(numericTheta, mu, sigma);
  const t_score = calculateTScore(z_score);
  const standard_ball = legacyMaxBall === null
    ? calculateStandardBall(t_score, subjectName)
    : (t_score >= 65 ? legacyMaxBall : (t_score < 46 ? 0 : Math.round((t_score / 65) * legacyMaxBall)));
  const level = calculateLevel(t_score);
  
  return { mu, sigma, z_score, t_score, standard_ball, level };
}

module.exports = {
  calculateThetaStats,
  calculateZScore,
  calculateTScore,
  calculateStandardBall,
  calculateLevel,
  getMaxBall,
  calculatePercentage,
  convertWritingScore,
  calculateAllRaschStats
};
