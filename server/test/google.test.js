const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { mockLocal, mockPackage, load, mockRes, FakeUser, fakeJwt } = require('./helpers');

process.env.JWT_SECRET = 'test-secret';
process.env.GOOGLE_CLIENT_ID = 'client-123.apps.googleusercontent.com';

// Fake Google verifier: the "credential" is a JSON string we control from the test.
const verifyCalls = [];
mockPackage('google-auth-library', {
  OAuth2Client: class {
    async verifyIdToken({ idToken, audience }) {
      verifyCalls.push({ idToken, audience });
      if (idToken.startsWith('BAD')) throw new Error('Invalid token signature');
      const payload = JSON.parse(idToken);
      return { getPayload: () => payload };
    }
  },
});
mockLocal('models/User', FakeUser);
mockLocal('utils/emailService', async () => ({}));
mockPackage('jsonwebtoken', fakeJwt);

const auth = load('controllers/authController');

const goodPayload = (over = {}) => ({
  sub: 'google-sub-1', email: 'Asha@Example.com', email_verified: true,
  name: 'Asha Rao', picture: 'https://lh3.googleusercontent.com/a/photo', ...over,
});
const signIn = async (payload) => {
  const res = mockRes();
  const credential = typeof payload === 'string' ? payload : JSON.stringify(payload);
  await auth.googleLogin({ body: { credential: credential.padEnd(30, ' ') } }, res);
  return res;
};

beforeEach(() => { FakeUser.reset(); verifyCalls.length = 0; process.env.GOOGLE_CLIENT_ID = 'client-123.apps.googleusercontent.com'; });

describe('googleLogin', () => {
  it('creates a verified account on first sign-in and returns a token', async () => {
    const res = await signIn(goodPayload());
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.email, 'asha@example.com');
    const user = await FakeUser.findOne({ email: 'asha@example.com' });
    assert.equal(user.isVerified, true);
    assert.equal(user.googleId, 'google-sub-1');
    assert.equal(user.avatarUrl, 'https://lh3.googleusercontent.com/a/photo');
  });

  it('verifies the token against OUR client id (audience check)', async () => {
    await signIn(goodPayload());
    assert.equal(verifyCalls[0].audience, 'client-123.apps.googleusercontent.com');
  });

  it('gives Google-created accounts an unguessable password', async () => {
    await signIn(goodPayload());
    const user = await FakeUser.findOne({ email: 'asha@example.com' });
    assert.match(user.password, /^[a-f0-9]{64}$/);
  });

  it('signs the same Google user in again without creating a duplicate', async () => {
    await signIn(goodPayload());
    const again = await signIn(goodPayload());
    assert.equal(again.statusCode, 200);
    assert.equal(FakeUser.store.size, 1);
  });

  it('links Google to an existing verified local account with the same email', async () => {
    const local = await FakeUser.create({ name: 'Asha', email: 'asha@example.com', password: 'my-password-1', isVerified: true });
    const res = await signIn(goodPayload());
    assert.equal(res.statusCode, 200);
    assert.equal(FakeUser.store.size, 1);
    assert.equal(local.googleId, 'google-sub-1');
    assert.equal(local.password, 'my-password-1'); // verified owner keeps their password
  });

  it('wipes the password of a pre-registered UNVERIFIED account (pre-hijack defence)', async () => {
    const squatter = await FakeUser.create({
      name: 'Attacker', email: 'asha@example.com', password: 'attacker-knows-this',
      isVerified: false, otp: 'hash', otpExpiry: new Date(Date.now() + 1000),
    });
    const res = await signIn(goodPayload());
    assert.equal(res.statusCode, 200);
    assert.equal(squatter.isVerified, true);
    assert.notEqual(squatter.password, 'attacker-knows-this');
    assert.equal(squatter.otp, undefined);
  });

  it('refuses an email already linked to a different Google account', async () => {
    await FakeUser.create({ name: 'A', email: 'asha@example.com', password: 'x', isVerified: true, googleId: 'someone-else' });
    assert.equal((await signIn(goodPayload())).statusCode, 409);
  });

  it('rejects tokens Google would not verify', async () => {
    assert.equal((await signIn('BAD-token-that-fails-verification')).statusCode, 401);
    assert.equal(FakeUser.store.size, 0);
  });

  it('rejects an unverified Google email', async () => {
    assert.equal((await signIn(goodPayload({ email_verified: false }))).statusCode, 401);
    assert.equal(FakeUser.store.size, 0);
  });

  it('rejects payloads missing sub or email', async () => {
    assert.equal((await signIn(goodPayload({ sub: undefined }))).statusCode, 401);
    assert.equal((await signIn(goodPayload({ email: undefined }))).statusCode, 401);
  });

  it('rejects missing or malformed credentials without calling Google', async () => {
    for (const credential of [undefined, 123, 'short', 'x'.repeat(5000), { $ne: 1 }]) {
      const res = mockRes();
      await auth.googleLogin({ body: { credential } }, res);
      assert.equal(res.statusCode, 400);
    }
    assert.equal(verifyCalls.length, 0);
  });

  it('ignores non-https avatar URLs', async () => {
    await signIn(goodPayload({ picture: 'javascript:alert(1)' }));
    assert.equal((await FakeUser.findOne({ email: 'asha@example.com' })).avatarUrl, '');
  });

  it('returns 503 when GOOGLE_CLIENT_ID is not configured', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    assert.equal((await signIn(goodPayload())).statusCode, 503);
  });
});
