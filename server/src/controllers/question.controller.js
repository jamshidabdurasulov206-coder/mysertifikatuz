const questionService = require("../services/question.service");

exports.createQuestion = async (req, res) => {
  try {
    // Required fields basic validation
    const { test_id, question_text, options, correct_option } = req.body;

    if (!test_id || !question_text || options == null || correct_option == null) {
      return res.status(400).json({
        success: false,
        message: "test_id, question_text, options va correct_option maydonlari to'ldirilishi shart"
      });
    }

    let parsedOptions = options;
    if (typeof options === 'string') {
      try {
        parsedOptions = JSON.parse(options);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "options maydoni to'g'ri JSON formatida bo'lishi kerak"
        });
      }
    }

    if (!Array.isArray(parsedOptions) && typeof parsedOptions !== 'object') {
      return res.status(400).json({
        success: false,
        message: "options massiv yoki JSON ob'ekt bo'lishi kerak"
      });
    }

    const questionData = {
      test_id,
      question_text,
      options: parsedOptions,
      correct_option,
      difficulty_level: 1.0
    };

    const question = await questionService.createQuestion(questionData);
    
    res.status(201).json({
      success: true,
      data: question
    });
  } catch (err) {
    console.error("Savol yaratishda xato:", err.message);
    res.status(400).json({ 
      success: false, 
      message: "Savol qo'shilmadi: " + err.message 
    });
  }
};

exports.getQuestionsByTest = async (req, res) => {
  try {
    let questions = await questionService.getQuestionsByTest(req.params.testId);
    // Remove correct_answer_text from each question before sending to frontend
    questions = questions.map(q => {
      const { correct_answer_text, ...rest } = q;
      return rest;
    });
    res.json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Ma'lumotlarni yuklashda xato: " + err.message 
    });
  }
};