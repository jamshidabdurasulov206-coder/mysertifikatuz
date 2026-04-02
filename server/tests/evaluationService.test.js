jest.mock('axios', () => ({
  post: jest.fn()
}));

const axios = require('axios');
const { checkAllAnswers } = require('../src/services/evaluationService');

describe('checkAllAnswers', () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env.ANTHROPIC_API_KEY = originalKey;
  });

  test('uses local evaluator score when AI under-scores equivalent ordinal answer', async () => {
    axios.post.mockResolvedValue({
      data: {
        content: [{ text: '0' }]
      }
    });

    const result = await checkAllAnswers([
      {
        id: 1,
        userAnswer: 'Avgust Filipp 2',
        correctText: 'Filipp II Avgust'
      }
    ]);

    expect(result[1]).toBe(1);
  });

  test('maps partial semantic score to binary correct', async () => {
    axios.post.mockResolvedValue({
      data: {
        content: [{ text: '0.5' }]
      }
    });

    const result = await checkAllAnswers([
      {
        id: 2,
        userAnswer: 'Navoiy',
        correctText: 'Alisher Navoiy'
      }
    ]);

    expect(result[2]).toBe(1);
  });
});