const authMiddleware = require('../src/middlewares/auth.middleware');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('auth.middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jwt.verify.mockReset();
  });

  test('returns 401 when no token', () => {
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when token invalid', () => {
    req.headers.authorization = 'Bearer invalid';
    jwt.verify.mockImplementation(() => { throw new Error('invalid'); });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('attaches decoded user and calls next on success', () => {
    req.headers.authorization = 'Bearer token123';
    const decoded = { id: 1, email: 'a@b.com', role: 'user' };
    jwt.verify.mockReturnValue(decoded);

    authMiddleware(req, res, next);

    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
