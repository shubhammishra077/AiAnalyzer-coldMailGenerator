const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
    section: { type: String, default: 'Other' },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    issue: { type: String, default: '' },
    suggestion: { type: String, default: '' },
    example: { type: String, default: '' },
}, { _id: false });

const resumeAnalysisSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jobTitle: { type: String, default: '' },
    company: { type: String, default: '' },
    matchScore: { type: Number, min: 0, max: 100, required: true },
    summary: { type: String, default: '' },
    matchedKeywords: { type: [String], default: [] },
    missingKeywords: { type: [String], default: [] },
    strengths: { type: [String], default: [] },
    gaps: { type: [String], default: [] },
    suggestions: { type: [suggestionSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
