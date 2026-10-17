const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { mockLocal, load, mockRes } = require('./helpers');

const DAY = 24 * 60 * 60 * 1000;
const state = { emails: [], analyses: [], resume: null };

// Minimal query matcher: equality, $in, $gte, $lte
const matchesQuery = (doc, q) =>
  Object.entries(q).every(([key, cond]) => {
    const v = doc[key];
    if (cond && typeof cond === 'object' && !(cond instanceof Date)) {
      if ('$in' in cond) return cond.$in.includes(v);
      if ('$gte' in cond) return v >= cond.$gte;
      if ('$lte' in cond) return v !== null && v !== undefined && v <= cond.$lte;
      return false;
    }
    return v === cond;
  });

const listChain = (arr) => {
  let out = arr.slice();
  const api = {
    select: () => api,
    sort: (spec = { createdAt: -1 }) => {
      const [key, dir] = Object.entries(spec)[0];
      out = out.sort((a, b) => (a[key] - b[key]) * dir);
      return api;
    },
    limit: (n) => { out = out.slice(0, n); return api; },
    then: (res, rej) => Promise.resolve(out).then(res, rej),
  };
  return api;
};

mockLocal('models/EmailHistory', {
  countDocuments: async (q = {}) => state.emails.filter((e) => matchesQuery(e, q)).length,
  find: (q = {}) => listChain(state.emails.filter((e) => matchesQuery(e, q))),
});
mockLocal('models/ResumeAnalysis', {
  countDocuments: async () => state.analyses.length,
  findOne: () => ({ sort: async () => state.analyses.slice().sort((a, b) => b.createdAt - a.createdAt)[0] || null }),
});
mockLocal('models/Resume', { findOne: async () => state.resume });

const { getStats, _profileChecklist, _bucketByDay } = load('controllers/statsController');

const run = async (user) => {
  const res = mockRes();
  await getStats({ user }, res);
  return res;
};
const email = (daysAgo, extra = {}) => ({ _id: `e${daysAgo}-${Math.random()}`, userId: 'u1', subject: 'S', createdAt: new Date(Date.now() - daysAgo * DAY), ...extra });

beforeEach(() => { state.emails = []; state.analyses = []; state.resume = null; });

describe('getStats', () => {
  it('returns zeros for a brand-new user', async () => {
    const { body } = await run({ _id: 'u1', profile: {} });
    assert.equal(body.emailsTotal, 0);
    assert.equal(body.analysesTotal, 0);
    assert.equal(body.lastMatchScore, null);
    assert.equal(body.hasResume, false);
    assert.equal(body.activity.length, 7);
    assert.equal(body.profile.percent, 0);
    assert.deepEqual(body.recent, []);
  });

  it('counts totals, the last 7 days, recent items and the latest match score', async () => {
    state.emails = [email(0), email(0), email(2), email(30)];
    state.analyses = [
      { matchScore: 55, createdAt: new Date(Date.now() - 3 * DAY) },
      { matchScore: 81, createdAt: new Date(Date.now() - 1 * DAY) },
    ];
    state.resume = { text: 'x' };
    const { body } = await run({ _id: 'u1', profile: {} });
    assert.equal(body.emailsTotal, 4);
    assert.equal(body.emailsLast7Days, 3);
    assert.equal(body.analysesTotal, 2);
    assert.equal(body.lastMatchScore, 81);
    assert.equal(body.hasResume, true);
    assert.equal(body.recent.length, 4);
    assert.equal(body.activity.at(-1).count, 2); // today
  });

  it('does not expose email bodies in the recent list', async () => {
    state.emails = [email(0, { emailBody: 'SECRET BODY', jobTitle: 'Dev', company: 'Acme' })];
    const { body } = await run({ _id: 'u1', profile: {} });
    assert.doesNotMatch(JSON.stringify(body), /SECRET BODY/);
    assert.equal(body.recent[0].company, 'Acme');
  });
});

