const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { mockLocal, mockPackage, load, mockRes, FakeUser, fakeJwt } = require('./helpers');

process.env.JWT_SECRET = 'test-secret';
process.env.FRONTEND_URL = 'https://app.example.com';

const sent = [];
mockLocal('models/User', FakeUser);
mockLocal('utils/emailService', async (opts) => { sent.push(opts); return { success: true }; });
mockPackage('jsonwebtoken', fakeJwt);
mockPackage('google-auth-library', { OAuth2Client: class {} });

const auth = load('controllers/authController');

const call = async (handler, body) => {
  const res = mockRes();
  await handler({ body }, res);
  return res;
};
const lastOtp = () => sent[sent.length - 1].message.match(/(\d{6})/)[1];
const lastResetToken = () => sent[sent.length - 1].message.match(/token=([a-f0-9]{64})/)[1];

const register = (overrides = {}) =>
  call(auth.registerUser, { name: 'Asha Rao', email: 'asha@example.com', password: 'password123', ...overrides });

const verifiedUser = async (extra = {}) =>
  FakeUser.create({ name: 'Asha', email: 'asha@example.com', password: 'password123', isVerified: true, ...extra });

beforeEach(() => { FakeUser.reset(); sent.length = 0; });

describe('register', () => {
  it('rejects bad input', async () => {
    assert.equal((await register({ password: 'short' })).statusCode, 400);
    assert.equal((await register({ email: 'not-an-email' })).statusCode, 400);
    assert.equal((await register({ name: 'A' })).statusCode, 400);
    assert.equal((await register({ email: { $ne: null } })).statusCode, 400); // NoSQL-injection shaped input
  });

  it('creates the user, emails a 6-digit OTP and stores only a hash of it', async () => {
    const res = await register();
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.emailSent, true);
    const otp = lastOtp();
    const user = await FakeUser.findOne({ email: 'asha@example.com' });
    assert.notEqual(user.otp, otp);
    assert.match(user.otp, /^[a-f0-9]{64}$/);
    assert.equal(user.isVerified, false);
  });

  it('blocks an already verified email', async () => {
    await verifiedUser();
    assert.equal((await register()).statusCode, 400);
  });

  it('lets an unverified user restart signup, but respects the cooldown', async () => {
    await register();
    assert.equal((await register()).statusCode, 429);
    const user = await FakeUser.findOne({ email: 'asha@example.com' });
    user.otpLastSentAt = new Date(Date.now() - 61000);
    assert.equal((await register()).statusCode, 201);
  });

  it('reports when the OTP email could not be sent', async () => {
    mockLocal('utils/emailService', async () => { throw new Error('smtp down'); });
    const failing = load('controllers/authController');
    const res = await call(failing.registerUser, { name: 'Asha', email: 'x@example.com', password: 'password123' });
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.emailSent, false);
    mockLocal('utils/emailService', async (opts) => { sent.push(opts); return {}; });
  });
});

describe('verifyOTP', () => {
  let userId;
  beforeEach(async () => { userId = (await register()).body.userId; });

  it('verifies with the right code and returns a token', async () => {
    const res = await call(auth.verifyOTP, { userId, otp: lastOtp() });
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.token);
    assert.equal((await FakeUser.findById(userId).select()).isVerified, true);
  });

  it('counts wrong attempts and locks after 5, even for the right code', async () => {
    const good = lastOtp();
    const wrong = good === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) {
      assert.equal((await call(auth.verifyOTP, { userId, otp: wrong })).statusCode, 400);
    }
    assert.equal((await call(auth.verifyOTP, { userId, otp: good })).statusCode, 429);
  });

  it('rejects an expired OTP', async () => {
    const user = await FakeUser.findById(userId).select();
    user.otpExpiry = new Date(Date.now() - 1000);
    assert.equal((await call(auth.verifyOTP, { userId, otp: lastOtp() })).statusCode, 400);
  });

  it('rejects malformed OTPs', async () => {
    assert.equal((await call(auth.verifyOTP, { userId, otp: '12ab56' })).statusCode, 400);
    assert.equal((await call(auth.verifyOTP, { userId, otp: 123456 })).statusCode, 400);
  });
});

describe('resendOTP', () => {
  it('enforces the cooldown, then issues a new code that invalidates the old one', async () => {
    const { userId } = (await register()).body;
    const first = lastOtp();
    const blocked = await call(auth.resendOTP, { userId });
    assert.equal(blocked.statusCode, 429);
    assert.ok(blocked.body.retryAfterSeconds > 0);

    (await FakeUser.findById(userId).select()).otpLastSentAt = new Date(Date.now() - 61000);
    assert.equal((await call(auth.resendOTP, { userId })).statusCode, 200);
    const second = lastOtp();
    if (second !== first) {
      assert.equal((await call(auth.verifyOTP, { userId, otp: first })).statusCode, 400);
    }
    assert.equal((await call(auth.verifyOTP, { userId, otp: second })).statusCode, 200);
  });
});

