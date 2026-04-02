const { calculateStandardBall, convertWritingScore, calculateLevel } = require('./rasch');

describe('Rasch utils', () => {
  test('calculateStandardBall returns 100 when tScore >= 65', () => {
    expect(calculateStandardBall(70, 'Matematika (Mutaxassislik 1)')).toBe(100);
    expect(calculateStandardBall(65, 'Fizika (2-fan)')).toBe(100);
    expect(calculateStandardBall(65, 'Tarix')).toBe(100);
  });

  test('calculateStandardBall returns 0 for failing tScore', () => {
    expect(calculateStandardBall(45, 'Matematika (Mutaxassislik 1)')).toBe(0);
  });

  test('convertWritingScore applies formula and bounds', () => {
    expect(convertWritingScore(24)).toBe(75);
    expect(convertWritingScore(12)).toBe(51);
    expect(convertWritingScore(0)).toBe(27);
  });

  test('calculateLevel maps T-score ranges correctly', () => {
    expect(calculateLevel(70)).toBe('A+');
    expect(calculateLevel(65)).toBe('A');
    expect(calculateLevel(62)).toBe('B+');
    expect(calculateLevel(55)).toBe('B');
    expect(calculateLevel(50)).toBe('C+');
    expect(calculateLevel(46)).toBe('C');
    expect(calculateLevel(45)).toBe('FAIL');
  });
});