describe('getStats: outreach pipeline', () => {
  const run2 = () => run({ _id: 'u1', profile: {} });

  it('has an empty pipeline for new users and for drafts only', async () => {
    state.emails = [email(0, { status: 'draft' }), email(1)]; // second one predates tracking: no status field
    const { body } = await run2();
    assert.deepEqual(body.tracking, { sent: 0, responded: 0, replyRate: null, followUpsDue: 0, dueList: [] });
  });

  it('computes the reply rate from sent and responded entries', async () => {
    state.emails = [
      email(5, { status: 'sent' }), email(5, { status: 'replied' }), email(5, { status: 'interview' }),
      email(5, { status: 'no_response' }), email(5, { status: 'draft' }),
    ];
    const { body } = await run2();
    assert.equal(body.tracking.sent, 4);
    assert.equal(body.tracking.responded, 2);
    assert.equal(body.tracking.replyRate, 50);
  });

  it('counts a rejection as a response, because the recipient did answer', async () => {
    state.emails = [email(3, { status: 'rejected' }), email(3, { status: 'sent' })];
    assert.equal((await run2()).body.tracking.replyRate, 50);
  });

  it('lists only sent emails whose follow-up date has arrived, soonest first', async () => {
    const past = (d) => new Date(Date.now() - d * DAY);
    state.emails = [
      email(9, { status: 'sent', followUpAt: past(1), subject: 'newer' }),
      email(9, { status: 'sent', followUpAt: past(4), subject: 'older' }),
      email(9, { status: 'sent', followUpAt: new Date(Date.now() + 2 * DAY), subject: 'future' }),
      email(9, { status: 'replied', followUpAt: past(2), subject: 'replied' }),
      email(9, { status: 'sent', followUpAt: null, subject: 'none' }),
    ];
    const { tracking } = (await run2()).body;
    assert.equal(tracking.followUpsDue, 2);
    assert.deepEqual(tracking.dueList.map((d) => d.subject), ['older', 'newer']);
  });

  it('reports the true due count even when the list is capped at 5', async () => {
    state.emails = Array.from({ length: 8 }, (_, i) => email(10, { status: 'sent', followUpAt: new Date(Date.now() - (i + 1) * DAY) }));
    const { tracking } = (await run2()).body;
    assert.equal(tracking.followUpsDue, 8);
    assert.equal(tracking.dueList.length, 5);
  });
});

describe('getStats: data isolation', () => {
  it("never counts or lists another user's emails", async () => {
    state.emails = [
      email(0), email(0, { status: 'sent', followUpAt: new Date(Date.now() - DAY) }),
      email(0, { userId: 'someone-else', subject: 'THEIRS', status: 'replied' }),
      email(0, { userId: 'someone-else', subject: 'THEIRS-DUE', status: 'sent', followUpAt: new Date(Date.now() - DAY) }),
    ];
    const { body } = await run({ _id: 'u1', profile: {} });
    assert.equal(body.emailsTotal, 2);
    assert.equal(body.tracking.sent, 1);
    assert.equal(body.tracking.responded, 0);
    assert.equal(body.tracking.followUpsDue, 1);
    assert.doesNotMatch(JSON.stringify(body), /THEIRS/);
  });
});

describe('profileChecklist', () => {
  it('scores completeness and lists what is missing', () => {
    const full = _profileChecklist({ headline: 'Dev', yearsExperience: 0, targetRole: 'SWE', skills: ['a'], highlights: 'x', githubUrl: 'https://g.com/a' });
    assert.equal(full.percent, 100);
    assert.deepEqual(full.missing, []);
    const half = _profileChecklist({ headline: 'Dev', skills: ['a'], highlights: 'x' });
    assert.equal(half.percent, 50);
    assert.deepEqual(half.missing, ['Years of experience', 'Target role', 'A profile link']);
  });

  it('treats 0 years of experience as filled in, and tolerates a missing profile', () => {
    assert.equal(_profileChecklist({ yearsExperience: 0 }).percent, 17);
    assert.equal(_profileChecklist(undefined).percent, 0);
  });
});

describe('bucketByDay', () => {
  it('returns 7 consecutive days oldest-first and ignores older entries', () => {
    const now = Date.now();
    const days = _bucketByDay([{ createdAt: new Date(now) }, { createdAt: new Date(now - 20 * DAY) }], now);
    assert.equal(days.length, 7);
    assert.ok(days[0].date < days[6].date);
    assert.equal(days.reduce((s, d) => s + d.count, 0), 1);
  });
});
