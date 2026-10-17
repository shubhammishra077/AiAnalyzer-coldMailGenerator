const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { mockLocal, mockPackage, load, mockRes, FakeUser } = require('./helpers');

process.env.GOOGLE_CLIENT_ID = 'client-123.apps.googleusercontent.com';

mockPackage('google-auth-library', {
  OAuth2Client: class {
    async verifyIdToken({ idToken }) {
      if (idToken.startsWith('BAD')) throw new Error('bad signature');
      return { getPayload: () => JSON.parse(idToken) };
    }
  },
});

const deletions = [];
const fakeCollection = (name) => ({ deleteMany: async (q) => { deletions.push({ name, q }); return {}; } });
mockLocal('models/User', FakeUser);
mockLocal('models/EmailHistory', fakeCollection('emails'));
mockLocal('models/Resume', fakeCollection('resume'));
mockLocal('models/ResumeAnalysis', fakeCollection('analyses'));
mockLocal('models/MonthlyUsage', fakeCollection('usage'));
mockPackage('axios', { post: async () => ({ data: {} }) });

const { deleteAccount } = load('controllers/accountController');

const credFor = (sub, over = {}) =>
  JSON.stringify({ sub, email: 'asha@example.com', email_verified: true, ...over }).padEnd(40, ' ');

let asha, other;
const del = async (body, user = asha) => {
  const res = mockRes();
  await deleteAccount({ user: { _id: user._id }, body }, res);
  return res;
};

beforeEach(async () => {
  FakeUser.reset();
  deletions.length = 0;
  asha = await FakeUser.create({ name: 'Asha', email: 'asha@example.com', password: 'correct-horse-1', isVerified: true });
  other = await FakeUser.create({ name: 'Other', email: 'other@example.com', password: 'other-pass-123', isVerified: true });
});

describe('deleteAccount: password path', () => {
  it('deletes the user and all their data', async () => {
    const res = await del({ password: 'correct-horse-1', confirmEmail: 'asha@example.com' });
    assert.equal(res.statusCode, 200);
    assert.equal(await FakeUser.findOne({ email: 'asha@example.com' }), null);
    assert.deepEqual(deletions.map((d) => d.name).sort(), ['analyses', 'emails', 'resume', 'usage']);
  });

  it('only touches this user: other accounts and other users\' data are untouched', async () => {
    await del({ password: 'correct-horse-1', confirmEmail: 'asha@example.com' });
    assert.ok(await FakeUser.findOne({ email: 'other@example.com' }));
    for (const d of deletions) assert.deepEqual(d.q, { userId: asha._id });
  });

  it('accepts the confirmation email in any case or with spaces', async () => {
    const res = await del({ password: 'correct-horse-1', confirmEmail: '  ASHA@Example.com ' });
    assert.equal(res.statusCode, 200);
  });

  it('refuses a wrong password with 403 (not 401) and deletes nothing', async () => {
    const res = await del({ password: 'wrong-password', confirmEmail: 'asha@example.com' });
    assert.equal(res.statusCode, 403);
    assert.ok(await FakeUser.findOne({ email: 'asha@example.com' }));
    assert.equal(deletions.length, 0);
  });

  it('refuses when the typed email does not match, even with the right password', async () => {
    const res = await del({ password: 'correct-horse-1', confirmEmail: 'other@example.com' });
    assert.equal(res.statusCode, 400);
    assert.ok(await FakeUser.findOne({ email: 'asha@example.com' }));
    assert.equal(deletions.length, 0);
  });
});

describe('deleteAccount: input validation', () => {
  it('requires confirmEmail and some proof of identity', async () => {
    assert.equal((await del({ password: 'correct-horse-1' })).statusCode, 400);
    assert.equal((await del({ confirmEmail: 'asha@example.com' })).statusCode, 400);
    assert.equal((await del({})).statusCode, 400);
  });

  it('rejects non-string (operator-injection shaped) inputs', async () => {
    assert.equal((await del({ password: { $ne: null }, confirmEmail: 'asha@example.com' })).statusCode, 400);
    assert.equal((await del({ credential: { $ne: null }, confirmEmail: 'asha@example.com' })).statusCode, 400);
    assert.equal((await del({ password: 'x', confirmEmail: { $ne: '' } })).statusCode, 400);
    assert.equal(deletions.length, 0);
  });

  it('returns 404 if the account no longer exists', async () => {
    const res = mockRes();
    await deleteAccount({ user: { _id: 'ghost' }, body: { password: 'x', confirmEmail: 'a@b.co' } }, res);
    assert.equal(res.statusCode, 404);
  });
});

describe('deleteAccount: Google path', () => {
  beforeEach(async () => {
    asha.googleId = 'google-sub-asha';
    // A Google-created account: nobody knows its password
    asha.password = 'f'.repeat(64);
  });

  it('accepts a fresh Google token for the SAME linked identity', async () => {
    const res = await del({ credential: credFor('google-sub-asha'), confirmEmail: 'asha@example.com' });
    assert.equal(res.statusCode, 200);
    assert.equal(await FakeUser.findOne({ email: 'asha@example.com' }), null);
  });

  it('rejects a valid Google token that belongs to a different Google account', async () => {
    const res = await del({ credential: credFor('someone-elses-sub'), confirmEmail: 'asha@example.com' });
    assert.equal(res.statusCode, 403);
    assert.ok(await FakeUser.findOne({ email: 'asha@example.com' }));
    assert.equal(deletions.length, 0);
  });

  it('rejects Google tokens for accounts that have no linked Google identity', async () => {
    const res = await del({ credential: credFor('google-sub-asha'), confirmEmail: 'other@example.com' }, other);
    assert.equal(res.statusCode, 403);
    assert.ok(await FakeUser.findOne({ email: 'other@example.com' }));
  });

  it('rejects tokens Google would not verify', async () => {
    const res = await del({ credential: 'BAD-token-that-fails-verification', confirmEmail: 'asha@example.com' });
    assert.equal(res.statusCode, 401);
    assert.equal(deletions.length, 0);
  });

  it('does not let the unknown random password of a Google-created account be guessed in', async () => {
    const res = await del({ password: 'anything-guessable', confirmEmail: 'asha@example.com' });
    assert.equal(res.statusCode, 403);
  });

  it('a wrong password does not block a valid Google credential sent together', async () => {
    const res = await del({ password: 'nope', credential: credFor('google-sub-asha'), confirmEmail: 'asha@example.com' });
    assert.equal(res.statusCode, 200);
  });
});
