const attemptService = require('../src/services/attempt.service');
const testController = require('../src/controllers/test.controller');
const pool = require('../src/config/db');

jest.mock('../src/services/attempt.service');
jest.mock('../src/config/db', () => ({ query: jest.fn() }));

describe('test.controller startSession', () => {
  const makeRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const makeReq = (userId = 1, testId = 2) => ({
    params: { id: testId },
    user: { id: userId }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 409 if attempt already exists', async () => {
    attemptService.findAttemptByUserAndTest.mockResolvedValue({ id: 10 });
    const req = makeReq();
    const res = makeRes();

    await testController.startSession(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: "Siz avval bu testga qatnashgansiz." });
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('creates session when no attempt and no active session', async () => {
    attemptService.findAttemptByUserAndTest.mockResolvedValue(null);
    // First query: active session check -> empty
    // Second query: insert -> returns new session
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 5, user_id: 1, test_id: 2 }] });

    const req = makeReq();
    const res = makeRes();

    await testController.startSession(req, res);

    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: "Sessiya yaratildi", session: { id: 5, user_id: 1, test_id: 2 } });
  });
});
