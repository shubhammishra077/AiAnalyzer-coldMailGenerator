const mongoose = require('mongoose');
const { STATUSES } = require('../utils/trackingStatus');

const emailHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    prompt: { type: String, default: '' },
    recruiterName: { type: String, default: '' },
    company: { type: String, default: '' },
    jobTitle: { type: String, default: '' },
    tone: { type: String, default: 'professional' },
    subject: { type: String, required: true },
    emailBody: { type: String, required: true },
    // Optional: the model occasionally returns these empty, which must not fail the save
    linkedInDM: { type: String, default: '' },
    followUpEmail: { type: String, default: '' },

    // Outreach tracking (set by the user, not by reading any inbox)
    status: { type: String, enum: STATUSES, default: 'draft' },
    sentAt: { type: Date, default: null },
    repliedAt: { type: Date, default: null },
    followUpAt: { type: Date, default: null },
    notes: { type: String, default: '', maxlength: 1000 }
}, { timestamps: true });

// Powers the tracker tabs and the "follow-ups due" query
emailHistorySchema.index({ userId: 1, status: 1, followUpAt: 1 });

const EmailHistory = mongoose.model('EmailHistory', emailHistorySchema);
module.exports = EmailHistory;
