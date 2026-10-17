import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PaperAirplaneIcon, ChevronDownIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';
import ResultCard from '../components/ResultCard';
import {
    STATUS_META, STATUS_OPTIONS, TABS, statusOf, isFollowUpDue, formatDay, toDateInput, fromDateInput,
} from '../utils/tracking';

// One-click next steps for each stage
const QUICK_ACTIONS = {
    draft: [{ status: 'sent', label: 'Mark as sent', primary: true }],
    sent: [{ status: 'replied', label: 'Got a reply', primary: true }, { status: 'no_response', label: 'No response' }],
    replied: [{ status: 'interview', label: 'Interview', primary: true }, { status: 'rejected', label: 'Rejected' }],
    interview: [{ status: 'offer', label: 'Offer', primary: true }, { status: 'rejected', label: 'Rejected' }],
};

const Details = ({ item, saving, onSave }) => {
    const initial = useMemo(() => ({
        status: statusOf(item),
        sentAt: toDateInput(item.sentAt),
        followUpAt: toDateInput(item.followUpAt),
        notes: item.notes || '',
    }), [item]);
    const [form, setForm] = useState(initial);
    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const save = (e) => {
        e.preventDefault();
        const payload = {};
        if (form.status !== initial.status) payload.status = form.status;
        if (form.status !== 'draft' && form.sentAt && form.sentAt !== initial.sentAt) payload.sentAt = fromDateInput(form.sentAt);
        if (form.status === 'sent' && form.followUpAt !== initial.followUpAt) payload.followUpAt = fromDateInput(form.followUpAt);
        if (form.notes !== initial.notes) payload.notes = form.notes;
        if (Object.keys(payload).length === 0) {
            toast('Nothing changed');
            return;
        }
        onSave(payload);
    };

    return (
        <div className="border-t border-gray-100 p-4 sm:p-5">
            <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="label" htmlFor={`st-${item._id}`}>Status</label>
                    <select id={`st-${item._id}`} className="input" value={form.status} onChange={set('status')}>
                        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
                {form.status !== 'draft' && (
                    <div>
                        <label className="label" htmlFor={`sd-${item._id}`}>Sent on</label>
                        <input id={`sd-${item._id}`} type="date" className="input" value={form.sentAt} max={toDateInput(new Date().toISOString())} onChange={set('sentAt')} />
                    </div>
                )}
                {form.status === 'sent' && (
                    <div>
                        <label className="label" htmlFor={`fu-${item._id}`}>Remind me to follow up on</label>
                        <input id={`fu-${item._id}`} type="date" className="input" value={form.followUpAt} onChange={set('followUpAt')} />
                    </div>
                )}
                <div className="sm:col-span-2">
                    <label className="label" htmlFor={`nt-${item._id}`}>Notes</label>
                    <textarea id={`nt-${item._id}`} className="input h-20 resize-none" value={form.notes} onChange={set('notes')} maxLength={1000} placeholder="Who you spoke to, what they said, next steps..." />
                </div>
                <div className="sm:col-span-2">
                    <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save changes'}</button>
                </div>
            </form>

            <div className="mt-6">
                <ResultCard title="Cold email" content={item.emailBody} />
                {statusOf(item) === 'sent' && <ResultCard title="Follow-up email (ready when you need it)" content={item.followUpEmail} />}
            </div>
        </div>
    );
};