describe('login', () => {
  it('logs in a verified user', async () => {
    await verifiedUser();
    const res = await call(auth.loginUser, { email: 'ASHA@example.com', password: 'password123' });
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.token);
  });

  it('gives the same error for unknown email and wrong password', async () => {
    await verifiedUser();
    const a = await call(auth.loginUser, { email: 'nobody@example.com', password: 'password123' });
    const b = await call(auth.loginUser, { email: 'asha@example.com', password: 'wrong-password' });
    assert.equal(a.statusCode, 401);
    assert.deepEqual(a.body, b.body);
  });

  it('only reveals "unverified" after the password was correct', async () => {
    await FakeUser.create({ email: 'new@example.com', name: 'New', password: 'password123' });
    const wrong = await call(auth.loginUser, { email: 'new@example.com', password: 'nope-nope' });
    assert.equal(wrong.statusCode, 401);
    const right = await call(auth.loginUser, { email: 'new@example.com', password: 'password123' });
    assert.equal(right.statusCode, 403);
    assert.equal(right.body.needsVerification, true);
  });
});

describe('forgotPassword', () => {
  it('answers identically for unknown and unverified accounts and sends nothing', async () => {
    await FakeUser.create({ email: 'new@example.com', name: 'New', password: 'password123' });
    const unknown = await call(auth.forgotPassword, { email: 'ghost@example.com' });
    const unverified = await call(auth.forgotPassword, { email: 'new@example.com' });
    assert.equal(unknown.statusCode, 200);
    assert.deepEqual(unknown.body, unverified.body);
    assert.equal(sent.length, 0);
  });

  it('emails a reset link and stores only the token hash', async () => {
    const user = await verifiedUser();
    const res = await call(auth.forgotPassword, { email: 'asha@example.com' });
    assert.equal(res.statusCode, 200);
    assert.equal(sent.length, 1);
    assert.match(sent[0].message, /^.*https:\/\/app\.example\.com\/reset-password\?token=/s);
    const token = lastResetToken();
    assert.notEqual(user.resetPasswordToken, token);
    assert.match(user.resetPasswordToken, /^[a-f0-9]{64}$/);
    assert.ok(user.resetPasswordExpiry > new Date());
  });

  it('does not send a second email inside the cooldown', async () => {
    await verifiedUser();
    await call(auth.forgotPassword, { email: 'asha@example.com' });
    await call(auth.forgotPassword, { email: 'asha@example.com' });
    assert.equal(sent.length, 1);
  });

  it('rejects malformed emails', async () => {
    assert.equal((await call(auth.forgotPassword, { email: 'nope' })).statusCode, 400);
    assert.equal((await call(auth.forgotPassword, {})).statusCode, 400);
  });
});

describe('resetPassword', () => {
  const requestToken = async () => {
    await call(auth.forgotPassword, { email: 'asha@example.com' });
    return lastResetToken();
  };

  it('sets the new password, clears the token and records the change time', async () => {
    const user = await verifiedUser();
    const token = await requestToken();
    const res = await call(auth.resetPassword, { token, password: 'brand-new-pass' });
    assert.equal(res.statusCode, 200);
    assert.equal(user.password, 'brand-new-pass');
    assert.equal(user.resetPasswordToken, undefined);
    assert.ok(user.passwordChangedAt instanceof Date);
  });

  it('works only once', async () => {
    await verifiedUser();
    const token = await requestToken();
    await call(auth.resetPassword, { token, password: 'brand-new-pass' });
    assert.equal((await call(auth.resetPassword, { token, password: 'another-pass-1' })).statusCode, 400);
  });

  it('rejects expired, unknown and malformed tokens', async () => {
    const user = await verifiedUser();
    const token = await requestToken();
    user.resetPasswordExpiry = new Date(Date.now() - 1000);
    assert.equal((await call(auth.resetPassword, { token, password: 'brand-new-pass' })).statusCode, 400);
    assert.equal((await call(auth.resetPassword, { token: 'a'.repeat(64), password: 'brand-new-pass' })).statusCode, 400);
    assert.equal((await call(auth.resetPassword, { token: { $ne: null }, password: 'brand-new-pass' })).statusCode, 400);
  });

  it('enforces password length', async () => {
    await verifiedUser();
    const token = await requestToken();
    assert.equal((await call(auth.resetPassword, { token, password: 'short' })).statusCode, 400);
    assert.equal((await call(auth.resetPassword, { token, password: 'x'.repeat(129) })).statusCode, 400);
  });
});
