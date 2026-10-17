// Shared helpers for the outreach tracker (statuses, labels, date conversion)

export const STATUS_META = {
    draft: { label: 'Draft', badge: 'bg-gray-100 text-gray-700' },
    sent: { label: 'Sent', badge: 'bg-primary-50 text-primary-700' },
    replied: { label: 'Replied', badge: 'bg-emerald-50 text-emerald-700' },
    interview: { label: 'Interview', badge: 'bg-indigo-50 text-indigo-700' },
    offer: { label: 'Offer', badge: 'bg-green-100 text-green-800' },
    rejected: { label: 'Rejected', badge: 'bg-red-50 text-red-700' },
    no_response: { label: 'No response', badge: 'bg-amber-50 text-amber-700' },
};

export const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, m]) => ({ value, label: m.label }));

// Entries created before tracking existed have no status: they are drafts
export const statusOf = (item) => item.status || 'draft';

export const TABS = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Drafts', statuses: ['draft'] },
    { key: 'sent', label: 'Sent', statuses: ['sent'] },
    { key: 'replied', label: 'Replied', statuses: ['replied'] },
    { key: 'interview', label: 'Interview', statuses: ['interview'] },
    { key: 'offer', label: 'Offer', statuses: ['offer'] },
    { key: 'closed', label: 'Closed', statuses: ['rejected', 'no_response'] },
];

export const isFollowUpDue = (item) =>
    statusOf(item) === 'sent' && Boolean(item.followUpAt) && new Date(item.followUpAt) <= new Date();

export const formatDay = (iso) =>
    iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';

// <input type="date"> works with local calendar days. Store local noon so the day never shifts across timezones.
export const toDateInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const fromDateInput = (value) => (value ? new Date(`${value}T12:00:00`).toISOString() : null);
