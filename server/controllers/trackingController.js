const mongoose = require('mongoose');
const EmailHistory = require('../models/EmailHistory');
const { STATUSES, DEFAULT_FOLLOW_UP_DAYS } = require('../utils/trackingStatus');

const DAY_MS = 24 * 60 * 60 * 1000;
const NOTES_MAX = 1000;
const WAITING = 'sent'; // the only status where a follow-up reminder makes sense

// null / '' => null (clear); valid ISO string => Date; anything else => undefined (invalid)
const parseDate = (v) => {
  if (v === null || v === '') return null;
  if (typeof v !== 'string') return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const fail = (res, message) => res.status(400).json({ message });

// PATCH /api/ai/history/:id/tracking   { status?, sentAt?, followUpAt?, notes? }
//
// Rules (enforced here so every client behaves the same):
//  - moving to "draft" clears sent/reply/follow-up dates
//  - moving to "sent" stamps sentAt (now, unless given) and, unless a date is given,
//    schedules a follow-up DEFAULT_FOLLOW_UP_DAYS later
//  - moving to replied/interview/offer/rejected stamps repliedAt once and clears the reminder
//  - moving to "no_response" clears the reminder and any reply date
//  - follow-up reminders can only be set while the status is "sent"
exports.updateTracking = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return fail(res, 'Invalid id');

    const body = req.body || {};
    const has = (k) => body[k] !== undefined;
    if (!['status', 'sentAt', 'followUpAt', 'notes'].some(has)) return fail(res, 'Nothing to update');

    const now = new Date();

    if (has('status') && !STATUSES.includes(body.status)) return fail(res, 'Invalid status');

    let sentAt;
    if (has('sentAt')) {
      sentAt = parseDate(body.sentAt);
      if (sentAt === undefined) return fail(res, 'Invalid sent date');
      if (sentAt && sentAt.getTime() > now.getTime() + DAY_MS) return fail(res, 'The sent date cannot be in the future');
    }

    let followUpAt;
    if (has('followUpAt')) {
      followUpAt = parseDate(body.followUpAt);
      if (followUpAt === undefined) return fail(res, 'Invalid follow-up date');
      if (followUpAt && Math.abs(followUpAt.getTime() - now.getTime()) > 366 * DAY_MS) {
        return fail(res, 'Pick a follow-up date within a year');
      }
    }

    if (has('notes')) {
      if (typeof body.notes !== 'string') return fail(res, 'Notes must be text');
      if (body.notes.length > NOTES_MAX) return fail(res, `Notes cannot exceed ${NOTES_MAX} characters`);
    }

    // Scoped to the owner: another user's entry looks exactly like a missing one
    const entry = await EmailHistory.findOne({ _id: id, userId: req.user._id });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    const prev = entry.status || 'draft';
    const status = has('status') ? body.status : prev;
    const changed = status !== prev;

    if (changed) {
      if (status === 'draft') {
        if (sentAt || followUpAt) return fail(res, 'A draft has no sent date or follow-up. Mark it as sent first.');
        entry.sentAt = null;
        entry.repliedAt = null;
        entry.followUpAt = null;
      } else {
        if (has('sentAt') && !sentAt) return fail(res, 'The sent date cannot be empty');
        entry.sentAt = sentAt || entry.sentAt || now;

        if (status === WAITING) {
          entry.repliedAt = null;
          entry.followUpAt = has('followUpAt')
            ? followUpAt
            : new Date(entry.sentAt.getTime() + DEFAULT_FOLLOW_UP_DAYS * DAY_MS);
        } else {
          if (followUpAt) return fail(res, 'Follow-up reminders only apply to emails still waiting for a reply');
          entry.followUpAt = null;
          entry.repliedAt = status === 'no_response' ? null : (entry.repliedAt || now);
        }
      }
      entry.status = status;
    } else {
      if (has('sentAt')) {
        if (status === 'draft') return fail(res, 'Mark it as sent first');
        if (!sentAt) return fail(res, 'The sent date cannot be empty');
        entry.sentAt = sentAt;
      }
      if (has('followUpAt')) {
        if (status !== WAITING) return fail(res, 'Follow-up reminders only apply to emails still waiting for a reply');
        entry.followUpAt = followUpAt;
      }
    }

    if (has('notes')) entry.notes = body.notes.trim();

    await entry.save();
    res.status(200).json(entry.toObject ? entry.toObject() : entry);
  } catch (error) {
    console.error('Update tracking error:', error.message);
    res.status(500).json({ message: 'Failed to update tracking' });
  }
};
