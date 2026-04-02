/**
 * Levenshtein Distance (Masofa) algoritmik o'xshashlik foizi
 */
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i][j - 1] + 1, // insert
        matrix[i - 1][j] + 1, // delete
        matrix[i - 1][j - 1] + indicator // substitute
      );
    }
  }
  return matrix[a.length][b.length];
}

/**
 * Matnni kichik harfga va raqamlarni tozalash (normalizatsiya)
 */
function normalizeStr(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/[‘’ʻ'`´]/g, '')
    .replace(/[\-–—/]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ') // Ko'p probellarni bitta qilish
    .trim();
}

function extractYears(str) {
  if (!str) return [];
  const normalized = normalizeStr(str);
  const matches = normalized.match(/\b(1\d{3}|20\d{2})\b/g);
  return matches ? matches.map(Number) : [];
}

function stemToken(token) {
  let t = String(token || '');
  const suffixes = [
    'larining', 'larning', 'lardagi', 'lardir', 'lardan', 'larda',
    'lar', 'lari', 'ning', 'ni', 'ga', 'da', 'dan', 'si', 'i'
  ];

  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of suffixes) {
      if (t.length > suffix.length + 2 && t.endsWith(suffix)) {
        t = t.slice(0, -suffix.length);
        changed = true;
        break;
      }
    }
  }

  if (t.length > 6 && t.endsWith('chilar')) t = t.slice(0, -6);
  if (t.length > 5 && t.endsWith('chi')) t = t.slice(0, -3);
  return t;
}

const STOPWORDS = new Set([
  'va', 'ham', 'bilan', 'uchun', 'deb', 'nomli', 'nomi', 'yoki', 'da', 'de', 'dan', 'ning',
  'fransiya', 'qiroli', 'sulolasi', 'suloladan', 'qiroli', 'podsho', 'shoh',
  'yil', 'yili', 'yilda', 'yilda', 'yildan', 'yilgacha', 'asr', 'asri',
  'rejasi', 'reja', 'urushi', 'urush', 'sulolasini', 'sulola'
]);

function toSignificantTokens(str) {
  return normalizeStr(str)
    .split(' ')
    .map(t => t.trim())
    .map((t) => {
      const ordinal = parseOrdinalToken(t);
      return ordinal !== null ? String(ordinal) : t;
    })
    .map(stemToken)
    .filter(t => t.length > 1)
    .filter(t => !STOPWORDS.has(t));
}

function fuzzyTokenEqual(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const maxLen = Math.max(a.length, b.length);
  const dist = levenshteinDistance(a, b);
  return dist <= 1 || (dist <= 2 && maxLen > 6);
}

/**
 * Matn ichidan aniq raqamlarni olish ("2.5", "2,50", "1/2")
 */
function parseNumeric(str) {
  if (!str) return null;
  const cleaned = str.replace(',', '.').trim();
  if (/^-?\d+(\.\d+)?$/.test(cleaned)) {
    return parseFloat(cleaned);
  }
  // Kasr sonlar uchun (masalan 1/2)
  const fractionMatch = cleaned.match(/^(-?\d+)\/(\d+)$/);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1]);
    const den = parseInt(fractionMatch[2]);
    if (den !== 0) return num / den;
  }
  return null;
}

function romanToInt(str) {
  if (!str) return null;
  const roman = String(str).toLowerCase();
  if (!/^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/.test(roman)) return null;
  const map = { i: 1, v: 5, x: 10 };
  let total = 0;
  for (let i = 0; i < roman.length; i += 1) {
    const cur = map[roman[i]];
    const next = map[roman[i + 1]] || 0;
    total += cur < next ? -cur : cur;
  }
  return total;
}

function parseOrdinalToken(token) {
  if (!token) return null;
  const clean = String(token).trim().toLowerCase();
  if (/^\d+$/.test(clean)) return parseInt(clean, 10);
  return romanToInt(clean);
}

/**
 * Bitta savolni foydalanuvchi javobi va to'g'ri (etalon) javobi asosida tekshirish
 * Qaytaradi: 0, 0.5 yoki 1 (Ball)
 */
