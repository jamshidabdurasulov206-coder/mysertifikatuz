const isAdmin = require('../src/middlewares/isAdmin.middleware');

describe('isAdmin.middleware', () => {
  let req, res, next;

  beforeEach(() => {
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('allows admin role (case-insensitive)', () => {
    req = { user: { role: 'Admin' } };
    isAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('blocks non-admin and returns 403', () => {
    req = { user: { role: 'user' } };
    isAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Admin rights required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('blocks when user missing', () => {
    req = {};
    isAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Admin rights required' });
  });
});
