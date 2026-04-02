const { evaluateAnswer } = require('../src/utils/evaluator');

describe('evaluateAnswer', () => {
  test('treats equivalent numeric forms as correct', () => {
    expect(evaluateAnswer('1/2', '0.5')).toBe(1);
    expect(evaluateAnswer('15.0', '15')).toBe(1);
  });

  test('rejects different sequence numerals', () => {
    expect(evaluateAnswer('ii', 'iii')).toBe(0);
  });

  test('returns partial score for close textual match', () => {
    expect(evaluateAnswer('Navoiy', 'Alisher Navoiy')).toBe(0.5);
  });

  test('treats roman and arabic ordinals as equivalent in text', () => {
    expect(evaluateAnswer('Avgust Filip 2', 'Filip II Avgust')).toBe(1);
  });

  test('keeps different ordinals incorrect in text', () => {
    expect(evaluateAnswer('Filip III Avgust', 'Filip II Avgust')).toBe(0);
  });

  test('accepts minor spelling variations', () => {
    expect(evaluateAnswer('Kapitinglar', 'Kapetinglar')).toBe(1);
  });

  test('accepts apostrophe-less variants', () => {
    expect(evaluateAnswer('Qoshini', "Qo'shini")).toBe(1);
    expect(evaluateAnswer('galaba', "g'alaba")).toBe(1);
  });

  test('accepts equivalent year range formats', () => {
    expect(evaluateAnswer('1884-yildan 1888-yilgacha', '1884-1888')).toBe(1);
  });

  test('rejects mismatched years as factual error', () => {
    expect(evaluateAnswer('1884-yildan 1889-yilgacha', '1884-1888')).toBe(0);
  });

  test('returns partial for combined-answer partial match', () => {
    expect(evaluateAnswer('Xuttalon Vaxsh', "Xuttalon, Vaxsh va Chag'aniyon")).toBe(0.5);
  });

  test('rejects different factual entities with similar generic suffix', () => {
    expect(evaluateAnswer('Marshall rejasi', 'Daues rejasi')).toBe(0);
  });

  test('accepts semantically close military border-force wording as partial', () => {
    expect(evaluateAnswer('pomir xarbiy chegarachilari', "Pomir chegara qo'shinlarining yordami bilan")).toBeGreaterThanOrEqual(0.5);
  });
});
