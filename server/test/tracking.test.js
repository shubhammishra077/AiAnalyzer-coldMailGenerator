const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { mockLocal, mockPackage, load, mockRes } = require('./helpers');

mockPackage('mongoose', { isValidObjectId: (id) => /^[a-f0-9]{24}$/.test(String(id)) });

const DAY = 24 * 60 * 60 * 1000;
const ID = 'c'.repeat(24);
let entry;
let lastQuery;
mockLocal('models/EmailHistory', {
  findOne: async (q) => { lastQuery = q; return entry; },
});
const { updateTracking } = load('controllers/trackingController');

const make = (over = {}) => ({
  status: 'draft', sentAt: null, repliedAt: null, followUpAt: null, notes: '',
  saved: 0, async save() { this.saved++; }, toObject() { return { ...this }; },
  ...over,
});
const patch = async (body, id = ID, user = { _id: 'u1' }) => {
  const res = mockRes();
  await updateTracking({ params: { id }, body, user }, res);
  return res;
};
const approx = (date, expectedMs, toleranceMs = 5000) => Math.abs(date.getTime() - expectedMs) < toleranceMs;

beforeEach(() => { entry = make(); lastQuery = null; });

describe('updateTracking: access and validation', () => {
  it('scopes the lookup to the owner and 404s for anything else', async () => {
    entry = null;
    assert.equal((await patch({ status: 'sent' })).statusCode, 404);
    assert.deepEqual(lastQuery, { _id: ID, userId: 'u1' });
  });

  it('rejects bad ids, empty bodies and unknown statuses', async () => {
    assert.equal((await patch({ status: 'sent' }, 'nope')).statusCode, 400);
    assert.equal((await patch({})).statusCode, 400);
    assert.equal((await patch({ status: 'ghosted' })).statusCode, 400);
    assert.equal((await patch({ status: { $ne: 'draft' } })).statusCode, 400);
  });

  it('rejects malformed, future and out-of-range dates', async () => {
    entry = make({ status: 'sent', sentAt: new Date() });
    assert.equal((await patch({ sentAt: 'not a date' })).statusCode, 400);
    assert.equal((await patch({ sentAt: 12345 })).statusCode, 400);
    assert.equal((await patch({ sentAt: new Date(Date.now() + 10 * DAY).toISOString() })).statusCode, 400);
    assert.equal((await patch({ followUpAt: new Date(Date.now() + 400 * DAY).toISOString() })).statusCode, 400);
    assert.equal((await patch({ followUpAt: { $gt: 1 } })).statusCode, 400);
  });

  it('validates notes', async () => {
    assert.equal((await patch({ notes: 'x'.repeat(1001) })).statusCode, 400);
    assert.equal((await patch({ notes: { $ne: '' } })).statusCode, 400);
    assert.equal(entry.saved, 0);
  });
});

