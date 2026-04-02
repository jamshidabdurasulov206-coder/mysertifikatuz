const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

exports.parseTest = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length < 10) {
      return res.status(400).json({ error: "Tahlil qilish uchun matn yetarli emas" });
    }

    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const chunks = text.match(/[\s\S]{1,7000}/g) || [];
    let allQuestions = [];

    for (const [index, chunk] of chunks.entries()) {
      // PROMPT YANGILANDI (Qoidalarni kuchaytirdik)
      const prompt = `
  Vazifa: Quyidagi matndan test savollarini AJRATIB OL. MATNDA QANCHA SAVOL BO'LSA, HAMMASINI AJRAT! Dastlabki 35 ta savolni "MULTIPLE_CHOICE" (variantli) qilib, options massiviga variantlarni joylashtir. Qolgan barcha savollarni "OPEN_ENDED" (inputli) qilib, options massivini bo'sh qoldir. Hech bir savolni tashlab yuborma. Har bir savol uchun quyidagi JSON formatini qat'iy saqla:
  {
    "type": "MULTIPLE_CHOICE" yoki "OPEN_ENDED",
    "question_text": "Savol matni...",
    "options": [variantlar yoki bo'sh massiv],
    "correct_option": variantli savollar uchun to'g'ri javob indeksi, ochiq savollar uchun null,
    "correct_answer_text": ochiq savollar uchun to'g'ri javob (agar ma'lum bo'lsa), variantli uchun null
  }

  Faqat JSON massivini qaytar:
  {
    "questions": [ ... ]
  }
    enga berilgan tarixiy matnlarni tahlil qilishda quyidagi qoidalarga amal qil:
1. Har bir gapni oxirigacha o'qi, hech bir ma'lumotni tashlab ketma.
2. Har bir rim raqami bilan kelgan ma'lumotni alohida element deb hisobla.
3. Agar matn ichida javob varianti (A, B, C, D) bo'lsa, ularni solishtirib, mantiqiy xulosani chiqar.
4. "Xato" yoki "To'g'ri" degan kalit so'zlarga qat'iy e'tibor ber.

  Matn: ${chunk}`;

      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let aiText = response.text().trim();

        aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const parsedChunk = JSON.parse(jsonMatch[0]);
          if (parsedChunk.questions && Array.isArray(parsedChunk.questions)) {
            allQuestions.push(...parsedChunk.questions);
          }
        }
        
        if (chunks.length > 1) await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error(`${index + 1}-bo'lakda xato:`, err.message);
      }
    }

    res.json({ 
      success: true, 
      questions: allQuestions,
      count: allQuestions.length 
    });

  } catch (error) {
    console.error("AI Controller xatosi:", error.message);
    res.status(500).json({ error: "AI tahlilida xatolik" });
  }
};

const pdfParse = require("pdf-parse");

exports.parsePdfTest = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF fayl yuklanmadi" });
    }

    const dataBuffer = req.file.buffer;
    const data = await pdfParse(dataBuffer);
    
    if (!data.text || data.text.trim().length < 10) {
      return res.status(400).json({ error: "PDF dan matn o'qib bo'lmadi" });
    }

    // Call the same logic, passing the extracted text as if it came from the body
    req.body.text = data.text;
    await exports.parseTest(req, res);
  } catch (error) {
    console.error("PDF Parse xatosi:", error.message);
    res.status(500).json({ error: "PDF faylni o'qishda xatolik" });
  }
};