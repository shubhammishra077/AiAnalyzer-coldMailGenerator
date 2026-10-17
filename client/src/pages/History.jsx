import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { TrashIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import ResultCard from '../components/ResultCard';
import PageHeader from '../components/PageHeader';
import { STATUS_META, statusOf } from '../utils/tracking';

const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

const History = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openId, setOpenId] = useState(null);

    useEffect(() => {
        api.get('/ai/history')
            .then(({ data }) => setItems(data))
            .catch(() => toast.error('Could not load your history'))
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this entry? This cannot be undone.')) return;
        try {
            await api.delete(`/ai/history/${id}`);
            setItems((list) => list.filter((i) => i._id !== id));
            if (openId === id) setOpenId(null);
            toast.success('Deleted');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not delete');
        }
    };

    if (loading) return <div className="text-gray-500 text-sm">Loading history...</div>;

    if (items.length === 0) {
        return (
            <div className="card mx-auto max-w-2xl p-10 text-center">
                <p className="text-gray-600 text-sm">Nothing here yet.</p>
                <Link to="/dashboard/generate" className="inline-block mt-3 text-sm font-medium text-primary-600 hover:text-primary-500">
                    Generate your first email
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl">
            <PageHeader title="History" description="Everything you have generated. Click an entry to open it." />
            <div className="space-y-3">
                {items.map((item) => {
                    const isOpen = openId === item._id;
                    const label = [item.jobTitle, item.company].filter(Boolean).join(' at ') || item.prompt || 'Untitled';
                    return (
                        <div key={item._id} className="card">
                            <div className="flex items-center justify-between p-4">
                                <button
                                    onClick={() => setOpenId(isOpen ? null : item._id)}
                                    className="flex-1 text-left min-w-0"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="truncate text-sm font-medium text-gray-800">{label}</span>
                                        <span className={`badge flex-none ${STATUS_META[statusOf(item)].badge}`}>{STATUS_META[statusOf(item)].label}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 truncate mt-0.5">
                                        {item.subject} · {formatDate(item.createdAt)}
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleDelete(item._id)}
                                    className="ml-3 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Delete"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                            {isOpen && (
                                <div className="px-4 pb-2 border-t border-gray-100 pt-4">
                                    <ResultCard title="Subject Line" content={item.subject} />
                                    <ResultCard title="Cold Email" content={item.emailBody} />
                                    <ResultCard title="LinkedIn DM" content={item.linkedInDM} />
                                    <ResultCard title="Follow-up Email" content={item.followUpEmail} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default History;
