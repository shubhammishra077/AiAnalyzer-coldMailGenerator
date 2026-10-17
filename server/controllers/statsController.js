const EmailHistory = require('../models/EmailHistory');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const Resume = require('../models/Resume');
const { RESPONDED, SENT_OR_LATER } = require('../utils/trackingStatus');

const DAY_MS = 24 * 60 * 60 * 1000;

// Which profile fields are filled in, and which are still missing
const profileChecklist = (profile = {}) => {
  const checks = [
    ['Current role', Boolean(profile.headline)],
    ['Years of experience', profile.yearsExperience !== undefined && profile.yearsExperience !== null],
    ['Target role', Boolean(profile.targetRole)],
    ['Skills', Array.isArray(profile.skills) && profile.skills.length > 0],
    ['Achievements', Boolean(profile.highlights)],
    ['A profile link', Boolean(profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl)],
  ];
  const done = checks.filter(([, ok]) => ok).length;
  return {
    percent: Math.round((done / checks.length) * 100),
    missing: checks.filter(([, ok]) => !ok).map(([label]) => label),
  };
};

// Last 7 UTC days, oldest first, each { date: 'YYYY-MM-DD', count }
const bucketByDay = (docs, now) => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    days.push({ date: new Date(now - i * DAY_MS).toISOString().slice(0, 10), count: 0 });
  }
  for (const doc of docs) {
    const key = new Date(doc.createdAt).toISOString().slice(0, 10);
    const bucket = days.find((d) => d.date === key);
    if (bucket) bucket.count += 1;
  }
  return days;
};

exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = Date.now();
    const weekAgo = new Date(now - 7 * DAY_MS);

    const [
      emailsTotal, analysesTotal, lastAnalysis, resume, weekDocs, recent,
      sentTotal, respondedTotal, dueCount, dueList,
    ] = await Promise.all([
      EmailHistory.countDocuments({ userId }),
      ResumeAnalysis.countDocuments({ userId }),
      ResumeAnalysis.findOne({ userId }).sort({ createdAt: -1 }),
      Resume.findOne({ userId }),
      EmailHistory.find({ userId, createdAt: { $gte: weekAgo } }).select('createdAt').limit(1000),
      EmailHistory.find({ userId }).sort({ createdAt: -1 }).limit(5),
      // Explicit status lists (not $ne: 'draft') so entries created before tracking existed are not miscounted
      EmailHistory.countDocuments({ userId, status: { $in: SENT_OR_LATER } }),
      EmailHistory.countDocuments({ userId, status: { $in: RESPONDED } }),
      EmailHistory.countDocuments({ userId, status: 'sent', followUpAt: { $lte: new Date(now) } }),
      EmailHistory.find({ userId, status: 'sent', followUpAt: { $lte: new Date(now) } }).sort({ followUpAt: 1 }).limit(5),
    ]);

    const activity = bucketByDay(weekDocs, now);

    res.status(200).json({
      emailsTotal,
      emailsLast7Days: activity.reduce((sum, d) => sum + d.count, 0),
      analysesTotal,
      lastMatchScore: lastAnalysis ? lastAnalysis.matchScore : null,
      hasResume: Boolean(resume),
      activity,
      recent: recent.map((e) => ({
        _id: e._id,
        jobTitle: e.jobTitle || '',
        company: e.company || '',
        subject: e.subject,
        createdAt: e.createdAt,
      })),
      profile: profileChecklist(req.user.profile),
      tracking: {
        sent: sentTotal,
        responded: respondedTotal,
        replyRate: sentTotal > 0 ? Math.round((respondedTotal / sentTotal) * 100) : null,
        followUpsDue: dueCount,
        dueList: dueList.map((e) => ({
          _id: e._id,
          jobTitle: e.jobTitle || '',
          company: e.company || '',
          subject: e.subject,
          followUpAt: e.followUpAt,
        })),
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Failed to load dashboard data' });
  }
};

exports._profileChecklist = profileChecklist;
exports._bucketByDay = bucketByDay;
