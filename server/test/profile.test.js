const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { mockLocal, load, mockRes, FakeUser } = require('./helpers');

mockLocal('models/User', FakeUser);
const { getProfile, updateProfile } = load('controllers/profileController');

let user;
beforeEach(async () => {
  FakeUser.reset();
  user = await FakeUser.create({ name: 'Asha', email: 'a@example.com' });
});

const update = async (body) => {
  const res = mockRes();
  await updateProfile({ user, body }, res);
  return res;
};

describe('updateProfile', () => {
  it('saves a valid profile and normalises skills', async () => {
    const res = await update({
      headline: '  Backend Engineer  ',
      yearsExperience: '3.5',
      skills: 'Node.js, MongoDB, node.js, , MongoDB',
      highlights: 'Cut latency by 60%',
      linkedinUrl: 'https://linkedin.com/in/asha',
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.profile.headline, 'Backend Engineer');
    assert.equal(res.body.profile.yearsExperience, 3.5);
    assert.deepEqual(res.body.profile.skills, ['Node.js', 'MongoDB', 'node.js']);
  });

  it('caps skills at 25 entries', async () => {
    const skills = Array.from({ length: 40 }, (_, i) => `skill${i}`);
    assert.equal((await update({ skills })).body.profile.skills.length, 25);
  });

  it('rejects out-of-range experience', async () => {
    assert.equal((await update({ yearsExperience: -1 })).statusCode, 400);
    assert.equal((await update({ yearsExperience: 99 })).statusCode, 400);
    assert.equal((await update({ yearsExperience: 'lots' })).statusCode, 400);
  });

  it('rejects non-http(s) URLs', async () => {
    assert.equal((await update({ githubUrl: 'javascript:alert(1)' })).statusCode, 400);
    assert.equal((await update({ portfolioUrl: 'not a url' })).statusCode, 400);
  });

  it('allows leaving optional fields empty', async () => {
    const res = await update({});
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.profile.skills, []);
  });

  it('truncates over-long text instead of storing it', async () => {
    const res = await update({ highlights: 'x'.repeat(5000) });
    assert.equal(res.body.profile.highlights.length, 1200);
  });
});

describe('getProfile', () => {
  it('returns name, email, Google-link flag and profile only', async () => {
    const res = mockRes();
    await getProfile({ user }, res);
    assert.deepEqual(Object.keys(res.body).sort(), ['email', 'googleLinked', 'name', 'profile']);
    assert.equal(res.body.googleLinked, false);
  });

  it('reports a linked Google account without exposing the Google id', async () => {
    const res = mockRes();
    await getProfile({ user: { ...user, googleId: 'g-123' } }, res);
    assert.equal(res.body.googleLinked, true);
    assert.doesNotMatch(JSON.stringify(res.body), /g-123/);
  });
});
