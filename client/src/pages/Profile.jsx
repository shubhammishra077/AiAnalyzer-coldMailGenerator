import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';
import DeleteAccountModal from '../components/DeleteAccountModal';

const inputClass =
    'block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

const emptyForm = {
    headline: '',
    yearsExperience: '',
    targetRole: '',
    skills: '',
    highlights: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
};

const Profile = () => {
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [account, setAccount] = useState({ email: '', googleLinked: false });
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        api.get('/profile')
            .then(({ data }) => {
                setAccount({ email: data.email, googleLinked: Boolean(data.googleLinked) });
                const p = data.profile || {};
                setForm({
                    headline: p.headline || '',
                    yearsExperience: p.yearsExperience ?? '',
                    targetRole: p.targetRole || '',
                    skills: (p.skills || []).join(', '),
                    highlights: p.highlights || '',
                    linkedinUrl: p.linkedinUrl || '',
                    githubUrl: p.githubUrl || '',
                    portfolioUrl: p.portfolioUrl || '',
                });
            })
            .catch(() => toast.error('Could not load your profile'))
            .finally(() => setLoading(false));
    }, []);

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/profile', form);
            toast.success('Profile saved');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not save profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-gray-500 text-sm">Loading profile...</div>;

    return (
        <div className="max-w-2xl">
            <PageHeader
                title="Your profile"
                description="Generated emails only use what you enter here. Add real details so they never claim experience you don't have."
            />

            <form onSubmit={handleSubmit} className="card space-y-5 p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current role</label>
                        <input className={inputClass} value={form.headline} onChange={set('headline')} maxLength={120} placeholder="Backend Engineer" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Years of experience</label>
                        <input className={inputClass} type="number" min="0" max="60" step="0.5" value={form.yearsExperience} onChange={set('yearsExperience')} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role you're targeting</label>
                    <input className={inputClass} value={form.targetRole} onChange={set('targetRole')} maxLength={120} placeholder="Software Engineer, backend" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skills <span className="text-gray-400 font-normal">(comma separated)</span></label>
                    <input className={inputClass} value={form.skills} onChange={set('skills')} placeholder="Node.js, MongoDB, System design" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Achievements <span className="text-gray-400 font-normal">(one per line, real ones only)</span></label>
                    <textarea className={`${inputClass} h-28 resize-none`} value={form.highlights} onChange={set('highlights')} maxLength={1200} placeholder={'Cut API p95 latency from 800ms to 300ms\nBuilt the billing service used by 40k users'} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                        <input className={inputClass} value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="https://..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                        <input className={inputClass} value={form.githubUrl} onChange={set('githubUrl')} placeholder="https://..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio</label>
                        <input className={inputClass} value={form.portfolioUrl} onChange={set('portfolioUrl')} placeholder="https://..." />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save profile'}
                </button>
            </form>

            <section className="mt-8 rounded-2xl border border-red-200 bg-white p-6">
                <h3 className="text-base font-semibold text-red-700">Delete account</h3>
                <p className="mt-1 text-sm text-gray-600">
                    Permanently remove your account and everything you created: profile, generated emails, saved resume and analyses.
                </p>
                <button
                    type="button"
                    onClick={() => setDeleting(true)}
                    className="btn mt-4 border border-red-300 bg-white text-red-700 hover:bg-red-50"
                >
                    Delete my account
                </button>
            </section>

            {deleting && (
                <DeleteAccountModal
                    email={account.email}
                    googleLinked={account.googleLinked}
                    onClose={() => setDeleting(false)}
                />
            )}
        </div>
    );
};

export default Profile;
