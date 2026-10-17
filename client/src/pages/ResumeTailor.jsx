import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
    ArrowUpTrayIcon,
    CheckIcon,
    ClipboardDocumentIcon,
    DocumentMagnifyingGlassIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';

const MIN_RESUME = 200;
const MIN_JD = 50;

const scoreStyle = (score) => {
    if (score >= 75) return { color: '#059669', label: 'Strong match', badge: 'bg-emerald-50 text-emerald-700' };
    if (score >= 50) return { color: '#d97706', label: 'Moderate match', badge: 'bg-amber-50 text-amber-700' };
    return { color: '#dc2626', label: 'Needs work', badge: 'bg-red-50 text-red-700' };
};

const priorityStyle = {
    high: 'bg-red-50 text-red-700',
    medium: 'bg-amber-50 text-amber-700',
    low: 'bg-gray-100 text-gray-600',
};

const ScoreRing = ({ score }) => {
    const { color, label } = scoreStyle(score);
    const r = 52;
    const circumference = 2 * Math.PI * r;
    return (
        <div className="flex flex-col items-center">
            <div className="relative h-32 w-32">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
                    <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
                    <circle
                        cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - score / 100)}
                        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">{score}</span>
                    <span className="text-xs text-gray-500">out of 100</span>
                </div>
            </div>
            <span className="mt-2 text-sm font-semibold" style={{ color }}>{label}</span>
        </div>
    );
};

