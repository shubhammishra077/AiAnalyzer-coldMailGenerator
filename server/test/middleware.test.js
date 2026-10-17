const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { mockLocal, mockPackage, load, mockRes, FakeUser, fakeJwt } = require('./helpers');

process.env.JWT_SECRET = 'test-secret';
mockLocal('models/User', FakeUser);
mockPackage('jsonwebtoken', fakeJwt);
const { protect } = load('middleware/authMiddleware');

const run = async (authorization) => {
  const req = { headers: authorization ? { authorization } : {} };
  const res = mockRes();
  let nextCalled = false;
  await protect(req, res, () => { nextCalled = true; });
  return { req, res, nextCalled };
};

beforeEach(() => FakeUser.reset());

describe('protect', () => {
  it('rejects requests without a token', async () => {
    const { res, nextCalled } = await run();
    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
  });

  it('rejects an invalid token', async () => {
    assert.equal((await run('Bearer garbage')).res.statusCode, 401);
  });

  it('returns 404 when the user no longer exists', async () => {
    assert.equal((await run('Bearer jwt:ghost:1')).res.statusCode, 404);
  });

  it('accepts a valid token and attaches the user', async () => {
    const user = await FakeUser.create({ name: 'Asha', email: 'a@example.com' });
    const { req, nextCalled } = await run(`Bearer ${fakeJwt.sign({ id: user._id })}`);
    assert.equal(nextCalled, true);
    assert.equal(req.user._id, user._id);
  });

  it('rejects tokens issued before a password change', async () => {
    const user = await FakeUser.create({ name: 'Asha', email: 'a@example.com' });
    user.passwordChangedAt = new Date();
    const oldToken = `jwt:${user._id}:${Math.floor(Date.now() / 1000) - 3600}`;
    const { res, nextCalled } = await run(`Bearer ${oldToken}`);
    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
  });

  it('accepts tokens issued after a password change', async () => {
    const user = await FakeUser.create({ name: 'Asha', email: 'a@example.com' });
    user.passwordChangedAt = new Date(Date.now() - 3600 * 1000);
    const { nextCalled } = await run(`Bearer ${fakeJwt.sign({ id: user._id })}`);
    assert.equal(nextCalled, true);
  });
});
