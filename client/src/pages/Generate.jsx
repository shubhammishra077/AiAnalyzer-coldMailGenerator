import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { EnvelopeIcon, SparklesIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import ResultCard from '../components/ResultCard';
import PageHeader from '../components/PageHeader';
import { formatDay } from '../utils/tracking';

const Generate = () => {
    const [form, setForm] = useState({
        recruiterName: '',
        company: '',
        jobTitle: '',
        jobDescription: '',
        prompt: '',
        tone: 'professional',
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [tracked, setTracked] = useState(null);
    const [marking, setMarking] = useState(false);

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
    const hasInput = Boolean(
        form.company.trim() || form.jobTitle.trim() || form.jobDescription.trim() || form.prompt.trim()
    );

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!hasInput) return;

        setLoading(true);
        try {
            const { data } = await api.post('/ai/generate-email', form);
            setResult(data);
            setTracked(null);
            toast.success('Draft ready');
        } catch (error) {
            if (error.response?.data?.code === 'MONTHLY_QUOTA_EXCEEDED') {
                toast.error(error.response.data.message);
                window.location.assign('/dashboard/billing');
            } else {
                toast.error(error.response?.data?.message || 'Failed to generate. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const markSent = async () => {
        setMarking(true);
        try {
            const { data } = await api.patch(`/ai/history/${result._id}/tracking`, { status: 'sent' });
            setTracked(data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not update the tracker');
        } finally {
            setMarking(false);
        }
    };

    return (
        <div>
            <PageHeader
                title="Generate outreach"
                description="Tell us who you're writing to. We combine that with your profile to draft an email, a LinkedIn DM and a follow-up."
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <form onSubmit={handleGenerate} className="card space-y-4 p-5 lg:col-span-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label" htmlFor="recruiter">Recruiter</label>
                            <input id="recruiter" className="input" value={form.recruiterName} onChange={set('recruiterName')} maxLength={100} placeholder="Name" />
                        </div>
                        <div>
                            <label className="label" htmlFor="company">Company</label>
                            <input id="company" className="input" value={form.company} onChange={set('company')} maxLength={100} placeholder="Razorpay" />
                        </div>
                    </div>
                    <div>
                        <label className="label" htmlFor="role">Role</label>
                        <input id="role" className="input" value={form.jobTitle} onChange={set('jobTitle')} maxLength={100} placeholder="Backend Engineer" />
                    </div>
                    <div>
                        <label className="label" htmlFor="jd">Job description <span className="font-normal text-gray-400">(optional)</span></label>
                        <textarea id="jd" className="input h-28 resize-none" value={form.jobDescription} onChange={set('jobDescription')} maxLength={4000} placeholder="Paste the posting for a more tailored email" />
                    </div>
                    <div>
                        <label className="label" htmlFor="notes">Extra notes <span className="font-normal text-gray-400">(optional)</span></label>
                        <textarea id="notes" className="input h-20 resize-none" value={form.prompt} onChange={set('prompt')} maxLength={2000} placeholder="e.g. Referred by Rahul from the platform team" />
                    </div>
                    <div>
                        <label className="label" htmlFor="tone">Tone</label>
                        <select id="tone" className="input" value={form.tone} onChange={set('tone')}>
                            <option value="professional">Professional</option>
                            <option value="friendly">Friendly</option>
                            <option value="direct">Direct</option>
                        </select>
                    </div>
                    <button type="submit" disabled={loading || !hasInput} className="btn-primary w-full py-3">
                        <SparklesIcon className="h-4 w-4" />
                        {loading ? 'Generating...' : 'Generate'}
                    </button>
                </form>

                <div className="lg:col-span-3">
                    {result ? (
                        <div>
                            {result.profileIncomplete && (
                                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                    Your profile is empty, so this draft is generic.{' '}
                                    <Link to="/dashboard/profile" className="font-medium underline">Add your background</Link>{' '}
                                    for a more specific email.
                                </div>
                            )}
                            <ResultCard title="Subject Line" content={result.subject} />
                            <ResultCard title="Cold Email" content={result.emailBody} />
                            <ResultCard title="LinkedIn DM" content={result.linkedInDM} />
                            <ResultCard title="Follow-up Email" content={result.followUpEmail} />

                            <div className="card mt-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                {tracked ? (
                                    <p className="text-sm text-gray-700">
                                        Tracked as sent.{' '}
                                        {tracked.followUpAt && <>We'll flag a follow-up on <strong>{formatDay(tracked.followUpAt)}</strong>. </>}
                                        <Link to="/dashboard/tracker" className="font-medium text-primary-600 hover:underline">Open tracker</Link>
                                    </p>
                                ) : (
                                    <>
                                        <p className="text-sm text-gray-700">Sent it? Track replies and get a follow-up reminder.</p>
                                        <button type="button" onClick={markSent} disabled={marking} className="btn-secondary flex-none">
                                            <PaperAirplaneIcon className="h-4 w-4" />
                                            {marking ? 'Saving...' : 'Mark as sent'}
                                        </button>
                                    </>
                                )}
                            </div>
                            <p className="mt-2 text-xs text-gray-500">AI drafts can contain mistakes. Check names, facts and tone before you send.</p>
                        </div>
                    ) : (
                        <div className="card flex h-full min-h-[22rem] flex-col items-center justify-center p-8 text-center">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
                                <EnvelopeIcon className="h-7 w-7 text-primary-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-900">Your drafts will appear here</p>
                            <p className="mt-1 max-w-xs text-sm text-gray-500">Fill in a company or role on the left, then hit Generate.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Generate;
