const User = require('../models/User');

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const isHttpUrl = (v) => {
  if (!v) return true; // empty is allowed
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

exports.getProfile = async (req, res) => {
  res.status(200).json({
    name: req.user.name,
    email: req.user.email,
    googleLinked: Boolean(req.user.googleId),
    profile: req.user.profile || {},
  });
};

exports.updateProfile = async (req, res) => {
  try {
    const b = req.body || {};

    let yearsExperience;
    if (b.yearsExperience !== undefined && b.yearsExperience !== null && b.yearsExperience !== '') {
      yearsExperience = Number(b.yearsExperience);
      if (!Number.isFinite(yearsExperience) || yearsExperience < 0 || yearsExperience > 60) {
        return res.status(400).json({ message: 'Years of experience must be between 0 and 60' });
      }
    }

    // skills: accept array or comma-separated string, cap count and length
    let skills = b.skills;
    if (typeof skills === 'string') skills = skills.split(',');
    skills = Array.isArray(skills)
      ? [...new Set(skills.map((s) => str(s, 40)).filter(Boolean))].slice(0, 25)
      : [];

    const urls = {
      linkedinUrl: str(b.linkedinUrl, 200),
      githubUrl: str(b.githubUrl, 200),
      portfolioUrl: str(b.portfolioUrl, 200),
    };
    for (const [key, value] of Object.entries(urls)) {
      if (!isHttpUrl(value)) {
        return res.status(400).json({ message: `${key} must be a valid http(s) URL` });
      }
    }

    const profile = {
      headline: str(b.headline, 120),
      yearsExperience,
      skills,
      highlights: str(b.highlights, 1200),
      targetRole: str(b.targetRole, 120),
      ...urls,
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { profile } },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ name: user.name, email: user.email, profile: user.profile });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};
