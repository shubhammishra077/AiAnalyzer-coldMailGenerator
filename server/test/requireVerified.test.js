const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load, mockRes } = require('./helpers');

const { requireVerified } = load('middleware/requireVerified');

const run = (user) => {
  const res = mockRes();
  let nextCalled = false;
  requireVerified({ user }, res, () => { nextCalled = true; });
  return { res, nextCalled };
};

describe('requireVerified', () => {
  it('lets verified users through', () => assert.equal(run({ isVerified: true }).nextCalled, true));

  it('blocks unverified users with 403', () => {
    const { res, nextCalled } = run({ isVerified: false });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.needsVerification, true);
  });

  it('blocks when the flag is missing, truthy-but-not-true, or there is no user', () => {
    assert.equal(run({}).nextCalled, false);
    assert.equal(run({ isVerified: 'true' }).nextCalled, false);
    assert.equal(run(undefined).nextCalled, false);
  });
});