function evaluateAnswer(userAns, correctAns) {
  const normUser = normalizeStr(userAns);
  const normCorrect = normalizeStr(correctAns);

  if (!normUser || !normCorrect) {
    return 0; 
  }

  // Matematik sonli javoblarni avval tekshiramiz (masalan: 1/2 va 0.5)
  const numUser = parseNumeric(userAns);
  const numCorrect = parseNumeric(correctAns);
  if (numCorrect !== null && numUser !== null) {
     if (Math.abs(numUser - numCorrect) < 0.0001) return 1;
     return 0;
  }
  if (numCorrect !== null) return 0; // Agar javob faqat son bo'lsa va foydalanuvchi so'z yozsa

  // Sana/yillar keltirilgan bo'lsa, fakt mosligini qat'iy tekshiramiz
  const userYears = extractYears(userAns);
  const correctYears = extractYears(correctAns);
  if (correctYears.length > 0 && userYears.length > 0) {
    const sameLength = correctYears.length === userYears.length;
    const sameOrder = sameLength && correctYears.every((y, idx) => y === userYears[idx]);
    if (!sameOrder) return 0;
  }

  // Agar ikkala javobda ham tartib/raqam (masalan I, II, III, 1, 2) bo'lsa va ular farq qilsa, darhol 0
  const numeralRegex = /\b(i|ii|iii|iv|v|vi|vii|viii|ix|x|\d+)\b/i;
  const userNum = (normUser.match(numeralRegex) || [null])[0];
  const correctNum = (normCorrect.match(numeralRegex) || [null])[0];
  if (userNum && correctNum) {
    const userOrdinal = parseOrdinalToken(userNum);
    const correctOrdinal = parseOrdinalToken(correctNum);
    if (userOrdinal !== null && correctOrdinal !== null && userOrdinal !== correctOrdinal) {
      return 0;
    }
    if ((userOrdinal === null || correctOrdinal === null) && userNum !== correctNum) {
      return 0;
    }
  }

  // 1. To'g'ridan to'g'ri bir xil
  if (normUser === normCorrect) {
    return 1;
  }

    // 2. Substring (KeyWord inclusions) Tekshiruv
  // "Alisher Navoiy" VS "Navoiy" kabi 
  if (normCorrect.includes(normUser) || normUser.includes(normCorrect)) {
    const threshold = normCorrect.length * 0.4;
    if (normUser.length >= threshold) {
      return (normUser.length >= normCorrect.length * 0.7) ? 1 : 0.5;
    }
  }

  // 3. Tokenizatsiya (Gap ichidan muhim so'zlarni xatolari bilan tekshirish)
  const userTokens = toSignificantTokens(userAns);
  const correctTokens = toSignificantTokens(correctAns);
  let significantMatchCount = 0;
  let significantMatchRatio = 0;
  if (correctTokens.length > 1) {
    let matchCount = 0;
    for (let ct of correctTokens) {
      for (let ut of userTokens) {
        if (fuzzyTokenEqual(ct, ut)) {
          matchCount++;
          break;
        }
      }
    }
    const matchRatio = matchCount / correctTokens.length;
    significantMatchCount = matchCount;
    significantMatchRatio = matchRatio;
    if (matchRatio === 1) return 1;
    if (matchRatio >= 0.5) return 0.5;
  }

  if (correctTokens.length === 1 && userTokens.length === 1) {
    if (!fuzzyTokenEqual(userTokens[0], correctTokens[0])) {
      return 0;
    }
  }

  if (correctTokens.length > 1 && userTokens.length > 0 && significantMatchCount === 0) {
    return 0;
  }

  // 4. To'liq so'zlar uchun Levenshteyn orqali Fuzzy Match (> 85% = 1, > 65% = 0.5)
  const maxLen = Math.max(normCorrect.length, normUser.length);
  const dist = levenshteinDistance(normCorrect, normUser);
  const similarity = (maxLen - dist) / maxLen;

  if (similarity >= 0.85) return 1;
  if (similarity >= 0.65) {
    if (correctTokens.length > 1 && significantMatchRatio < 0.5) return 0;
    return 0.5;
  }

  return 0; // Topilmadi
}

module.exports = {
  evaluateAnswer,
  levenshteinDistance,
  normalizeStr,
  parseNumeric
};
