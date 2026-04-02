const { evaluateAnswer } = require('../src/utils/evaluator');

describe('history calibration dataset', () => {
  test('accepts exact answers from sample set', () => {
    const exactPairs = [
      ['Filipp II Avgust', 'Filipp II Avgust'],
      ['Kapetinglar (987-1328)', 'Kapetinglar (987-1328)'],
      ['Qirim urushi', 'Qirim urushi'],
      ['Abdulmajid (1839-1861)', 'Abdulmajid (1839-1861)'],
      ["Pomir chegara qo'shinlarining yordami bilan", "Pomir chegara qo'shinlarining yordami bilan"],
      ['Rozenbax (1884-1888)', 'Rozenbax (1884-1888)'],
      ['Daues rejasi', 'Daues rejasi'],
      ['Londonda', 'Londonda'],
      ["Horun Bug'roxon", "Horun Bug'roxon"],
      ["Xuttalon, Vaxsh va Chag'aniyonni", "Xuttalon, Vaxsh va Chag'aniyonni"],
      ['Aleksandr I', 'Aleksandr I'],
      ['Bagrationlar sulolasini', 'Bagrationlar sulolasini'],
      ["Marg'ilonga", "Marg'ilonga"],
      ["To'raqo'rg'onga", "To'raqo'rg'onga"],
      ['Kamol Turg‘unov', 'Kamol Turg‘unov'],
      ["Sharqlik o'n bir qahramon tepaligi", "Sharqlik o'n bir qahramon tepaligi"],
      ['Ziyod ibn solih', 'Ziyod ibn solih'],
      ['Abul Abbos Saffoh', 'Abul Abbos Saffoh'],
      ["Yangiariq arig'i", "Yangiariq arig'i"],
      ["Ulug'nahr arig'i", "Ulug'nahr arig'i"]
    ];

    for (const [userAnswer, correctAnswer] of exactPairs) {
      expect(evaluateAnswer(userAnswer, correctAnswer)).toBe(1);
    }
  });

  test('accepts tolerant semantic and orthographic variants', () => {
    const tolerantPairs = [
      ['Filipp Avgust', 'Filipp II Avgust'],
      ['Fransiya qiroli Filipp', 'Filipp II Avgust'],
      ['Bugroxon Horun', "Horun Bug'roxon"],
      ['Kapitinglar', 'Kapetinglar'],
      ['Bagratyonlar sulolasi', 'Bagrationlar sulolasi'],
      ['1884-yildan 1888-yilgacha', '1884-1888']
    ];

    for (const [userAnswer, correctAnswer] of tolerantPairs) {
      expect(evaluateAnswer(userAnswer, correctAnswer)).toBeGreaterThanOrEqual(0.5);
    }
  });

  test('returns partial for combined answers with missing entity', () => {
    expect(evaluateAnswer('Xuttalon, Vaxsh', "Xuttalon, Vaxsh va Chag'aniyon")).toBe(0.5);
  });

  test('rejects factual mismatch', () => {
    expect(evaluateAnswer('Marshall rejasi', 'Daues rejasi')).toBe(0);
  });
});
