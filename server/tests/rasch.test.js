const { calculateAllRaschStats } = require('../src/utils/rasch');

describe('Rasch Utility Logic', () => {
    test('calculateAllRaschStats should calculate Z and T scores correctly', async () => {
        // Mock pool to return empty theta scores (mu=0, sigma=1)
        const mockPool = {
            query: jest.fn().mockResolvedValue({
                rows: []
            })
        };

        const result = await calculateAllRaschStats(mockPool, 1.5, 80, 'Matematika');

        expect(result.z_score).toBeCloseTo(1.5, 2);
        expect(result.t_score).toBeCloseTo(65, 1);
        expect(result.standard_ball).toBeCloseTo(80, 1); // 80 cap or standard based on formula
        expect(result.level).toBeDefined();
    });

    test('It should throw if theta is NaN', async () => {
        const mockPool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
        await expect(calculateAllRaschStats(mockPool, NaN, 80, 'Fizika')).rejects.toThrow();
    });
});
