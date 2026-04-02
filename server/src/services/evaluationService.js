const { evaluateAnswer } = require("../utils/evaluator");
const axios = require("axios");

/**
 * Ko'p ochiq javoblarni bitta massivda qabul qilib, Claude AI yoki mahalliy algoritm orqali baholash.
 */
async function checkAllAnswers(answersArray) {
  const scores = {};
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  for (const a of answersArray) {
    let score = 0;
    const localScore = evaluateAnswer(a.userAnswer || "", a.correctText || "");
    const localBinary = localScore >= 0.5 ? 1 : 0;

    // Claude 3 Haiku qisqa javoblar uchun; kalit bo'lmasa lokal evaluator ishlaydi
    if (anthropicKey && a.userAnswer && a.userAnswer.trim().length > 0) {
      try {
        const response = await axios.post("https://api.anthropic.com/v1/messages", {
          model: "claude-3-haiku-20240307",
          max_tokens: 10,
          messages: [
            { 
              role: "user", 
              content: `Vazifa: Foydalanuvchi javobini etalon javob bilan mazmunan solishtirib baholang.

Qoidalar:
1) Faqat quyidagi ikki qiymatdan birini qaytaring: 0 yoki 1.
2) Hech qanday izoh, matn, belgi, JSON yoki qo'shimcha so'z yozmang — faqat son.
3) 1 bering, agar javob mazmunan to'liq va mantiqan to'g'ri bo'lsa (sinonim/parafraz ruxsat).
4) Qisman to'g'ri javoblarda ham dichotomous baholash qoidasini qo'llang: asosiy faktlar yetarli bo'lsa 1, bo'lmasa 0.
5) 0 bering, agar javob noto'g'ri, mavzudan tashqari, yoki mantiqan xato bo'lsa.
6) Agar aniq fakt, raqam, sana, formula talab qilinsa va noto'g'ri bo'lsa, 0 bering.
7) Juda qisqa, mazmunsiz yoki taxminiy javobga 0 bering.
8) Imlo xatolari uchun pasaytirmang, agar ma'no aniq saqlangan bo'lsa.
9) So'z tartibi o'zgargan bo'lsa ham ma'no bir xil bo'lsa 1 bering (masalan: "Ali Vali" va "Vali Ali").
10) Ism/familiya tartibi almashishi, transliteratsiya va kichik yozuv farqlari xato emas (masalan: "Filip" va "Filipp").
11) Rim va arab raqamlari bir xil tartibni bildirsa teng deb oling (masalan: "II" = "2", "III" = "3").
12) Agar javob etalondagi asosiy obyekt/shaxsni to'g'ri ko'rsatsa va faqat yozilish/tartib farqi bo'lsa, 1 bering.
13) Sana/forma turlicha yozilgan bo'lsa ham bir xil faktni bildirsa to'g'ri deb oling (masalan: "1884-1888" va "1884-yildan 1888-yilgacha").
14) Bir nechta element so'ralgan savolda asosiy talab bajarilsa 1, aks holda 0 qaytaring.
15) Agar boshqa shaxs, boshqa sana yoki boshqa voqea yozilgan bo'lsa qat'iy 0 bering.

Qisqa misollar:
- Etalon: "Filipp II Avgust" | Javob: "Avgust Filipp 2" => 1
- Etalon: "Ali Vali" | Javob: "Vali Ali" => 1
- Etalon: "Kapetinglar" | Javob: "Kapitinglar" => 1
- Etalon: "1884-1888" | Javob: "1884-yildan 1888-yilgacha" => 1
- Etalon: "Xuttalon, Vaxsh, Chag'aniyon" | Javob: "Xuttalon, Vaxsh" => 0
- Etalon: "Filipp II Avgust" | Javob: "Filipp III Avgust" => 0

Etalon javob:
"${a.correctText}"

Foydalanuvchi javobi:
"${a.userAnswer}"

Natija (faqat bitta son):` 
            }
          ]
        }, {
          headers: {
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
          }
        });
        const aiText = (response?.data?.content?.[0]?.text || "").trim();
        const normalized = aiText.replace(',', '.');
        const match = normalized.match(/\b(0|1(?:\.0)?)\b/);
        const parsed = match ? Number(match[1]) : NaN;
        if (parsed === 0 || parsed === 1) {
          score = Math.max(parsed, localBinary);
        } else {
          score = localBinary;
        }
      } catch (err) {
        console.error("[Claude AI Evaluation] Error:", err.message);
        score = localBinary; // Fallback
      }
    } else {
      // Qisqa javoblar yoki API kaliti bo'lmaganda mahalliy algoritmdan foydalanamiz
      score = localBinary;
    }
    
    scores[a.id] = score;
  }

  return scores;
}

module.exports = { checkAllAnswers };