describe('updateTracking: status transitions', () => {
  it('draft -> sent stamps sentAt and schedules a follow-up 5 days out', async () => {
    const res = await patch({ status: 'sent' });
    assert.equal(res.statusCode, 200);
    assert.equal(entry.status, 'sent');
    assert.ok(approx(entry.sentAt, Date.now()));
    assert.ok(approx(entry.followUpAt, entry.sentAt.getTime() + 5 * DAY));
    assert.equal(entry.saved, 1);
  });

  it('draft -> sent honours an explicit sent date and follow-up date', async () => {
    const sent = new Date(Date.now() - 2 * DAY).toISOString();
    const follow = new Date(Date.now() + 3 * DAY).toISOString();
    await patch({ status: 'sent', sentAt: sent, followUpAt: follow });
    assert.equal(entry.sentAt.toISOString(), sent);
    assert.equal(entry.followUpAt.toISOString(), follow);
  });

  it('draft -> sent with followUpAt null means "no reminder"', async () => {
    await patch({ status: 'sent', followUpAt: null });
    assert.equal(entry.followUpAt, null);
  });

  it('sent -> replied stamps repliedAt and clears the reminder', async () => {
    entry = make({ status: 'sent', sentAt: new Date(Date.now() - 3 * DAY), followUpAt: new Date() });
    await patch({ status: 'replied' });
    assert.equal(entry.status, 'replied');
    assert.ok(approx(entry.repliedAt, Date.now()));
    assert.equal(entry.followUpAt, null);
  });

  it('keeps the original reply date when the status moves replied -> interview -> offer', async () => {
    const first = new Date(Date.now() - 4 * DAY);
    entry = make({ status: 'replied', sentAt: new Date(Date.now() - 6 * DAY), repliedAt: first });
    await patch({ status: 'interview' });
    await patch({ status: 'offer' });
    assert.equal(entry.repliedAt, first);
  });

  it('jumping straight from draft to replied also records a sent date', async () => {
    await patch({ status: 'replied' });
    assert.ok(entry.sentAt instanceof Date);
    assert.ok(entry.repliedAt instanceof Date);
  });

  it('sent -> no_response clears the reminder and has no reply date', async () => {
    entry = make({ status: 'sent', sentAt: new Date(), followUpAt: new Date() });
    await patch({ status: 'no_response' });
    assert.equal(entry.followUpAt, null);
    assert.equal(entry.repliedAt, null);
  });

  it('back to draft wipes sent, reply and follow-up dates', async () => {
    entry = make({ status: 'replied', sentAt: new Date(), repliedAt: new Date(), followUpAt: new Date() });
    await patch({ status: 'draft' });
    assert.deepEqual([entry.sentAt, entry.repliedAt, entry.followUpAt], [null, null, null]);
  });

  it('replied -> sent (correcting a mistake) clears the reply and restores a reminder', async () => {
    entry = make({ status: 'replied', sentAt: new Date(Date.now() - DAY), repliedAt: new Date() });
    await patch({ status: 'sent' });
    assert.equal(entry.repliedAt, null);
    assert.ok(entry.followUpAt instanceof Date);
  });

  it('refuses contradictory combinations', async () => {
    assert.equal((await patch({ status: 'draft', followUpAt: new Date().toISOString() })).statusCode, 400);
    entry = make({ status: 'sent', sentAt: new Date() });
    assert.equal((await patch({ status: 'replied', followUpAt: new Date().toISOString() })).statusCode, 400);
    assert.equal((await patch({ status: 'replied', sentAt: null })).statusCode, 400);
  });
});

describe('updateTracking: edits without a status change', () => {
  it('a notes-only edit never re-creates a reminder the user cleared', async () => {
    entry = make({ status: 'sent', sentAt: new Date(), followUpAt: null });
    await patch({ notes: '  Met her at the meetup  ' });
    assert.equal(entry.followUpAt, null);
    assert.equal(entry.notes, 'Met her at the meetup');
  });

  it('lets the user move a follow-up date while waiting for a reply', async () => {
    entry = make({ status: 'sent', sentAt: new Date() });
    const next = new Date(Date.now() + 7 * DAY).toISOString();
    assert.equal((await patch({ followUpAt: next })).statusCode, 200);
    assert.equal(entry.followUpAt.toISOString(), next);
  });

  it('refuses follow-up dates unless the email is waiting for a reply', async () => {
    for (const status of ['draft', 'replied', 'no_response']) {
      entry = make({ status });
      assert.equal((await patch({ followUpAt: new Date().toISOString() })).statusCode, 400, status);
    }
  });

  it('refuses a sent date for drafts, and lets sent entries correct theirs', async () => {
    assert.equal((await patch({ sentAt: new Date().toISOString() })).statusCode, 400);
    entry = make({ status: 'sent', sentAt: new Date() });
    const earlier = new Date(Date.now() - 3 * DAY).toISOString();
    assert.equal((await patch({ sentAt: earlier })).statusCode, 200);
    assert.equal(entry.sentAt.toISOString(), earlier);
  });

  it('treats entries created before tracking existed (no status field) as drafts', async () => {
    entry = make();
    delete entry.status;
    await patch({ status: 'sent' });
    assert.equal(entry.status, 'sent');
  });
});