const Chip = ({ children, tone }) => (
    <span className={`badge ${tone === 'good' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{children}</span>
);

const CopyExample = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Could not copy. Select the text and copy manually.');
        }
    };
    return (
        <div className="mt-3 rounded-lg border border-primary-100 bg-primary-50/50 p-3">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Example rewrite</p>
                    <p className="mt-1 text-sm text-gray-700">{text}</p>
                </div>
                <button onClick={copy} className="flex-none text-gray-400 hover:text-primary-600" title="Copy">
                    {copied ? <CheckIcon className="h-5 w-5 text-emerald-500" /> : <ClipboardDocumentIcon className="h-5 w-5" />}
                </button>
            </div>
        </div>
    );
};

const Results = ({ result }) => (
    <div className="space-y-5">
        <section className="card p-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <ScoreRing score={result.matchScore} />
                <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-gray-900">
                        {[result.jobTitle, result.company].filter(Boolean).join(' at ') || 'Resume analysis'}
                    </h3>
                    {result.summary && <p className="mt-2 text-sm leading-relaxed text-gray-700">{result.summary}</p>}
                    <p className="mt-3 text-xs text-gray-500">This score is an AI estimate of keyword and experience fit. It is not a prediction of what a recruiter or an applicant tracking system will decide.</p>
                </div>
            </div>
        </section>

        {(result.matchedKeywords.length > 0 || result.missingKeywords.length > 0) && (
            <section className="card grid gap-6 p-6 sm:grid-cols-2">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">Keywords you already cover</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {result.matchedKeywords.length ? result.matchedKeywords.map((k) => <Chip key={k} tone="good">{k}</Chip>) : <span className="text-sm text-gray-500">None found</span>}
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">Keywords the job wants</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {result.missingKeywords.length ? result.missingKeywords.map((k) => <Chip key={k} tone="warn">{k}</Chip>) : <span className="text-sm text-gray-500">Nothing missing</span>}
                    </div>
                    {result.missingKeywords.length > 0 && (
                        <p className="mt-3 text-xs text-gray-500">Only add a keyword if you genuinely have that experience.</p>
                    )}
                </div>
            </section>
        )}

        {(result.strengths.length > 0 || result.gaps.length > 0) && (
            <section className="grid gap-5 sm:grid-cols-2">
                <div className="card p-6">
                    <h3 className="text-sm font-semibold text-emerald-700">Strengths</h3>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
                        {result.strengths.map((s) => <li key={s}>{s}</li>)}
                    </ul>
                </div>
                <div className="card p-6">
                    <h3 className="text-sm font-semibold text-amber-700">Gaps</h3>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
                        {result.gaps.map((s) => <li key={s}>{s}</li>)}
                    </ul>
                </div>
            </section>
        )}

        <section>
            <h3 className="mb-3 text-base font-semibold text-gray-900">How to tailor your resume</h3>
            <div className="space-y-3">
                {result.suggestions.map((s, i) => (
                    <article key={`${s.section}-${i}`} className="card p-5">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`badge capitalize ${priorityStyle[s.priority]}`}>{s.priority} priority</span>
                            <span className="badge bg-gray-100 text-gray-600">{s.section}</span>
                        </div>
                        {s.issue && <p className="mt-3 text-sm font-semibold text-gray-900">{s.issue}</p>}
                        <p className="mt-1 text-sm leading-relaxed text-gray-700">{s.suggestion}</p>
                        {s.example && <CopyExample text={s.example} />}
                    </article>
                ))}
            </div>
        </section>
    </div>
);

const ResumeTailor = () => {
    const [resumeText, setResumeText] = useState('');
    const [savedText, setSavedText] = useState('');
    const [fileName, setFileName] = useState('');
    const [savedAt, setSavedAt] = useState(null);
    const [jobTitle, setJobTitle] = useState('');
    const [company, setCompany] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [remember, setRemember] = useState(true);

    const [booting, setBooting] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [analyses, setAnalyses] = useState([]);

    const fileRef = useRef(null);
    const resultRef = useRef(null);

    useEffect(() => {
        Promise.allSettled([api.get('/resume'), api.get('/resume/analyses')]).then(([r, a]) => {
            if (r.status === 'fulfilled' && r.value.data.resume) {
                const saved = r.value.data.resume;
                setResumeText(saved.text);
                setSavedText(saved.text);
                setFileName(saved.fileName || '');
                setSavedAt(saved.updatedAt);
            }
            if (a.status === 'fulfilled') setAnalyses(a.value.data);
            setBooting(false);
        });
    }, []);

    const resumeReady = resumeText.trim().length >= MIN_RESUME;
    const jdReady = jobDescription.trim().length >= MIN_JD;
    const unsaved = resumeText !== savedText;

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const { data } = await api.post('/resume/upload', fd);
            setResumeText(data.text);
            setFileName(data.fileName);
            toast.success('Resume text extracted. Review it below.');
            if (data.truncated) toast('Your resume was long, so only the first 20,000 characters are used.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not read that file');
        } finally {
            setUploading(false);
        }
    };

    const saveResume = async ({ silent = false } = {}) => {
        setSaving(true);
        try {
            const { data } = await api.put('/resume', { text: resumeText, fileName });
            setSavedText(data.resume.text);
            setSavedAt(data.resume.updatedAt);
            if (!silent) toast.success('Resume saved');
        } catch (error) {
            if (!silent) toast.error(error.response?.data?.message || 'Could not save your resume');
        } finally {
            setSaving(false);
        }
    };

    const removeResume = async () => {
        if (!window.confirm('Delete your saved resume? This cannot be undone.')) return;
        try {
            await api.delete('/resume');
            setResumeText('');
            setSavedText('');
            setFileName('');
            setSavedAt(null);
            toast.success('Resume deleted');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not delete your resume');
        }
    };

    const analyze = async (e) => {
        e.preventDefault();
        if (!resumeReady || !jdReady) return;
        setAnalyzing(true);
        try {
            const { data } = await api.post('/resume/analyze', { resumeText, jobDescription, jobTitle, company });
            setResult(data);
            setAnalyses((list) => [data, ...list].slice(0, 20));
            if (remember && unsaved) saveResume({ silent: true });
            setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
        } catch (error) {
            if (error.response?.data?.code === 'MONTHLY_QUOTA_EXCEEDED') {
                toast.error(error.response.data.message);
                window.location.assign('/dashboard/billing');
            } else {
                toast.error(error.response?.data?.message || 'Analysis failed. Please try again.');
            }
        } finally {
            setAnalyzing(false);
        }
    };

    const deleteAnalysis = async (id) => {
        if (!window.confirm('Delete this analysis?')) return;
        try {
            await api.delete(`/resume/analyses/${id}`);
            setAnalyses((list) => list.filter((a) => a._id !== id));
            if (result?._id === id) setResult(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not delete');
        }
    };

    if (booting) return <div className="text-sm text-gray-500">Loading...</div>;

    return (
        <div>
            <PageHeader
                title="Resume Tailor"
                description="Compare your resume with a job description and get specific, honest suggestions for tailoring it."
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <form onSubmit={analyze} className="space-y-5 lg:col-span-2">
                    <section className="card p-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900">1. Your resume</h3>
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                disabled={uploading}
                                className="btn-secondary px-3 py-1.5"
                            >
                                <ArrowUpTrayIcon className="h-4 w-4" />
                                {uploading ? 'Reading...' : 'Upload'}
                            </button>
                            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFile} />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">PDF, DOCX or TXT up to 5 MB, or paste the text. We keep only the extracted text.</p>

                        <textarea
                            className="input mt-3 h-56 resize-y font-mono text-xs leading-relaxed"
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            maxLength={20000}
                            placeholder="Paste your resume text here..."
                            aria-label="Resume text"
                        />

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                            <span>
                                {fileName && <span className="mr-2 font-medium text-gray-700">{fileName}</span>}
                                {resumeText.length.toLocaleString()} / 20,000
                                {savedAt && !unsaved && <span className="ml-2 text-emerald-600">Saved</span>}
                                {unsaved && resumeText && <span className="ml-2 text-amber-600">Not saved</span>}
                            </span>
                            <span className="flex items-center gap-2">
                                <button type="button" onClick={() => saveResume()} disabled={saving || !resumeReady || !unsaved} className="font-medium text-primary-600 hover:text-primary-700 disabled:text-gray-400">
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                                {savedAt && (
                                    <button type="button" onClick={removeResume} className="flex items-center gap-1 text-gray-400 hover:text-red-600" title="Delete saved resume">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </span>
                        </div>
                        {resumeText && !resumeReady && <p className="mt-2 text-xs text-amber-600">Add a bit more: at least {MIN_RESUME} characters.</p>}
                    </section>

                    <section className="card space-y-4 p-5">
                        <h3 className="text-base font-semibold text-gray-900">2. The job</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label" htmlFor="rt-role">Role <span className="font-normal text-gray-400">(optional)</span></label>
                                <input id="rt-role" className="input" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} maxLength={100} placeholder="Backend Engineer" />
                            </div>
                            <div>
                                <label className="label" htmlFor="rt-company">Company <span className="font-normal text-gray-400">(optional)</span></label>
                                <input id="rt-company" className="input" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={100} placeholder="Razorpay" />
                            </div>
                        </div>
                        <div>
                            <label className="label" htmlFor="rt-jd">Job description</label>
                            <textarea
                                id="rt-jd"
                                className="input h-44 resize-y"
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                maxLength={6000}
                                placeholder="Paste the full job posting here..."
                            />
                            <p className="mt-1 text-right text-xs text-gray-400">{jobDescription.length.toLocaleString()} / 6,000</p>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                            Remember this resume for next time
                        </label>

                        <button type="submit" disabled={analyzing || !resumeReady || !jdReady} className="btn-primary w-full py-3">
                            <DocumentMagnifyingGlassIcon className="h-4 w-4" />
                            {analyzing ? 'Analysing...' : 'Analyse my resume'}
                        </button>
                        {!jdReady && jobDescription && <p className="text-xs text-amber-600">The job description is a bit short. Paste the full posting.</p>}
                    </section>
                </form>

                <div className="lg:col-span-3" ref={resultRef}>
                    {analyzing ? (
                        <div className="card flex min-h-[22rem] flex-col items-center justify-center p-8 text-center">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600" />
                            <p className="mt-4 text-sm font-medium text-gray-900">Reading your resume against the job...</p>
                            <p className="mt-1 text-xs text-gray-500">This usually takes 10 to 20 seconds.</p>
                        </div>
                    ) : result ? (
                        <Results result={result} />
                    ) : (
                        <div className="card flex min-h-[22rem] flex-col items-center justify-center p-8 text-center">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
                                <DocumentMagnifyingGlassIcon className="h-7 w-7 text-primary-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-900">Your analysis will appear here</p>
                            <p className="mt-1 max-w-sm text-sm text-gray-500">Add your resume and a job description, then run the analysis. You'll get a match score, keyword gaps and rewrite ideas.</p>
                        </div>
                    )}
                </div>
            </div>

            {analyses.length > 0 && (
                <section className="mt-8">
                    <h3 className="mb-3 text-base font-semibold text-gray-900">Previous analyses</h3>
                    <ul className="card divide-y divide-gray-100">
                        {analyses.map((a) => (
                            <li key={a._id} className="flex items-center justify-between gap-3 p-4">
                                <button
                                    type="button"
                                    onClick={() => { setResult(a); resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                >
                                    <span className={`badge flex-none ${scoreStyle(a.matchScore).badge}`}>{a.matchScore}%</span>
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-medium text-gray-900">
                                            {[a.jobTitle, a.company].filter(Boolean).join(' at ') || 'Untitled analysis'}
                                        </span>
                                        <span className="block text-xs text-gray-500">
                                            {new Date(a.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </span>
                                </button>
                                <button onClick={() => deleteAnalysis(a._id)} className="text-gray-400 hover:text-red-500" title="Delete">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};

export default ResumeTailor;