const Row = ({ item, open, saving, onToggle, onUpdate }) => {
    const status = statusOf(item);
    const meta = STATUS_META[status];
    const due = isFollowUpDue(item);
    const label = [item.jobTitle, item.company].filter(Boolean).join(' at ') || item.prompt || 'Untitled';

    return (
        <li className={`card overflow-hidden ${due ? 'ring-1 ring-amber-300' : ''}`}>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-start gap-3 text-left" aria-expanded={open}>
                    <ChevronDownIcon className={`mt-1 h-4 w-4 flex-none text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                    <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-semibold text-gray-900">{label}</span>
                            <span className={`badge ${meta.badge}`}>{meta.label}</span>
                            {due && <span className="badge bg-amber-100 text-amber-800">Follow up due</span>}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-gray-500">{item.subject}</span>
                        <span className="mt-0.5 block text-xs text-gray-400">
                            {item.sentAt ? `Sent ${formatDay(item.sentAt)}` : `Created ${formatDay(item.createdAt)}`}
                            {status === 'sent' && item.followUpAt && !due && ` · follow up ${formatDay(item.followUpAt)}`}
                        </span>
                    </span>
                </button>

                <div className="flex flex-none flex-wrap gap-2 pl-7 sm:pl-0">
                    {(QUICK_ACTIONS[status] || []).map((a) => (
                        <button
                            key={a.status}
                            type="button"
                            disabled={saving}
                            onClick={() => onUpdate({ status: a.status })}
                            className={a.primary ? 'btn-primary px-3 py-1.5' : 'btn-secondary px-3 py-1.5'}
                        >
                            {a.status === 'sent' && <PaperAirplaneIcon className="h-4 w-4" />}
                            {a.label}
                        </button>
                    ))}
                </div>
            </div>
            {open && <Details item={item} saving={saving} onSave={onUpdate} />}
        </li>
    );
};

const Tracker = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('all');
    const [openId, setOpenId] = useState(null);
    const [savingId, setSavingId] = useState(null);

    useEffect(() => {
        api.get('/ai/history', { params: { limit: 100 } })
            .then(({ data }) => setItems(data))
            .catch(() => toast.error('Could not load your outreach'))
            .finally(() => setLoading(false));
    }, []);

    const counts = useMemo(() => {
        const c = { all: items.length };
        for (const t of TABS.slice(1)) c[t.key] = items.filter((i) => t.statuses.includes(statusOf(i))).length;
        return c;
    }, [items]);

    const dueCount = useMemo(() => items.filter(isFollowUpDue).length, [items]);

    const visible = useMemo(() => {
        const t = TABS.find((x) => x.key === tab);
        const list = tab === 'all' ? items : items.filter((i) => t.statuses.includes(statusOf(i)));
        // Overdue follow-ups first, then newest
        return [...list].sort((a, b) => Number(isFollowUpDue(b)) - Number(isFollowUpDue(a)) || new Date(b.createdAt) - new Date(a.createdAt));
    }, [items, tab]);

    const update = async (id, payload) => {
        setSavingId(id);
        try {
            const { data } = await api.patch(`/ai/history/${id}/tracking`, payload);
            setItems((list) => list.map((i) => (i._id === id ? { ...i, ...data } : i)));
            toast.success('Updated');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not update');
        } finally {
            setSavingId(null);
        }
    };

    if (loading) return <div className="text-sm text-gray-500">Loading...</div>;

    return (
        <div>
            <PageHeader
                title="Outreach tracker"
                description="Keep track of what you've sent, who replied and when to follow up. Statuses are updated by you; nothing reads your inbox."
            />

            {dueCount > 0 && (
                <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <BellAlertIcon className="h-5 w-5 flex-none" />
                    <span>
                        <strong>{dueCount}</strong> {dueCount === 1 ? 'email is' : 'emails are'} due for a follow-up. Open one to copy its follow-up draft.
                    </span>
                </div>
            )}

            <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter by status">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        role="tab"
                        aria-selected={tab === t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex flex-none items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                            tab === t.key ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:text-gray-900'
                        }`}
                    >
                        {t.label}
                        <span className={`rounded-full px-1.5 text-xs ${tab === t.key ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>{counts[t.key]}</span>
                    </button>
                ))}
            </div>

            {items.length === 0 ? (
                <div className="card p-10 text-center">
                    <p className="text-sm text-gray-600">Nothing to track yet.</p>
                    <Link to="/dashboard/generate" className="mt-3 inline-block text-sm font-medium text-primary-600 hover:text-primary-500">Generate your first email</Link>
                </div>
            ) : visible.length === 0 ? (
                <div className="card p-10 text-center text-sm text-gray-500">No emails in this stage.</div>
            ) : (
                <ul className="space-y-3">
                    {visible.map((item) => (
                        <Row
                            key={item._id}
                            item={item}
                            open={openId === item._id}
                            saving={savingId === item._id}
                            onToggle={() => setOpenId(openId === item._id ? null : item._id)}
                            onUpdate={(payload) => update(item._id, payload)}
                        />
                    ))}
                </ul>
            )}
            {items.length >= 100 && <p className="mt-4 text-xs text-gray-400">Showing your 100 most recent emails.</p>}
        </div>
    );
};

export default Tracker;
