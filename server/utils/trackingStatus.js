// Lifecycle of one outreach entry. Kept in its own file so the model, controllers and tests agree.
const STATUSES = ['draft', 'sent', 'replied', 'interview', 'offer', 'rejected', 'no_response'];

// The recipient answered in some way (a "no" counts as a reply)
const RESPONDED = ['replied', 'interview', 'offer', 'rejected'];

// Everything that was actually sent
const SENT_OR_LATER = ['sent', ...RESPONDED, 'no_response'];

const DEFAULT_FOLLOW_UP_DAYS = 5;

module.exports = { STATUSES, RESPONDED, SENT_OR_LATER, DEFAULT_FOLLOW_UP_DAYS };
